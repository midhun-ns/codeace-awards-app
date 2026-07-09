import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const presenterIdParam = request.nextUrl.searchParams.get("presenterId");
    const presenterId = Number(presenterIdParam);

    if (!presenterIdParam || !Number.isInteger(presenterId) || presenterId <= 0) {
      return NextResponse.json(
        { error: "Valid presenterId is required" },
        { status: 400 }
      );
    }

    const presenter = await prisma.presenter.findUnique({
      where: { id: presenterId },
    });

    if (!presenter) {
      return NextResponse.json({ error: "Presenter not found" }, { status: 404 });
    }

    const session = await prisma.session.findFirst({
      where: {
        presenterId,
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
