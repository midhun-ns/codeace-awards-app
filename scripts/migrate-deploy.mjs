import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL ?? "";
const isVercel = Boolean(process.env.VERCEL);

function skip(message) {
  console.warn(`\n${message}\n`);
  process.exit(0);
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

function isTursoUrl(url) {
  return url.startsWith("libsql://") || (url.startsWith("https://") && url.includes("turso"));
}

async function syncTursoSchema() {
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!authToken) {
    fail("TURSO_AUTH_TOKEN is required when DATABASE_URL points to Turso.");
  }

  const client = createClient({ url: databaseUrl, authToken });

  const existing = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Topic'"
  );

  if (existing.rows.length > 0) {
    console.log("Turso schema already exists — applying index migrations.");
    await client.execute(
      'CREATE INDEX IF NOT EXISTS "Session_topicId_isActive_expiresAt_idx" ON "Session"("topicId", "isActive", "expiresAt")'
    );
    return;
  }

  const migrationPath = join(
    __dirname,
    "../prisma/migrations/20260709180634_individual_presenter_ratings/migration.sql"
  );
  const sql = readFileSync(migrationPath, "utf8");

  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.execute(statement);
  }

  console.log("Turso schema synced successfully.");
}

if (databaseUrl.startsWith("file:")) {
  if (isVercel) {
    skip(
      "Skipping schema sync: SQLite file URLs do not work on Vercel.\n" +
        "Set DATABASE_URL to your Turso URL and TURSO_AUTH_TOKEN for production."
    );
  }

  run("npx prisma migrate deploy");
  process.exit(0);
}

if (isTursoUrl(databaseUrl)) {
  try {
    await syncTursoSchema();
  } catch (error) {
    console.error("Turso schema sync failed:", error);
    fail(
      "Could not sync schema to Turso. Verify DATABASE_URL and TURSO_AUTH_TOKEN in Vercel."
    );
  }
  process.exit(0);
}

if (isVercel) {
  skip(
    "Skipping schema sync: Turso is not configured yet.\n" +
      "Set DATABASE_URL to your Turso URL and TURSO_AUTH_TOKEN in Vercel for production data."
  );
}

console.log("No remote database configured — skipping schema sync.");
