/**
 * Fetch service_role from Supabase Management API and set on Vercel + .env.local.
 * Requires .env.local: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const env = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnvLocal();
const projectRef = env.SUPABASE_PROJECT_REF ?? "vniflkqbmybgfnoekxny";
const accessToken = env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error("❌ .env.local에 SUPABASE_ACCESS_TOKEN이 필요합니다.");
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});

if (!res.ok) {
  console.error("❌ Supabase API keys 조회 실패:", res.status);
  process.exit(1);
}

const keys = await res.json();
const service = Array.isArray(keys)
  ? keys.find((item) => item.name === "service_role")
  : null;
const serviceKey = service?.api_key;

if (!serviceKey) {
  console.error("❌ service_role 키를 찾지 못했습니다.");
  process.exit(1);
}

const envPath = resolve(process.cwd(), ".env.local");
let local = readFileSync(envPath, "utf8");
if (!/^SUPABASE_SERVICE_ROLE_KEY=/m.test(local)) {
  local = `${local.trimEnd()}\nSUPABASE_SERVICE_ROLE_KEY=${serviceKey}\n`;
  writeFileSync(envPath, local);
  console.log("✅ .env.local에 SUPABASE_SERVICE_ROLE_KEY 추가");
} else {
  local = local.replace(
    /^SUPABASE_SERVICE_ROLE_KEY=.*$/m,
    `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`
  );
  writeFileSync(envPath, local);
  console.log("✅ .env.local의 SUPABASE_SERVICE_ROLE_KEY 갱신");
}

const targets = [
  { name: "production", extraArgs: "" },
  { name: "preview", extraArgs: "" },
];

for (const { name, extraArgs } of targets) {
  try {
    execSync(
      `npx vercel env add SUPABASE_SERVICE_ROLE_KEY ${name} ${extraArgs} --value "${serviceKey.replace(/"/g, '\\"')}" --yes --force --sensitive`.trim(),
      { stdio: "pipe", cwd: process.cwd() }
    );
    console.log(`✅ Vercel ${name} 환경 변수 설정`);
  } catch (error) {
    const stderr = error.stderr?.toString() ?? "";
    if (name === "preview") {
      console.log("ℹ️ Preview 환경 변수는 건너뜀 (Production만 사용해도 됩니다).");
      if (stderr.trim()) {
        console.log(stderr.trim().split("\n")[0]);
      }
      continue;
    }
    console.error(`❌ Vercel ${name} 설정 실패`);
    process.exit(1);
  }
}

console.log("\n다음: npm run deploy:prod 로 재배포하면 회원 동기화 API가 활성화됩니다.");
