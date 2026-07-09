export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getQrFilename(name: string): string {
  const sanitized = name.trim().replace(/[<>:"/\\|?*]/g, "");
  return `${sanitized || "presenter"}.png`;
}
