import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreSchema, domainSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = scoreSchema.parse(body);

    // Validate email domain
    domainSchema.parse(validated.email);

    // Check if session is valid and active
    const session = await prisma.session.findFirst({
      where: {
        id: validated.sessionToken,
        presenterId: validated.presenterId,
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

    // Check for duplicate vote
    const existing = await prisma.score.findUnique({
      where: {
        email_presenterId_sessionToken: {
          email: validated.email,
          presenterId: validated.presenterId,
          sessionToken: validated.sessionToken,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already rated this presentation" },
        { status: 409 }
      );
    }

    const score = await prisma.score.create({
      data: {
        presenterId: validated.presenterId,
        email: validated.email,
        rating: validated.rating,
        sessionToken: validated.sessionToken,
        ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
      },
    });

    return NextResponse.json({ success: true, score }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
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