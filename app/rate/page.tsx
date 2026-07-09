"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LegacyRateRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presenterId = searchParams.get("p");
  const sessionToken = searchParams.get("t");

  useEffect(() => {
    if (presenterId && /^\d+$/.test(presenterId)) {
      router.replace(`/rate/${presenterId}`);
      return;
    }
    if (!presenterId || !sessionToken) {
      router.replace("/");
    }
  }, [presenterId, sessionToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export default function RatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LegacyRateRedirect />
    </Suspense>
  );
}
