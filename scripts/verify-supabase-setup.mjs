import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const env = {};
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    console.error("❌ .env.local 파일을 찾을 수 없습니다.");
    process.exit(1);
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY가 없습니다.");
  process.exit(1);
}

console.log("Supabase 설정 확인\n");
console.log(`  URL: ${url}`);
console.log(`  Key: ${key.slice(0, 12)}…\n`);

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

async function checkProfilesTable() {
  const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, { headers });
  if (res.status === 200) {
    console.log("✅ profiles 테이블 — 존재함");
    return true;
  }
  if (res.status === 404 || res.status === 406) {
    console.log("❌ profiles 테이블 — 없음 (SQL 마이그레이션 필요)");
    return false;
  }
  const body = await res.text();
  console.log(`⚠️  profiles 테이블 — 확인 실패 (HTTP ${res.status})`);
  if (body) console.log(`   ${body.slice(0, 120)}`);
  return false;
}

async function checkAuthHealth() {
  const res = await fetch(`${url}/auth/v1/health`, { headers });
  if (res.ok) {
    console.log("✅ Auth API — 응답 정상");
    return true;
  }
  console.log(`⚠️  Auth API — HTTP ${res.status}`);
  return false;
}

async function checkGoogleProvider() {
  const res = await fetch(`${url}/auth/v1/authorize?provider=google`, {
    headers,
    redirect: "manual",
  });

  const location = res.headers.get("location") ?? "";

  if (res.status === 302 && location.includes("accounts.google.com")) {
    console.log("✅ Google Provider — 활성화됨");
    return true;
  }

  if (res.status === 302 && location.includes("error")) {
    console.log("❌ Google Provider — 비활성화 또는 설정 미완료");
    console.log(`   ${location.slice(0, 120)}`);
    return false;
  }

  console.log(`⚠️  Google Provider — 확인 불가 (HTTP ${res.status})`);
  if (location) console.log(`   redirect: ${location.slice(0, 120)}`);
  return false;
}

const [profilesOk, authOk, googleOk] = await Promise.all([
  checkProfilesTable(),
  checkAuthHealth(),
  checkGoogleProvider(),
]);

console.log("\n---");
if (profilesOk && googleOk) {
  console.log("🎉 Google 회원가입/로그인 준비 완료. npm run dev 후 /signup 에서 테스트하세요.");
} else {
  console.log("📋 docs/SUPABASE_GOOGLE_SETUP.ko.md 가이드를 따라 남은 설정을 완료하세요.");
  if (!profilesOk) {
    console.log("   → 1단계: SQL 마이그레이션 실행");
  }
  if (!googleOk) {
    console.log("   → 2~3단계: Google Cloud OAuth + Supabase Provider 설정");
  }
}

process.exit(profilesOk && googleOk ? 0 : 1);
