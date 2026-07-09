"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QrCode, BarChart3, ArrowRight, LogOut } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <button
        type="button"
        onClick={handleLogout}
        className="absolute top-6 right-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <img
            src="/codeace-logo.png"
            alt="Codeace"
            className="leaderboard-logo"
          />
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Codeace Awards</span>
          </h1>
        </motion.div>

        <div className="grid gap-4">
          <Link href="/admin">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-4 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-100">Admin Dashboard</h3>
                <p className="text-slate-400 text-sm">Manage presenters, generate QR codes, control sessions</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </motion.div>
          </Link>

          <Link href="/leaderboard">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-4 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-100">Live Leaderboard</h3>
                <p className="text-slate-400 text-sm">Real-time scores and top 3 rankings</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </motion.div>
          </Link>
        </div>

        <p className="text-center text-slate-600 text-sm mt-8">
          Live presentation ratings · Real-time scores
        </p>
      </div>
    </main>
  );
}