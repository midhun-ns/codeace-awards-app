import type { Session } from "@prisma/client";
import { signVoteSessionToken } from "@/lib/vote-session-token";

export function formatSessionForClient(session: Session) {
  return {
    id: signVoteSessionToken(session),
    topicId: session.topicId,
    isActive: session.isActive,
    expiresAt: session.expiresAt,
  };
}
