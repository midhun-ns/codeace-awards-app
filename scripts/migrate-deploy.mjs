import { execSync } from "child_process";

const databaseUrl = process.env.DATABASE_URL ?? "";
const isVercel = Boolean(process.env.VERCEL);

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function skip(message) {
  console.warn(`\n${message}\n`);
  process.exit(0);
}

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env });
}

if (databaseUrl.startsWith("file:")) {
  if (isVercel) {
    skip(
      "Skipping schema sync: SQLite file URLs do not work on Vercel.\n" +
        "Set DATABASE_URL=libsql://<your-db>.turso.io and TURSO_AUTH_TOKEN for production."
    );
  }

  run("npx prisma migrate deploy");
  process.exit(0);
}

if (databaseUrl.startsWith("libsql://")) {
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!authToken) {
    fail("TURSO_AUTH_TOKEN is required when DATABASE_URL uses libsql://");
  }

  if (!databaseUrl.includes("authToken=")) {
    const separator = databaseUrl.includes("?") ? "&" : "?";
    process.env.DATABASE_URL = `${databaseUrl}${separator}authToken=${authToken}`;
  }

  run("npx prisma db push --skip-generate --accept-data-loss");
  process.exit(0);
}

if (isVercel) {
  skip(
    "Skipping schema sync: Turso is not configured yet.\n" +
      "Set DATABASE_URL=libsql://<your-db>.turso.io and TURSO_AUTH_TOKEN in Vercel for production data."
  );
}

console.log("No remote database configured — skipping schema sync.");
