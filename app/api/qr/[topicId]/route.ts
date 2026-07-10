import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getRateUrl } from "@/lib/app-url";
import { getQrFilename } from "@/lib/slugify";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId: topicIdParam } = await params;
    const topicId = Number(topicIdParam);

    if (!Number.isInteger(topicId) || topicId <= 0) {
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

    const rateUrl = getRateUrl(topicId, request);
    const pngBuffer = await QRCode.toBuffer(rateUrl, {
      type: "png",
      width: 512,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#1e1b4b",
        light: "#ffffff",
      },
    });

    const filename = getQrFilename(topic.title);

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
