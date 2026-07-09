import { slugify } from "@/lib/slugify";

export function getPresenterPhotoPathname(
  presenterId: number,
  name: string,
  extension = "jpg"
): string {
  return `presenters/${presenterId}-${slugify(name)}.${extension}`;
}
