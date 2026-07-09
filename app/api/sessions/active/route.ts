import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const topicIdParam = request.nextUrl.searchParams.get("topicId");
    const topicId = Number(topicIdParam);

    if (!topicIdParam || !Number.isInteger(topicId) || topicId <= 0) {
      return NextResponse.json(
        { error: "Valid topicId is required" },
        { status: 400 }
      );
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const session = await prisma.session.findFirst({
      where: {
        topicId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch active session" },
      { status: 500 }
    );
  }
}
