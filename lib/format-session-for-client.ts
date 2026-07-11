import type { Session } from "@prisma/client";
import { setCachedSessionTokenValidity } from "@/lib/active-session-cache";
import { signVoteSessionToken } from "@/lib/vote-session-token";

export function formatSessionForClient(session: Session) {
  const id = signVoteSessionToken(session);
  setCachedSessionTokenValidity(session.topicId, id, true);
  setCachedSessionTokenValidity(session.topicId, session.id, true);

  return {
    id,
    topicId: session.topicId,
    isActive: session.isActive,
    expiresAt: session.expiresAt,
  };
}
