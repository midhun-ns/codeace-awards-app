"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LaurelWreath, PodiumBase } from "@/components/podium-base";
import { toast } from "sonner";

interface LeaderboardEntry {
  id: number;
  name: string;
  photo?: string | null;
  topicTitle: string;
  topicsPresented: number;
  totalVotes: number;
  totalScore: number;
  averageScore: number;
}

interface Particle {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

function Avatar({ entry, ringClass, sizeClass }: { entry?: LeaderboardEntry; ringClass: string; sizeClass: string }) {
  return (
    <div className={`${sizeClass} rounded-full ${ringClass} mx-auto`}>
      <div className="w-full h-full rounded-full bg-[#1a1f2e] flex items-center justify-center overflow-hidden">
        {entry?.photo ? (
          <img src={entry.photo} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">👤</span>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const result: LeaderboardEntry[] = await res.json();
      setData([...result].sort((a, b) => b.totalScore - a.totalScore));
    } catch {
      console.error("Failed to fetch leaderboard");
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 40}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2 + Math.random() * 3}s`,
      }))
    );
  }, []);

  const handleResetVotes = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/scores", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to reset votes");
      }
      await fetchLeaderboard();
      setShowResetDialog(false);
      toast.success("All votes have been reset");
    } catch {
      toast.error("Failed to reset votes");
    } finally {
      setResetting(false);
    }
  };

  const [second, first, third] = [data[1], data[0], data[2]];

  return (
    <main className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute w-1 h-1 bg-amber-300/40 rounded-full animate-pulse"
            style={particle}
          />
        ))}
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Top navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <img src="/codeace-logo.png" alt="Codeace" className="leaderboard-logo mb-0 h-10" />
          <div className="w-16" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="text-white">Excellence in </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Presentation
            </span>
          </h1>
        </div>

        {/* Main card */}
        <div className="bg-[#111827]/80 backdrop-blur-sm rounded-3xl border border-slate-700/40 p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300 font-semibold text-sm tracking-wider">TOP PERFORMERS</span>
            </div>
            <button
              type="button"
              onClick={() => setShowResetDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {data.length === 0 ? (
            <div className="flex h-[360px] items-center justify-center text-slate-500">
              No ratings yet. Waiting for the first vote...
            </div>
          ) : (
            <div className="grid grid-cols-3 items-end gap-4 md:gap-8 w-full">
              {/* 2nd place */}
              {second && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="relative z-10 mb-[-12px] w-10 h-10 rounded-full bg-gradient-to-b from-slate-300 to-slate-500 flex items-center justify-center text-slate-900 font-bold text-lg border-2 border-slate-400">
                    2
                  </div>
                  <div className="w-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-2xl border border-slate-600/50 p-5 pt-8 pb-4 relative">
                    <Avatar entry={second} ringClass="bg-gradient-to-b from-slate-400 to-slate-500 p-0.5" sizeClass="w-24 h-24 md:w-28 md:h-28" />
                    <h3 className="text-center text-white font-semibold text-base mb-1 mt-3">{second.name}</h3>
                    <p className="text-center text-blue-400 text-3xl font-bold mb-2">{second.totalScore}</p>
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600/50 text-slate-400 text-xs">
                        {second.totalVotes} votes
                      </span>
                    </div>
                  </div>
                  <PodiumBase rank={2} />
                </motion.div>
              )}

              {/* 1st place */}
              {first && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0, duration: 0.5 }}
                  className="flex flex-col items-center -mt-4 w-full"
                >
                  <div className="flex flex-col items-center mb-[-12px]">
                    <img src="/crown.png" alt="" className="relative z-20 w-10 h-10 object-contain" />
                    <div className="relative z-10 -mt-4 w-12 h-12 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-xl shadow-lg shadow-amber-500/30 border-2 border-amber-400">
                      1
                    </div>
                  </div>
                  <div
                    className="w-full bg-gradient-to-b from-[#2a1f0a] to-[#0f172a] rounded-2xl border border-amber-500/40 p-5 pt-8 pb-4 relative"
                    style={{ boxShadow: "0 0 60px -10px rgba(251, 191, 36, 0.15), inset 0 1px 0 rgba(251, 191, 36, 0.1)" }}
                  >
                    <LaurelWreath className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-24 text-amber-500/20" />
                    <div className="relative">
                      <Avatar entry={first} ringClass="bg-gradient-to-b from-amber-300 to-amber-600 p-1 shadow-lg shadow-amber-500/20" sizeClass="w-28 h-28 md:w-32 md:h-32" />
                    </div>
                    <h3 className="text-center text-white font-semibold text-lg mb-1 mt-3">{first.name}</h3>
                    <p className="text-center text-amber-400 text-4xl font-bold mb-2">{first.totalScore}</p>
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                        {first.totalVotes} votes
                      </span>
                    </div>
                  </div>
                  <PodiumBase rank={1} />
                </motion.div>
              )}

              {/* 3rd place */}
              {third && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="relative z-10 mb-[-12px] w-10 h-10 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-lg border-2 border-amber-700">
                    3
                  </div>
                  <div className="w-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-2xl border border-slate-600/50 p-5 pt-8 pb-4 relative">
                    <Avatar entry={third} ringClass="bg-gradient-to-b from-amber-600 to-amber-800 p-0.5" sizeClass="w-24 h-24 md:w-28 md:h-28" />
                    <h3 className="text-center text-white font-semibold text-base mb-1 mt-3">{third.name}</h3>
                    <p className="text-center text-amber-500 text-3xl font-bold mb-2">{third.totalScore}</p>
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600/50 text-slate-400 text-xs">
                        {third.totalVotes} votes
                      </span>
                    </div>
                  </div>
                  <PodiumBase rank={3} />
                </motion.div>
              )}
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showResetDialog}
          title="Reset all votes?"
          message="This will permanently delete every rating submitted so far. This action cannot be undone."
          confirmLabel="Reset Votes"
          loading={resetting}
          onConfirm={handleResetVotes}
          onCancel={() => setShowResetDialog(false)}
        />
      </div>
    </main>
  );
}
