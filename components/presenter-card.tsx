"use client";

import { User, ChevronRight, Download } from "lucide-react";

interface Presenter {
  id: number;
  name: string;
  title: string;
  avatar?: string | null;
  order: number;
  totalVotes?: number;
  averageScore?: number;
}

interface PresenterCardProps {
  presenter: Presenter;
  isActive?: boolean;
  onClick?: () => void;
  onDownloadQr?: () => void;
  loading?: boolean;
}

export function PresenterCard({
  presenter,
  isActive,
  onClick,
  onDownloadQr,
  loading,
}: PresenterCardProps) {
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
      <div className="admin-presenter-avatar">
        {presenter.avatar ? (
          <img src={presenter.avatar} alt={presenter.name} />
        ) : (
          <User className="h-5 w-5 text-slate-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white truncate">{presenter.name}</h4>
          {isActive ? <span className="admin-active-badge">Active</span> : null}
        </div>
        <p className="text-slate-400 text-sm truncate">{presenter.title}</p>
        {presenter.averageScore !== undefined && presenter.totalVotes !== undefined ? (
          <p className="text-xs text-slate-500 mt-1">
            {presenter.averageScore.toFixed(1)} · {presenter.totalVotes} votes
          </p>
        ) : null}
      </div>
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
