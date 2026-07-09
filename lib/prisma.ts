import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function isTursoUrl(url: string) {
  return url.startsWith("libsql://") || (url.startsWith("https://") && url.includes("turso"));
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (databaseUrl && isTursoUrl(databaseUrl)) {
    // Lazy require keeps libsql packages out of the webpack client bundle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    return new PrismaClient({
      adapter: new PrismaLibSQL({
        url: databaseUrl,
        authToken,
      }),
    });
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
