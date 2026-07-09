"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { QrCode, Download, Users, BarChart3, Star, RefreshCw } from "lucide-react";
import { PresenterCard } from "@/components/presenter-card";
import { QRDisplay } from "@/components/qr-display";
import { BackButton } from "@/components/back-button";
import { AddPresenterForm } from "@/components/add-presenter-form";
import { toast } from "sonner";
import { getQrFilename } from "@/lib/slugify";

interface Presenter {
  id: number;
  name: string;
  title: string;
  avatar?: string | null;
  order: number;
  totalVotes: number;
  averageScore: number;
}

interface Session {
  id: string;
  presenterId: number;
  isActive: boolean;
}

export default function AdminPage() {
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [selectedPresenter, setSelectedPresenter] = useState<Presenter | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPresenters();
    fetchActiveSession();
    const interval = setInterval(fetchActiveSession, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeSession || presenters.length === 0) {
      return;
    }
    const presenter = presenters.find((item) => item.id === activeSession.presenterId);
    if (presenter) {
      setSelectedPresenter(presenter);
    }
  }, [activeSession, presenters]);

  const fetchPresenters = async () => {
    const res = await fetch("/api/presenters");
    const data = await res.json();
    setPresenters(data);
  };

  const fetchActiveSession = async () => {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    setActiveSession(data);
    setLastUpdated(new Date());
  };

  const startSession = async (presenter: Presenter) => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presenterId: presenter.id }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        setSelectedPresenter(presenter);
        setLastUpdated(new Date());
        toast.success(`Session started for ${presenter.name}`);
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

  const downloadQr = async (presenter: Presenter) => {
    const res = await fetch(`/api/qr/${presenter.id}`);
    if (!res.ok) {
      toast.error(`Failed to download QR for ${presenter.name}`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getQrFilename(presenter.name);
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllQrs = async () => {
    if (presenters.length === 0) {
      return;
    }
    for (const presenter of presenters) {
      await downloadQr(presenter);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    toast.success("Downloaded all QR codes");
  };

  const exportCSV = () => {
    const headers = ["Rank", "Name", "Topic", "Average Score", "Total Votes"];
    const sorted = [...presenters].sort((a, b) => b.averageScore - a.averageScore);
    const rows = sorted.map((p, i) => [
      i + 1,
      p.name,
      p.title,
      p.averageScore.toFixed(2),
      p.totalVotes,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "codeace-q1-awards-results.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported to CSV");
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const nameInput = formRef.current?.querySelector<HTMLInputElement>('input[name="name"]');
    nameInput?.focus();
  };

  const qrUrl = selectedPresenter
    ? `${getAppBaseUrl()}/rate/${selectedPresenter.id}`
    : "";

  const totalVotes = presenters.reduce((sum, presenter) => sum + presenter.totalVotes, 0);

  return (
    <main className="admin-page">
      <div className="mx-auto max-w-7xl">
        <BackButton />

        <div className="admin-header flex items-center justify-between mb-8">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage presenters and control rating sessions</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadAllQrs}
              disabled={presenters.length === 0}
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
                Presenters ({presenters.length})
              </div>
              <button type="button" onClick={scrollToForm} className="admin-add-btn">
                + Add Presenter
              </button>
            </div>
            <div className="admin-card-body space-y-4 max-h-[640px] overflow-y-auto">
              <div ref={formRef}>
                <AddPresenterForm onCreated={fetchPresenters} />
              </div>
              {presenters.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-6">
                  No presenters yet. Add one above to generate a unique QR code.
                </p>
              ) : (
                presenters.map((presenter) => (
                  <PresenterCard
                    key={presenter.id}
                    presenter={presenter}
                    isActive={activeSession?.presenterId === presenter.id}
                    onClick={() => startSession(presenter)}
                    onDownloadQr={() => downloadQr(presenter)}
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
                {selectedPresenter ? (
                  <QRDisplay
                    key={selectedPresenter.id}
                    url={qrUrl}
                    presenterName={selectedPresenter.name}
                    presenterTitle={selectedPresenter.title}
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Select a presenter to view QR code</p>
                    <p className="text-sm mt-2">Click a presenter to start their session</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {selectedPresenter ? (
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
            { label: "Total Presenters", value: presenters.length, icon: Users, color: "purple" },
            { label: "Total Votes", value: totalVotes, icon: BarChart3, color: "blue" },
            { label: "QR Codes Generated", value: presenters.length, icon: QrCode, color: "green" },
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
      </div>
    </main>
  );
}
