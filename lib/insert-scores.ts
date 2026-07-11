import { prisma } from "@/lib/prisma";
import { getTursoClient } from "@/lib/turso-client";

export interface ScoreInsertInput {
  presenterId: number;
  topicId: number;
  email: string;
  rating: number;
  sessionToken: string;
  ipAddress: string;
}

export function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("UNIQUE constraint failed");
}

export async function insertScores(rows: ScoreInsertInput[]): Promise<number> {
  if (rows.length === 0) return 0;

  const client = getTursoClient();
  if (!client) {
    const result = await prisma.score.createMany({ data: rows });
    return result.count;
  }

  const placeholders = rows
    .map(() => "(?, ?, ?, ?, ?, ?, unixepoch())")
    .join(", ");
  const args = rows.flatMap((row) => [
    row.presenterId,
    row.topicId,
    row.email,
    row.rating,
    row.sessionToken,
    row.ipAddress,
  ]);

  const sql = `INSERT INTO "Score" ("presenterId", "topicId", "email", "rating", "sessionToken", "ipAddress", "createdAt") VALUES ${placeholders}`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await client.execute({ sql, args });
      return result.rowsAffected ?? rows.length;
    } catch (error) {
      lastError = error;
      if (isUniqueConstraintError(error)) {
        throw error;
      }
      if (attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 25 * attempt));
    }
  }

  throw lastError;
}
