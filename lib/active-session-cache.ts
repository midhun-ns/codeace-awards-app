import type { Session } from "@prisma/client";

const SESSION_CACHE_TTL_MS = 60_000;
const TOKEN_VALIDITY_TTL_MS = 120_000;

interface CachedSession {
  session: Session;
  cachedAt: number;
}

interface CachedTokenValidity {
  valid: boolean;
  cachedAt: number;
}

const activeSessionByTopic = new Map<number, CachedSession>();
const tokenValidityByKey = new Map<string, CachedTokenValidity>();

function tokenCacheKey(topicId: number, sessionToken: string) {
  return `${topicId}:${sessionToken}`;
}

function isSessionStillActive(session: Session, now = new Date()) {
  return session.isActive && session.expiresAt > now;
}

export function getCachedActiveSession(topicId: number): Session | null {
  const entry = activeSessionByTopic.get(topicId);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt > SESSION_CACHE_TTL_MS) {
    activeSessionByTopic.delete(topicId);
    return null;
  }

  if (!isSessionStillActive(entry.session)) {
    activeSessionByTopic.delete(topicId);
    return null;
  }

  return entry.session;
}

export function setCachedActiveSession(topicId: number, session: Session) {
  if (!isSessionStillActive(session)) return;
  activeSessionByTopic.set(topicId, { session, cachedAt: Date.now() });
}

export function invalidateActiveSessionCache(topicId: number) {
  activeSessionByTopic.delete(topicId);

  for (const key of tokenValidityByKey.keys()) {
    if (key.startsWith(`${topicId}:`)) {
      tokenValidityByKey.delete(key);
    }
  }
}

export function getCachedSessionTokenValidity(
  topicId: number,
  sessionToken: string
): boolean | null {
  const entry = tokenValidityByKey.get(tokenCacheKey(topicId, sessionToken));
  if (!entry) return null;

  if (Date.now() - entry.cachedAt > TOKEN_VALIDITY_TTL_MS) {
    tokenValidityByKey.delete(tokenCacheKey(topicId, sessionToken));
    return null;
  }

  return entry.valid;
}

export function setCachedSessionTokenValidity(
  topicId: number,
  sessionToken: string,
  valid: boolean
) {
  tokenValidityByKey.set(tokenCacheKey(topicId, sessionToken), {
    valid,
    cachedAt: Date.now(),
  });
}
