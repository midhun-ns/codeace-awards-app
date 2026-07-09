"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
        <img src="/codeace-logo.png" alt="Codeace" className="leaderboard-logo mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white">Q1 Awards 2026</h1>
        <p className="text-slate-400 mt-2">Enter the password to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          autoFocus
          className="admin-form-input"
        />
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
