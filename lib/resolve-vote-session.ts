import { prisma } from "@/lib/prisma";
import {
  getCachedActiveSession,
  getCachedSessionTokenValidity,
  setCachedSessionTokenValidity,
} from "@/lib/active-session-cache";
import {
  isUuidSessionToken,
  verifyVoteSessionToken,
} from "@/lib/vote-session-token";

export interface ResolvedVoteSession {
  sessionId: string;
  topicId: number;
}

export async function resolveVoteSession(
  topicId: number,
  sessionToken: string
): Promise<ResolvedVoteSession | null> {
  const signed = verifyVoteSessionToken(sessionToken, topicId);
  if (signed) {
    setCachedSessionTokenValidity(topicId, sessionToken, true);
    return signed;
  }

  const cachedActive = getCachedActiveSession(topicId);
  if (cachedActive?.id === sessionToken) {
    setCachedSessionTokenValidity(topicId, sessionToken, true);
    return { sessionId: sessionToken, topicId };
  }

  const cachedValidity = getCachedSessionTokenValidity(topicId, sessionToken);
  if (cachedValidity === false) {
    return null;
  }

  if (cachedValidity === true && isUuidSessionToken(sessionToken)) {
    return { sessionId: sessionToken, topicId };
  }

  if (!isUuidSessionToken(sessionToken)) {
    setCachedSessionTokenValidity(topicId, sessionToken, false);
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionToken,
      topicId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, topicId: true },
  });

  if (!session) {
    setCachedSessionTokenValidity(topicId, sessionToken, false);
    return null;
  }

  setCachedSessionTokenValidity(topicId, sessionToken, true);
  return { sessionId: session.id, topicId: session.topicId };
}
