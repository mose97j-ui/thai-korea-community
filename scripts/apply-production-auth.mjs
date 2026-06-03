/**
 * Supabase Auth URL + Google Provider를 배포용으로 설정합니다.
 * 필요: .env.local 의 SUPABASE_ACCESS_TOKEN, GOOGLE_OAUTH_* 
 */
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

async function getCurrentAuthConfig() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

async function main() {
  if (!accessToken) {
    console.error("❌ SUPABASE_ACCESS_TOKEN이 없습니다.");
    console.error("   https://supabase.com/dashboard/account/tokens");
    console.error("   .env.local 에 추가 후 다시 실행: npm run apply:production-auth");
    process.exit(1);
  }

  if (!clientId || !clientSecret) {
    console.error("❌ GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET 필요");
    process.exit(1);
  }

  console.log("현재 Supabase Auth 설정 확인…");
  const current = await getCurrentAuthConfig();
  if (current) {
    console.log(`  site_url: ${current.site_url ?? "(없음)"}`);
    console.log(`  uri_allow_list: ${current.uri_allow_list ?? "(없음)"}`);
    console.log(`  google enabled: ${current.external_google_enabled ?? false}`);
  }

  const payload = {
    external_google_enabled: true,
    external_google_client_id: clientId,
    external_google_secret: clientSecret,
    site_url: productionSiteUrl.replace(/\/$/, ""),
    uri_allow_list: redirectUrls.join(","),
  };

  console.log("\n배포용 Auth 설정 적용…");
  console.log(`  Site URL: ${payload.site_url}`);
  for (const url of redirectUrls) {
    console.log(`  Redirect: ${url}`);
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`❌ 실패 HTTP ${res.status}`);
    console.error((await res.text()).slice(0, 600));
    process.exit(1);
  }

  console.log("\n✅ Supabase Google + Redirect URLs 설정 완료");
  console.log("다음: Google Cloud → OAuth consent screen → Publish App");
  console.log("      Google Cloud → Credentials → origins에 배포 URL 추가");
}

main();
