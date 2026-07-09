import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const presenters = await prisma.presenter.findMany({
      include: {
        scores: { select: { rating: true } },
      },
    });

    const leaderboard = presenters
      .map((p) => {
        const totalScore = p.scores.reduce((sum, s) => sum + s.rating, 0);
        return {
          id: p.id,
          name: p.name,
          title: p.title,
          department: p.department,
          avatar: p.avatar,
          totalVotes: p.scores.length,
          totalScore,
          averageScore:
            p.scores.length > 0
              ? Number((totalScore / p.scores.length).toFixed(2))
              : 0,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}