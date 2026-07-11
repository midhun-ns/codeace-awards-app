import { createClient, type Client } from "@libsql/client";

const globalForTurso = globalThis as unknown as { tursoClient: Client | null };

function isTursoUrl(url: string) {
  return (
    url.startsWith("libsql://") ||
    (url.startsWith("https://") && url.includes("turso"))
  );
}

export function getTursoClient(): Client | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!databaseUrl || !isTursoUrl(databaseUrl)) {
    return null;
  }

  if (!globalForTurso.tursoClient) {
    globalForTurso.tursoClient = createClient({
      url: databaseUrl,
      authToken,
    });
  }

  return globalForTurso.tursoClient;
}
