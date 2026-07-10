import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/lib/validators";
import { ensureActiveSession } from "@/lib/ensure-active-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId } = sessionSchema.parse(body);

    const session = await ensureActiveSession(topicId);

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json({ error: "Invalid session details" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const liveCount = await prisma.session.count({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({ liveCount });
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
