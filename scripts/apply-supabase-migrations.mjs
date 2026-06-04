/**
 * Apply SQL migrations via Supabase Management API.
 * Requires: .env.local → SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

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
  console.error("❌ SUPABASE_ACCESS_TOKEN missing in .env.local");
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), "supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

function isSkippableError(message) {
  const lower = message.toLowerCase();
  return (
    lower.includes("already exists") ||
    lower.includes("duplicate_object") ||
    lower.includes("duplicate key")
  );
}

async function runQuery(query, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      typeof body === "object" && body?.message
        ? body.message
        : typeof body === "string"
          ? body.slice(0, 400)
          : JSON.stringify(body)?.slice(0, 400);
    if (isSkippableError(message)) {
      return { skipped: true, message };
    }
    throw new Error(`${label} failed (HTTP ${res.status}): ${message}`);
  }

  return body;
}

async function checkMemberRegistryRealtime() {
  const query = `
    select tablename as table_name
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename in ('member_registry', 'site_operator_menus');
  `;
  const rows = await runQuery(query, "realtime check");
  return rows ?? [];
}

async function main() {
  console.log(`Applying migrations to project ${projectRef}…\n`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`▶ ${file}`);
    const result = await runQuery(sql, file);
    if (result?.skipped) {
      console.log(`  ⏭️  skipped (already applied)`);
    } else {
      console.log(`  ✅ ok`);
    }
  }

  console.log("\nRealtime publication tables:");
  const tables = await checkMemberRegistryRealtime();
  if (!Array.isArray(tables) || tables.length === 0) {
    console.log("  ⚠️  member_registry not in supabase_realtime — check Dashboard → Database → Replication");
  } else {
    for (const row of tables) {
      console.log(`  ✅ ${row.table_name}`);
    }
  }

  const hasMember = tables?.some((r) => r.table_name === "member_registry");
  if (!hasMember) {
    process.exit(1);
  }

  console.log("\n🎉 Migrations applied.");
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exit(1);
});
