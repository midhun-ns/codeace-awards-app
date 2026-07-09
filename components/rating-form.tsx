"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RatingFormProps {
  presenterId: number;
  presenterName: string;
  presenterTitle: string;
  sessionToken: string;
}

export function RatingForm({ presenterId, presenterName, presenterTitle, sessionToken }: RatingFormProps) {
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email || rating === 0) {
      toast.error("Please enter your email and select a rating");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presenterId, email, rating, sessionToken }),
      });

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
        toast.error(data.error?.[0]?.message || "Failed to submit rating");
        return;
      }

      setSubmitted(true);
      toast.success("Rating submitted successfully!");
    } catch {
      toast.error("Network error. Please try again.");
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
          Your rating for <span className="text-indigo-400 font-semibold">{presenterName}</span> has been recorded.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Rate This Presentation</h2>
        <p className="text-slate-400">
          {presenterName} — <span className="text-indigo-400">{presenterTitle}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Your Work Email</label>
        <Input
          type="email"
          placeholder="you@codeace.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
        />
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Only @codeace.com emails are accepted
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-slate-300 block text-center">
          Rate out of 10
        </label>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(num)}
              onMouseEnter={() => setHoverRating(num)}
              onMouseLeave={() => setHoverRating(0)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                num <= (hoverRating || rating)
                  ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30"
                  : "bg-slate-800 text-slate-500 hover:bg-slate-700"
              }`}
            >
              <Star
                className={`w-4 h-4 ${num <= (hoverRating || rating) ? "fill-current" : ""}`}
              />
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-amber-400 font-semibold text-lg"
            >
              {rating} / 10
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !email || rating === 0}
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
            Submit Rating
          </>
        )}
      </Button>
    </div>
  );
}