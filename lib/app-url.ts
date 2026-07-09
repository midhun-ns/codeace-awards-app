export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) {
    return url.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function getRateUrl(topicId: number): string {
  return `${getAppUrl()}/rate/${topicId}`;
}
