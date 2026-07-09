import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const id = Number(topicId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid topic id" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    await prisma.topic.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
