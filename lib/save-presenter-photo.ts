import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slugify";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function resolveContentType(file: File): string {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".png")) {
    return "image/png";
  }
  if (lowerName.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function resolveExtension(contentType: string): string {
  if (contentType === "image/png") {
    return "png";
  }
  if (contentType === "image/webp") {
    return "webp";
  }
  return "jpg";
}

export async function savePresenterPhoto(
  presenterId: number,
  name: string,
  file: File
): Promise<string> {
  const contentType = resolveContentType(file);

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be smaller than 2MB");
  }

  const extension = resolveExtension(contentType);
  const fileName = `${presenterId}-${slugify(name)}.${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (blobToken) {
    const blob = await put(`presenters/${fileName}`, fileBuffer, {
      access: "public",
      token: blobToken,
      contentType,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("Blob storage is not configured for photo uploads");
  }

  const directory = path.join(process.cwd(), "public", "presenters");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), fileBuffer);

  return `/presenters/${fileName}`;
}
