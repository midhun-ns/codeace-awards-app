import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTopicSchema } from "@/lib/validators";
import { ensureActiveSession } from "@/lib/ensure-active-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { order: "asc" },
      include: {
        presenters: {
          include: { scores: { select: { rating: true } } },
        },
        sessions: {
          where: { isActive: true, expiresAt: { gt: new Date() } },
          take: 1,
        },
      },
    });

    await Promise.all(
      topics
        .filter((topic) => topic.sessions.length === 0)
        .map((topic) => ensureActiveSession(topic.id))
    );

    const mapped = topics.map((topic) => {
      const allRatings = topic.presenters.flatMap((presenter) =>
        presenter.scores.map((score) => score.rating)
      );

      return {
        id: topic.id,
        title: topic.title,
        order: topic.order,
        isLive: true,
        presenters: topic.presenters.map((presenter) => ({
          id: presenter.id,
          name: presenter.name,
          photo: presenter.photo,
          totalVotes: presenter.scores.length,
          averageScore:
            presenter.scores.length > 0
              ? Number(
                  (
                    presenter.scores.reduce((sum, score) => sum + score.rating, 0) /
                    presenter.scores.length
                  ).toFixed(2)
                )
              : 0,
        })),
        totalVotes: allRatings.length,
        averageScore:
          allRatings.length > 0
            ? Number(
                (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(2)
              )
            : 0,
      };
    });

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTopicSchema.parse(body);
    const order = (await prisma.topic.count()) + 1;

    const topic = await prisma.topic.create({
      data: {
        title: validated.title,
        order,
      },
    });

    const presenters = await Promise.all(
      validated.presenterNames.map((name) =>
        prisma.presenter.create({
          data: { name, topicId: topic.id },
        })
      )
    );

    await ensureActiveSession(topic.id);

    return NextResponse.json(
      {
        id: topic.id,
        title: topic.title,
        presenters: presenters.map((presenter) => ({
          id: presenter.id,
          name: presenter.name,
        })),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json({ error: "Invalid topic details" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}
