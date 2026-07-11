import { createHmac, timingSafeEqual } from "crypto";
import type { Session } from "@prisma/client";

interface VoteSessionPayload {
  sid: string;
  tid: number;
  exp: number;
}

function getSigningSecret() {
  return (
    process.env.SESSION_SIGNING_SECRET?.trim() ||
    process.env.APP_PASSWORD?.trim() ||
    null
  );
}

function encodePayload(payload: VoteSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function signVoteSessionToken(session: Session) {
  const secret = getSigningSecret();
  if (!secret) {
    return session.id;
  }

  const payload: VoteSessionPayload = {
    sid: session.id,
    tid: session.topicId,
    exp: session.expiresAt.getTime(),
  };

  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`;
}

export function verifyVoteSessionToken(
  token: string,
  expectedTopicId: number
): { sessionId: string; topicId: number } | null {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return null;
  }

  const encodedPayload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  let expectedSignature: string;
  try {
    const secret = getSigningSecret();
    if (!secret) {
      return null;
    }
    expectedSignature = signPayload(encodedPayload, secret);
  } catch {
    return null;
  }

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as VoteSessionPayload;

    if (
      typeof payload.sid !== "string" ||
      typeof payload.tid !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.tid !== expectedTopicId || payload.exp <= Date.now()) {
      return null;
    }

    return { sessionId: payload.sid, topicId: payload.tid };
  } catch {
    return null;
  }
}

export function isUuidSessionToken(token: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    token
  );
}
