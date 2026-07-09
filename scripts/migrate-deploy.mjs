import { execSync } from "child_process";

const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (
  databaseUrl?.startsWith("libsql://") &&
  authToken &&
  !databaseUrl.includes("authToken=")
) {
  const separator = databaseUrl.includes("?") ? "&" : "?";
  process.env.DATABASE_URL = `${databaseUrl}${separator}authToken=${authToken}`;
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
