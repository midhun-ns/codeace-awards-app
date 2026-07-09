"use client";

import { useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/lib/compress-image";

interface PresenterDraft {
  name: string;
  photo: File | null;
  preview: string | null;
}

interface AddTopicFormProps {
  onCreated: () => void;
}

const emptyPresenter = (): PresenterDraft => ({ name: "", photo: null, preview: null });

export function AddTopicForm({ onCreated }: AddTopicFormProps) {
  const [title, setTitle] = useState("");
  const [presenters, setPresenters] = useState<PresenterDraft[]>([emptyPresenter()]);
  const [submitting, setSubmitting] = useState(false);

  const updatePresenter = (index: number, patch: Partial<PresenterDraft>) => {
    setPresenters((previous) =>
      previous.map((presenter, i) => (i === index ? { ...presenter, ...patch } : presenter))
    );
  };

  const handlePhotoChange = (index: number, file: File | undefined) => {
    if (!file) {
      return;
    }
    updatePresenter(index, { photo: file, preview: URL.createObjectURL(file) });
  };

  const addPresenterRow = () => {
    setPresenters((previous) => [...previous, emptyPresenter()]);
  };

  const removePresenterRow = (index: number) => {
    setPresenters((previous) => previous.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle("");
    setPresenters([emptyPresenter()]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (presenters.some((presenter) => !presenter.name.trim())) {
      toast.error("Please fill in every presenter name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          presenterNames: presenters.map((presenter) => presenter.name.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add topic");
        return;
      }

      resetForm();
      onCreated();

      const photoResults = await Promise.allSettled(
        presenters.map(async (presenter, index) => {
          if (!presenter.photo) {
            return;
          }

          const presenterId = data.presenters[index].id;
          const compressedPhoto = await compressImageFile(presenter.photo);
          const photoForm = new FormData();
          photoForm.append("photo", compressedPhoto);

          const photoRes = await fetch(`/api/presenters/${presenterId}/photo`, {
            method: "POST",
            body: photoForm,
            cache: "no-store",
          });

          if (!photoRes.ok) {
            const errorBody = (await photoRes.json().catch(() => null)) as { error?: string } | null;
            throw new Error(errorBody?.error || "photo-upload-failed");
          }
        })
      );

      const failedPhotos = photoResults.filter((result) => result.status === "rejected").length;
      const hasPhotos = presenters.some((presenter) => presenter.photo);

      if (failedPhotos > 0) {
        toast.error("Topic saved, but some photos failed to upload");
      } else if (hasPhotos) {
        toast.success(`"${data.title}" added with photos and QR code`);
      } else {
        toast.success(`"${data.title}" added with a unique QR code`);
      }

      onCreated();
    } catch {
      toast.error("Failed to add topic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="admin-form-label" htmlFor="topic-title">
          Presentation Topic
        </label>
        <input
          id="topic-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Q1 Product Innovation"
          required
          className="admin-form-input"
        />
      </div>

      {presenters.map((presenter, index) => (
        <div key={index} className="flex items-center gap-3">
          <label className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
            {presenter.preview ? (
              <img src={presenter.preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <Upload className="h-4 w-4 text-slate-500" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handlePhotoChange(index, event.target.files?.[0])}
              className="hidden"
            />
          </label>
          <input
            value={presenter.name}
            onChange={(event) => updatePresenter(index, { name: event.target.value })}
            placeholder={`Presenter ${index + 1} name`}
            required
            className="admin-form-input"
          />
          {presenters.length > 1 ? (
            <button
              type="button"
              onClick={() => removePresenterRow(index)}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Remove presenter"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ))}

      <button
        type="button"
        onClick={addPresenterRow}
        className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add co-presenter
      </button>

      <button type="submit" disabled={submitting} className="admin-submit-btn">
        {submitting ? "Adding..." : "Add Topic & Generate QR"}
      </button>
    </form>
  );
}
