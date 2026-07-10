import type { NextRequest } from "next/server";

function isLocalhostHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLocalhostUrl(url: string): boolean {
  try {
    return isLocalhostHost(new URL(url).hostname);
  } catch {
    return url.includes("localhost") || url.includes("127.0.0.1");
  }
}

export function getAppUrl(request?: NextRequest): string {
  if (request) {
    const { origin, hostname } = request.nextUrl;
    if (!isLocalhostHost(hostname)) {
      return origin.replace(/\/$/, "");
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !isLocalhostUrl(configured)) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function getRateUrl(topicId: number, request?: NextRequest): string {
  return `${getAppUrl(request)}/rate/${topicId}`;
}
