import { NextRequest, NextResponse } from "next/server";
import { ensureActiveSession } from "@/lib/ensure-active-session";
import { getRateTopic } from "@/lib/get-rate-topic";
import { setCachedRateTopic } from "@/lib/rate-topic-cache";
import { formatSessionForClient } from "@/lib/format-session-for-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const id = Number(topicId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid topic id" }, { status: 400 });
    }

    const [topic, session] = await Promise.all([
      getRateTopic(id),
      ensureActiveSession(id),
    ]);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    setCachedRateTopic(id, topic);

    return NextResponse.json(
      { topic, session: formatSessionForClient(session) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Failed to load rating page data:", error);
    return NextResponse.json(
      { error: "Failed to load rating page data" },
      { status: 500 }
    );
  }
}
