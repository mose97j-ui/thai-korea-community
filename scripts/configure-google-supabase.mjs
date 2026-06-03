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
const projectRef = env.SUPABASE_PROJECT_REF ?? "vniflkqbmybgfnoekxny";
const accessToken = env.SUPABASE_ACCESS_TOKEN;
const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
const productionSiteUrl =
  env.NEXT_PUBLIC_SITE_URL ?? "https://thai-korea-community.vercel.app";

const redirectUrls = [
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/**",
  `${productionSiteUrl.replace(/\/$/, "")}/auth/callback`,
  `${productionSiteUrl.replace(/\/$/, "")}/**`,
];

if (!accessToken) {
  console.error("❌ SUPABASE_ACCESS_TOKEN이 없습니다.\n");
  console.error("1. https://supabase.com/dashboard/account/tokens 에서 토큰 발급");
  console.error("2. .env.local 에 SUPABASE_ACCESS_TOKEN=... 추가");
  console.error("3. npm run setup:google 다시 실행\n");
  console.error("또는 Supabase 대시보드에서 직접 입력:");
  console.error(`   https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`);
  console.error("\n등록할 Redirect URLs:");
  for (const url of redirectUrls) {
    console.error(`   - ${url}`);
  }
  process.exit(1);
}

if (!clientId || !clientSecret) {
  console.error("❌ GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET 이 .env.local 에 필요합니다.");
  process.exit(1);
}

const payload = {
  external_google_enabled: true,
  external_google_client_id: clientId,
  external_google_secret: clientSecret,
  site_url: productionSiteUrl.replace(/\/$/, ""),
  uri_allow_list: redirectUrls.join(","),
};

console.log(`Supabase Google OAuth 설정 중 (${projectRef})…\n`);
console.log(`  Site URL: ${payload.site_url}`);
console.log(`  Redirect URLs: ${redirectUrls.join(", ")}\n`);

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const body = await res.text();
  console.error(`❌ 설정 실패 (HTTP ${res.status})`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

console.log("✅ Google Provider 활성화");
console.log("✅ Site URL 및 Redirect URLs (로컬 + 배포) 등록");
console.log("\n다음: Google Cloud Console에서도 배포 도메인을 추가하고 OAuth 앱을 Publish 하세요.");
console.log("   docs/GOOGLE_PUBLIC_SIGNUP.ko.md 참고");
console.log("\n확인: npm run verify:supabase");
