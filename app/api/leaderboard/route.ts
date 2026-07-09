import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const presenters = await prisma.presenter.findMany({
      include: {
        scores: { select: { rating: true, topicId: true } },
        topic: { select: { title: true } },
      },
    });

    const leaderboard = presenters
      .map((presenter) => {
        const totalScore = presenter.scores.reduce((sum, score) => sum + score.rating, 0);
        return {
          id: presenter.id,
          name: presenter.name,
          photo: presenter.photo,
          topicTitle: presenter.topic.title,
          topicsPresented: new Set(presenter.scores.map((score) => score.topicId)).size,
          totalVotes: presenter.scores.length,
          totalScore,
          averageScore:
            presenter.scores.length > 0
              ? Number((totalScore / presenter.scores.length).toFixed(2))
              : 0,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
