"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getVoterId } from "@/lib/voter-id";

export interface RatingPresenter {
  id: number;
  name: string;
  photo?: string | null;
}

export interface RatingTopic {
  id: number;
  title: string;
  presenters: RatingPresenter[];
}

interface RatingFormProps {
  topic: RatingTopic;
  sessionToken: string;
}

export function RatingForm({ topic, sessionToken }: RatingFormProps) {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [hoverRatings, setHoverRatings] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allRated = topic.presenters.every((presenter) => (ratings[presenter.id] ?? 0) > 0);

  const setPresenterRating = (presenterId: number, rating: number) => {
    setRatings((previous) => ({ ...previous, [presenterId]: rating }));
  };

  const setPresenterHover = (presenterId: number, rating: number) => {
    setHoverRatings((previous) => ({ ...previous, [presenterId]: rating }));
  };

  const clearPresenterHover = (presenterId: number) => {
    setHoverRatings((previous) => {
      const next = { ...previous };
      delete next[presenterId];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allRated) {
      toast.error("Please rate every presenter");
      return;
    }

    setLoading(true);
    try {
      const ratingsArray = topic.presenters.map((presenter) => ({
        presenterId: presenter.id,
        rating: ratings[presenter.id],
      }));

      const res = await fetchWithTimeout(
        "/api/scores",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: topic.id,
            voterId: getVoterId(),
            sessionToken,
            ratings: ratingsArray,
          }),
        },
        30000
      );

      const data = await res.json();

      if (res.status === 409) {
        toast.error("You have already rated this presentation!");
        return;
      }
      if (res.status === 403) {
        toast.error("This rating session has expired.");
        return;
      }
      if (!res.ok) {
        toast.error(data.error?.[0]?.message || "Failed to submit ratings");
        return;
      }

      setSubmitted(true);
      toast.success("Ratings submitted successfully!");
    } catch {
      toast.error("Request timed out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-12"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">Thank You!</h3>
        <p className="text-slate-400 text-center max-w-sm">
          Your ratings for{" "}
          <span className="text-indigo-400 font-semibold">&quot;{topic.title}&quot;</span> have
          been recorded.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Rate This Presentation</h2>
        <p className="text-indigo-400 font-medium">{topic.title}</p>
      </div>

      <div className="flex justify-center gap-6">
        {topic.presenters.map((presenter) => (
          <div key={presenter.id} className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 p-0.5">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                {presenter.photo ? (
                  <img
                    src={presenter.photo}
                    alt={presenter.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-slate-600" />
                )}
              </div>
            </div>
            <span className="text-white text-sm mt-2 font-medium">{presenter.name}</span>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {topic.presenters.map((presenter, index) => (
          <motion.div
            key={presenter.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-900/60 rounded-xl p-4 border border-slate-800"
          >
            <p className="text-white font-medium text-sm mb-3">
              Rate <span className="text-indigo-400">{presenter.name}</span>:
            </p>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPresenterRating(presenter.id, num)}
                  onMouseEnter={() => setPresenterHover(presenter.id, num)}
                  onMouseLeave={() => clearPresenterHover(presenter.id)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    num <= (hoverRatings[presenter.id] || ratings[presenter.id] || 0)
                      ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      num <= (ratings[presenter.id] || 0) ? "fill-current" : ""
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {(ratings[presenter.id] ?? 0) > 0 && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center text-amber-400 font-semibold text-sm mt-2"
                >
                  {ratings[presenter.id]} / 10
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <div>
        <Button
          onClick={handleSubmit}
          disabled={loading || !allRated}
          className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit {topic.presenters.length} Rating{topic.presenters.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
        {!allRated && (
          <p className="text-center text-slate-500 text-xs mt-3">
            Please rate all presenters before submitting
          </p>
        )}
      </div>
    </div>
  );
}
