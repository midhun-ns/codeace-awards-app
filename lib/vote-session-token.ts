import { createHmac, timingSafeEqual } from "crypto";
import type { Session } from "@prisma/client";

interface VoteSessionPayload {
  sid: string;
  tid: number;
  exp: number;
}

function getSigningSecret() {
  const secret = process.env.APP_PASSWORD?.trim();
  if (!secret) {
    throw new Error("APP_PASSWORD is required for vote session signing");
  }
  return secret;
}

function encodePayload(payload: VoteSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function signVoteSessionToken(session: Session) {
  const payload: VoteSessionPayload = {
    sid: session.id,
    tid: session.topicId,
    exp: session.expiresAt.getTime(),
  };

  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
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
    expectedSignature = signPayload(encodedPayload);
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
