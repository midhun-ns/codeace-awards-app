import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savePresenterPhoto } from "@/lib/save-presenter-photo";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ presenterId: string }> }
) {
  try {
    const { presenterId } = await params;
    const id = Number(presenterId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid presenter id" }, { status: 400 });
    }

    const presenter = await prisma.presenter.findUnique({ where: { id } });
    if (!presenter) {
      return NextResponse.json({ error: "Presenter not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    const photoPath = await savePresenterPhoto(presenter.id, presenter.name, photo);
    await prisma.presenter.update({
      where: { id: presenter.id },
      data: { photo: photoPath },
    });

    return NextResponse.json({ photo: photoPath });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("image")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}
