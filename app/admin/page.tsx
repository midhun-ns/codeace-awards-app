"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { QrCode, Download, Users, BarChart3, Star, RefreshCw } from "lucide-react";
import { TopicCard } from "@/components/topic-card";
import { QRDisplay } from "@/components/qr-display";
import { BackButton } from "@/components/back-button";
import { AddTopicForm } from "@/components/add-topic-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { getQrFilename } from "@/lib/slugify";

interface TopicPresenter {
  id: number;
  name: string;
  photo?: string | null;
  totalVotes: number;
  averageScore: number;
}

interface Topic {
  id: number;
  title: string;
  order: number;
  presenters: TopicPresenter[];
  totalVotes: number;
  averageScore: number;
}

interface Session {
  id: string;
  topicId: number;
  isActive: boolean;
}

interface LeaderboardEntry {
  name: string;
  topicTitle: string;
  averageScore: number;
  totalVotes: number;
}

export default function AdminPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTopics();
    fetchActiveSession();
    const interval = setInterval(fetchActiveSession, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeSession || topics.length === 0) {
      return;
    }
    const topic = topics.find((item) => item.id === activeSession.topicId);
    if (topic) {
      setSelectedTopic(topic);
    }
  }, [activeSession, topics]);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/topics", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setTopics(Array.isArray(data) ? data : []);
    } catch {
      setTopics([]);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const res = await fetch("/api/sessions", { cache: "no-store" });
      if (!res.ok) {
        setActiveSession(null);
        return;
      }
      const data = await res.json();
      setActiveSession(data?.id ? data : null);
      setLastUpdated(new Date());
    } catch {
      setActiveSession(null);
    }
  };

  const startSession = async (topic: Topic) => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic.id }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        setSelectedTopic(topic);
        setLastUpdated(new Date());
        toast.success(`Session started for "${topic.title}"`);
      }
    } catch {
      toast.error("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const getAppBaseUrl = () => {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (configuredUrl) {
      return configuredUrl.replace(/\/$/, "");
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  };

  const downloadQr = async (topic: Topic) => {
    const res = await fetch(`/api/qr/${topic.id}`);
    if (!res.ok) {
      toast.error(`Failed to download QR for "${topic.title}"`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getQrFilename(topic.title);
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteTopic = (topic: Topic) => {
    setTopicToDelete(topic);
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/topics/${topicToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete topic");
        return;
      }

      if (activeSession?.topicId === topicToDelete.id) {
        setActiveSession(null);
      }
      if (selectedTopic?.id === topicToDelete.id) {
        setSelectedTopic(null);
      }

      await fetchTopics();
      toast.success(`"${topicToDelete.title}" deleted`);
      setTopicToDelete(null);
    } catch {
      toast.error("Failed to delete topic");
    } finally {
      setDeleting(false);
    }
  };

  const downloadAllQrs = async () => {
    if (topics.length === 0) {
      return;
    }
    for (const topic of topics) {
      await downloadQr(topic);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    toast.success("Downloaded all QR codes");
  };

  const exportCSV = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const leaderboard: LeaderboardEntry[] = await res.json();
      const headers = ["Rank", "Name", "Topic", "Average Score", "Total Votes"];
      const rows = leaderboard.map((entry, index) => [
        index + 1,
        entry.name,
        entry.topicTitle,
        entry.averageScore.toFixed(2),
        entry.totalVotes,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "codeace-q1-awards-results.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Results exported to CSV");
    } catch {
      toast.error("Failed to export results");
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const titleInput = formRef.current?.querySelector<HTMLInputElement>('input[name="title"]');
    titleInput?.focus();
  };

  const qrUrl = selectedTopic ? `${getAppBaseUrl()}/rate/${selectedTopic.id}` : "";

  const totalPresenters = topics.reduce((sum, topic) => sum + topic.presenters.length, 0);
  const totalVotes = topics.reduce((sum, topic) => sum + topic.totalVotes, 0);

  return (
    <main className="admin-page">
      <div className="mx-auto max-w-7xl">
        <BackButton />

        <div className="admin-header flex items-center justify-between mb-8">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage topics and control rating sessions</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadAllQrs}
              disabled={topics.length === 0}
              className="admin-btn-outline"
            >
              <QrCode className="h-4 w-4" />
              Download All QRs
            </button>
            <button type="button" onClick={exportCSV} className="admin-btn-primary">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">
                <Users className="h-5 w-5 text-violet-400" />
                Topics ({topics.length})
              </div>
              <button type="button" onClick={scrollToForm} className="admin-add-btn">
                + Add Topic
              </button>
            </div>
            <div className="admin-card-body space-y-4 max-h-[640px] overflow-y-auto">
              <div ref={formRef}>
                <AddTopicForm onCreated={fetchTopics} />
              </div>
              {topics.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">
                  No topics yet. Add one above to generate a unique QR code.
                </p>
              ) : (
                topics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isActive={activeSession?.topicId === topic.id}
                    onClick={() => startSession(topic)}
                    onDownloadQr={() => downloadQr(topic)}
                    onDelete={() => deleteTopic(topic)}
                    loading={loading}
                  />
                ))
              )}
            </div>
          </div>

          <div className="admin-card flex flex-col">
            <div className="admin-card-header">
              <div className="admin-card-title">
                <QrCode className="h-5 w-5 text-violet-400" />
                Live QR Code
              </div>
              {activeSession?.isActive ? <span className="admin-live-badge">Live</span> : null}
            </div>
            <div className="admin-card-body flex flex-1 items-center justify-center min-h-[480px]">
              <AnimatePresence mode="wait">
                {selectedTopic ? (
                  <QRDisplay
                    key={selectedTopic.id}
                    url={qrUrl}
                    presenterName={selectedTopic.presenters
                      .map((presenter) => presenter.name)
                      .join(" & ")}
                    presenterTitle={selectedTopic.title}
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select a topic to view QR code</p>
                    <p className="text-sm mt-2">Click a topic to start its session</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {selectedTopic ? (
              <div className="admin-qr-footer">
                <div className="flex items-center gap-3">
                  <span>Session Status</span>
                  <span className="admin-active-badge">Active</span>
                </div>
                <button
                  type="button"
                  onClick={fetchActiveSession}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-stat-grid">
          {[
            { label: "Total Presenters", value: totalPresenters, icon: Users, color: "purple" },
            { label: "Total Votes", value: totalVotes, icon: BarChart3, color: "blue" },
            { label: "QR Codes Generated", value: topics.length, icon: QrCode, color: "green" },
            { label: "Live Session", value: activeSession?.isActive ? 1 : 0, icon: Star, color: "orange" },
          ].map((stat) => (
            <div key={stat.label} className="admin-stat-card">
              <div className={`admin-stat-icon ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="admin-stat-value">{stat.value}</div>
                <div className="admin-stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <ConfirmDialog
          open={topicToDelete !== null}
          title="Delete topic?"
          message={
            topicToDelete
              ? `Delete "${topicToDelete.title}" and all presenter ratings? This cannot be undone.`
              : ""
          }
          confirmLabel="Delete Topic"
          loading={deleting}
          loadingLabel="Deleting..."
          onConfirm={confirmDeleteTopic}
          onCancel={() => setTopicToDelete(null)}
        />
      </div>
    </main>
  );
}
