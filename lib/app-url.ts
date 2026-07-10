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

function getUrlFromRequest(request: NextRequest): string | null {
  const queryOrigin = request.nextUrl.searchParams.get("origin")?.trim();
  if (queryOrigin && !isLocalhostUrl(queryOrigin)) {
    return queryOrigin.replace(/\/$/, "");
  }

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim();
  if (!host || isLocalhostHost(host.split(":")[0])) {
    return null;
  }

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  return `${proto}://${host}`.replace(/\/$/, "");
}

export function getAppUrl(request?: NextRequest): string {
  if (request) {
    const fromRequest = getUrlFromRequest(request);
    if (fromRequest) {
      return fromRequest;
    }
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return `https://${productionUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
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
