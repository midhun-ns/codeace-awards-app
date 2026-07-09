import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  loading = false,
  loadingLabel = "Please wait...",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900/95 p-6 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="mt-2 text-sm leading-relaxed text-slate-400">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
