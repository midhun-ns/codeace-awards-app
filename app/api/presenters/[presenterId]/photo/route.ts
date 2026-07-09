import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savePresenterPhoto } from "@/lib/save-presenter-photo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

async function parsePresenterId(presenterId: string) {
  const id = Number(presenterId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    value !== null &&
    typeof value === "object" &&
    "arrayBuffer" in value &&
    typeof (value as File).arrayBuffer === "function" &&
    "size" in value &&
    (value as File).size > 0
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ presenterId: string }> }
) {
  const { presenterId } = await params;
  const id = await parsePresenterId(presenterId);
  if (!id) {
    return NextResponse.json({ error: "Invalid presenter id" }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const presenter = await prisma.presenter.findUnique({ where: { id } });
      if (!presenter) {
        return NextResponse.json({ error: "Presenter not found" }, { status: 404 });
      }

      const body = (await request.json()) as HandleUploadBody;
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
        }),
      });

      return NextResponse.json(jsonResponse);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start photo upload";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  try {
    const presenter = await prisma.presenter.findUnique({ where: { id } });
    if (!presenter) {
      return NextResponse.json({ error: "Presenter not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    if (!isFileLike(photo)) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    const photoPath = await savePresenterPhoto(presenter.id, presenter.name, photo);
    await prisma.presenter.update({
      where: { id: presenter.id },
      data: { photo: photoPath },
    });

    return NextResponse.json({ photo: photoPath });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.toLowerCase().includes("image")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to upload photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ presenterId: string }> }
) {
  try {
    const { presenterId } = await params;
    const id = await parsePresenterId(presenterId);
    if (!id) {
      return NextResponse.json({ error: "Invalid presenter id" }, { status: 400 });
    }

    const presenter = await prisma.presenter.findUnique({ where: { id } });
    if (!presenter) {
      return NextResponse.json({ error: "Presenter not found" }, { status: 404 });
    }

    const body = (await request.json()) as { photo?: string };
    const photo = body.photo?.trim();
    if (!photo || !photo.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid photo URL" }, { status: 400 });
    }

    await prisma.presenter.update({
      where: { id },
      data: { photo },
    });

    return NextResponse.json({ photo });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
