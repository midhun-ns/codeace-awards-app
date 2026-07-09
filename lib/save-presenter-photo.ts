import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { slugify } from "@/lib/slugify";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function savePresenterPhoto(
  presenterId: number,
  name: string,
  file: File
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be smaller than 2MB");
  }

  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${presenterId}-${slugify(name)}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`presenters/${fileName}`, file, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  const directory = path.join(process.cwd(), "public", "presenters");
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, fileName),
    Buffer.from(await file.arrayBuffer())
  );

  return `/presenters/${fileName}`;
}
