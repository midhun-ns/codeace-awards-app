import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getRateUrl } from "@/lib/app-url";
import { getQrFilename } from "@/lib/slugify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ presenterId: string }> }
) {
  try {
    const { presenterId: presenterIdParam } = await params;
    const presenterId = Number(presenterIdParam);

    if (!Number.isInteger(presenterId) || presenterId <= 0) {
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

    const rateUrl = getRateUrl(presenterId);
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

    const filename = getQrFilename(presenter.name);

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
