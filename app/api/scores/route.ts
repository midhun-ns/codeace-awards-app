import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreSchema } from "@/lib/validators";
import {
  resolveVoteSessionFast,
  resolveVoteSessionFromDb,
} from "@/lib/resolve-vote-session";
import { getCachedRateTopic } from "@/lib/rate-topic-cache";
import { getRateTopic } from "@/lib/get-rate-topic";
import { insertScores, isUniqueConstraintError } from "@/lib/insert-scores";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = scoreSchema.parse(body);

    let resolvedSession = resolveVoteSessionFast(
      validated.topicId,
      validated.sessionToken
    );

    if (resolvedSession === undefined) {
      resolvedSession = await resolveVoteSessionFromDb(
        validated.topicId,
        validated.sessionToken
      );
    }

    if (!resolvedSession) {
      return NextResponse.json(
        { error: "Invalid or expired session token" },
        { status: 403 }
      );
    }

    let topic = getCachedRateTopic(validated.topicId);
    if (!topic) {
      topic = await getRateTopic(validated.topicId);
    }

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const validPresenterIds = new Set(topic.presenters.map((presenter) => presenter.id));
    const allPresentersValid = validated.ratings.every((entry) =>
      validPresenterIds.has(entry.presenterId)
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

    const count = await insertScores(
      validated.ratings.map((entry) => ({
        presenterId: entry.presenterId,
        topicId: validated.topicId,
        voterId: validated.voterId,
        rating: entry.rating,
        sessionToken: resolvedSession.sessionId,
        ipAddress,
      }))
    );

    return NextResponse.json({ success: true, count }, { status: 201 });
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
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
