"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Lock } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        toast.error("Incorrect password");
        return;
      }
      router.replace(searchParams.get("from") || "/");
      router.refresh();
    } catch {
      toast.error("Login failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-card w-full max-w-md p-8">
      <div className="text-center mb-8">
        <div className="live-badge mx-auto mb-6 w-fit">
          <Trophy className="h-4 w-4" />
          Q1 2026 Awards
        </div>
        <h1 className="text-3xl font-bold text-white">Codeace Awards</h1>
        <p className="text-slate-400 mt-2">Enter the password to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            autoFocus
            className="admin-form-input pl-11"
          />
        </div>
        <button type="submit" disabled={submitting} className="admin-submit-btn">
          {submitting ? "Checking..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="leaderboard-page flex items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
