import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreSchema, domainSchema } from "@/lib/validators";
import {
  getCachedSessionTokenValidity,
  setCachedSessionTokenValidity,
} from "@/lib/active-session-cache";
import { getRateTopic } from "@/lib/get-rate-topic";

export const dynamic = "force-dynamic";

function isPrismaUniqueError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

async function isSessionTokenValid(topicId: number, sessionToken: string) {
  const cached = getCachedSessionTokenValidity(topicId, sessionToken);
  if (cached !== null) {
    return cached;
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionToken,
      topicId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  const valid = Boolean(session);
  setCachedSessionTokenValidity(topicId, sessionToken, valid);
  return valid;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = scoreSchema.parse(body);
    domainSchema.parse(validated.email);

    const presenterIds = validated.ratings.map((entry) => entry.presenterId);

    const [sessionValid, topic] = await Promise.all([
      isSessionTokenValid(validated.topicId, validated.sessionToken),
      getRateTopic(validated.topicId),
    ]);

    if (!sessionValid) {
      return NextResponse.json(
        { error: "Invalid or expired session token" },
        { status: 403 }
      );
    }

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const validPresenterIds = new Set(topic.presenters.map((presenter) => presenter.id));
    const allPresentersValid = presenterIds.every((presenterId) =>
      validPresenterIds.has(presenterId)
    );

    if (!allPresentersValid) {
      return NextResponse.json(
        { error: "Rating contains a presenter not in this topic" },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const result = await prisma.score.createMany({
      data: validated.ratings.map((entry) => ({
        presenterId: entry.presenterId,
        topicId: validated.topicId,
        email: validated.email,
        rating: entry.rating,
        sessionToken: validated.sessionToken,
        ipAddress,
      })),
    });

    return NextResponse.json({ success: true, count: result.count }, { status: 201 });
  } catch (error: unknown) {
    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        { error: "You have already rated this presentation" },
        { status: 409 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      const zodError = error as unknown as { errors: unknown };
      return NextResponse.json({ error: zodError.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.score.deleteMany();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reset votes" }, { status: 500 });
  }
}
