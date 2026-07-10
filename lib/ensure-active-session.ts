import { prisma } from "@/lib/prisma";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export async function ensureActiveSession(topicId: number) {
  const now = new Date();
  const existing = await prisma.session.findFirst({
    where: {
      topicId,
      isActive: true,
      expiresAt: { gt: now },
    },
  });

  if (existing) {
    return existing;
  }

  try {
    await prisma.session.updateMany({
      where: { topicId, isActive: true },
      data: { isActive: false },
    });

    return await prisma.session.create({
      data: {
        topicId,
        isActive: true,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });
  } catch {
    const session = await prisma.session.findFirst({
      where: {
        topicId,
        isActive: true,
        expiresAt: { gt: now },
      },
    });

    if (session) {
      return session;
    }

    throw new Error("Failed to ensure active session");
  }
}
