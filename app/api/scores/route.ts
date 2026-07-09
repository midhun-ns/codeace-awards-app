import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreSchema, domainSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = scoreSchema.parse(body);

    // Validate email domain
    domainSchema.parse(validated.email);

    // Check if session is valid, active, and belongs to the topic
    const session = await prisma.session.findFirst({
      where: {
        id: validated.sessionToken,
        topicId: validated.topicId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session token" },
        { status: 403 }
      );
    }

    // Verify every rated presenter belongs to this topic
    const topicPresenters = await prisma.presenter.findMany({
      where: { topicId: validated.topicId },
      select: { id: true },
    });
    const topicPresenterIds = new Set(topicPresenters.map((presenter) => presenter.id));
    const invalidPresenter = validated.ratings.some(
      (entry) => !topicPresenterIds.has(entry.presenterId)
    );

    if (invalidPresenter) {
      return NextResponse.json(
        { error: "Rating contains a presenter not in this topic" },
        { status: 400 }
      );
    }

    // Check for duplicate votes (any presenter already rated in this session)
    const existing = await prisma.score.findFirst({
      where: {
        email: validated.email,
        sessionToken: validated.sessionToken,
        presenterId: { in: validated.ratings.map((entry) => entry.presenterId) },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already rated this presentation" },
        { status: 409 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const scores = await prisma.$transaction(
      validated.ratings.map((entry) =>
        prisma.score.create({
          data: {
            presenterId: entry.presenterId,
            topicId: validated.topicId,
            email: validated.email,
            rating: entry.rating,
            sessionToken: validated.sessionToken,
            ipAddress,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: scores.length }, { status: 201 });
  } catch (error: unknown) {
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
