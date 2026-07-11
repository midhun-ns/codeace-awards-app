import { NextRequest, NextResponse } from "next/server";
import { ensureActiveSession } from "@/lib/ensure-active-session";
import { formatSessionForClient } from "@/lib/format-session-for-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    const session = await ensureActiveSession(topicId);

    return NextResponse.json(
      { session: formatSessionForClient(session) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Failed to fetch active session:", error);
    return NextResponse.json(
      { error: "Failed to fetch active session" },
      { status: 500 }
    );
  }
}
