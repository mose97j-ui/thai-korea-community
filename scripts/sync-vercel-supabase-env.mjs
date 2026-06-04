/**
 * Push Supabase env from .env.local → Vercel Production (required for /api/members).
 */
import { readFileSync } from "node:fs";
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

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const env = loadEnvLocal();

for (const key of KEYS) {
  const value = env[key];
  if (!value || value.includes("your-")) {
    console.log(`⏭️  ${key} — .env.local에 없음, 건너뜀`);
    continue;
  }

  try {
    execSync(
      `npx vercel env add ${key} production --value "${value.replace(/"/g, '\\"')}" --yes --force --sensitive`.trim(),
      { stdio: "pipe", cwd: process.cwd() }
    );
    console.log(`✅ Vercel production — ${key}`);
  } catch (error) {
    const stderr = error.stderr?.toString() ?? "";
    console.error(`❌ ${key} 설정 실패`);
    if (stderr.trim()) {
      console.error(stderr.trim().split("\n")[0]);
    }
    process.exit(1);
  }
}

console.log("\n다음: npm run deploy:prod");
