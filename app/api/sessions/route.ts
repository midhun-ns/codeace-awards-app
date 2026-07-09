import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/lib/validators";

// Create a new session for a topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId } = sessionSchema.parse(body);

    await prisma.session.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const session = await prisma.session.create({
      data: {
        topicId,
        isActive: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours
      },
    });

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

// Get active session
export async function GET() {
  try {
    const session = await prisma.session.findFirst({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: { topic: { include: { presenters: true } } },
    });

    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
