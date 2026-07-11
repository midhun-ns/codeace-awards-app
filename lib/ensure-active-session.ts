import type { Session } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getCachedActiveSession,
  invalidateActiveSessionCache,
  setCachedActiveSession,
} from "@/lib/active-session-cache";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const inflightByTopic = new Map<number, Promise<Session>>();

async function loadActiveSessionFromDb(topicId: number, now = new Date()) {
  return prisma.session.findFirst({
    where: {
      topicId,
      isActive: true,
      expiresAt: { gt: now },
    },
  });
}

async function createActiveSession(topicId: number) {
  const now = new Date();

  try {
    await prisma.session.updateMany({
      where: { topicId, isActive: true },
      data: { isActive: false },
    });

    const session = await prisma.session.create({
      data: {
        topicId,
        isActive: true,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    invalidateActiveSessionCache(topicId);
    setCachedActiveSession(topicId, session);
    return session;
  } catch {
    const session = await loadActiveSessionFromDb(topicId, now);
    if (session) {
      setCachedActiveSession(topicId, session);
      return session;
    }

    throw new Error("Failed to ensure active session");
  }
}

async function resolveActiveSession(topicId: number) {
  const cached = getCachedActiveSession(topicId);
  if (cached) {
    return cached;
  }

  const existing = await loadActiveSessionFromDb(topicId);
  if (existing) {
    setCachedActiveSession(topicId, existing);
    return existing;
  }

  return createActiveSession(topicId);
}

export async function ensureActiveSession(topicId: number) {
  const cached = getCachedActiveSession(topicId);
  if (cached) {
    return cached;
  }

  const inflight = inflightByTopic.get(topicId);
  if (inflight) {
    return inflight;
  }

  const promise = resolveActiveSession(topicId).finally(() => {
    inflightByTopic.delete(topicId);
  });

  inflightByTopic.set(topicId, promise);
  return promise;
}
