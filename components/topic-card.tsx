"use client";

import { User, ChevronRight, Download, Trash2 } from "lucide-react";

interface TopicPresenter {
  id: number;
  name: string;
  photo?: string | null;
}

interface Topic {
  id: number;
  title: string;
  presenters: TopicPresenter[];
  totalVotes: number;
  averageScore: number;
}

interface TopicCardProps {
  topic: Topic;
  isActive?: boolean;
  onClick?: () => void;
  onDownloadQr?: () => void;
  onDelete?: () => void;
  loading?: boolean;
}

export function TopicCard({ topic, isActive, onClick, onDownloadQr, onDelete, loading }: TopicCardProps) {
  const presenterNames = topic.presenters.map((presenter) => presenter.name).join(" & ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={`admin-presenter-row ${isActive ? "active" : ""} ${loading ? "opacity-70 pointer-events-none" : ""}`}
    >
      <div className="flex -space-x-2 flex-shrink-0">
        {topic.presenters.map((presenter) => (
          <div key={presenter.id} className="admin-presenter-avatar ring-2 ring-slate-900">
            {presenter.photo ? (
              <img src={presenter.photo} alt={presenter.name} />
            ) : (
              <User className="h-5 w-5 text-slate-500" />
            )}
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white truncate">{topic.title}</h4>
          {isActive ? <span className="admin-active-badge">Active</span> : null}
        </div>
        <p className="text-slate-400 text-sm truncate">{presenterNames}</p>
        <p className="text-xs text-slate-500 mt-1">
          {topic.averageScore.toFixed(1)} avg · {topic.totalVotes} votes
        </p>
      </div>
      {onDelete ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
          title="Delete topic"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : null}
      {onDownloadQr ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDownloadQr();
          }}
          className="p-2 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-white/5 transition-colors"
          title="Download QR code"
        >
          <Download className="w-4 h-4" />
        </button>
      ) : null}
      <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
    </div>
  );
}
