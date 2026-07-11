"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RatingForm } from "@/components/rating-form";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface ActiveSession {
  id: string;
  topicId: number;
  isActive: boolean;
}

export default function RateTopicPage() {
  const params = useParams();
  const topicId = Number(params.topicId);

  const [topic, setTopic] = useState<{
    id: number;
    title: string;
    presenters: { id: number; name: string; photo?: string | null }[];
  } | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topicId || !Number.isInteger(topicId) || topicId <= 0) {
      setError("Invalid rating link. Please scan the QR code again.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetchWithTimeout(`/api/rate/${topicId}`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Topic not found.");
          } else {
            setError("Failed to load rating page. Please refresh and try again.");
          }
          return;
        }

        const data = await res.json();

        if (!data.session) {
          setError("Rating is not open yet. Please wait for the presentation to finish.");
          return;
        }

        setTopic(data.topic);
        setSession(data.session);
      } catch {
        setError("Failed to load rating page. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [topicId]);

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

  if (error || !topic || !session) {
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
        className="w-full max-w-lg"
      >
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <RatingForm topic={topic} sessionToken={session.id} />
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
