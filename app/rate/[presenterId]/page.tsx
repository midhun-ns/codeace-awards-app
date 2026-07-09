"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RatingForm } from "@/components/rating-form";

interface Presenter {
  id: number;
  name: string;
  title: string;
}

interface ActiveSession {
  id: string;
  presenterId: number;
  isActive: boolean;
}

export default function RatePresenterPage() {
  const params = useParams();
  const presenterId = Number(params.presenterId);

  const [presenter, setPresenter] = useState<Presenter | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!presenterId || !Number.isInteger(presenterId) || presenterId <= 0) {
      setError("Invalid rating link. Please scan the QR code again.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [presentersRes, sessionRes] = await Promise.all([
          fetch("/api/presenters"),
          fetch(`/api/sessions/active?presenterId=${presenterId}`),
        ]);

        const presenters = await presentersRes.json();
        const sessionData = await sessionRes.json();

        const foundPresenter = presenters.find(
          (item: Presenter) => item.id === presenterId
        );

        if (!foundPresenter) {
          setError("Presenter not found.");
          return;
        }

        setPresenter(foundPresenter);

        if (!sessionData.session) {
          setError(
            "Rating is not open yet. Please wait for the presenter to finish."
          );
          return;
        }

        setSession(sessionData.session);
      } catch {
        setError("Failed to load rating page.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [presenterId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (error || !presenter || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="bg-slate-800/50 border-slate-700/50 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Oops!</h3>
            <p className="text-slate-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <RatingForm
              presenterId={presenterId}
              presenterName={presenter.name}
              presenterTitle={presenter.title}
              sessionToken={session.id}
            />
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
