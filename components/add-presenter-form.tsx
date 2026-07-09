"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface AddPresenterFormProps {
  onCreated: () => void;
}

export function AddPresenterForm({ onCreated }: AddPresenterFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  const resetForm = () => {
    setName("");
    setTitle("");
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!photoFile) {
      toast.error("Please upload a presenter photo");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("title", title.trim());
      formData.append("photo", photoFile);

      const res = await fetch("/api/presenters", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add presenter");
        return;
      }

      toast.success(`${data.name} added with a unique QR code`);
      resetForm();
      onCreated();
    } catch {
      toast.error("Failed to add presenter");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="admin-form-label" htmlFor="presenter-name">
            Presenter Name
          </label>
          <input
            id="presenter-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jane Doe"
            required
            className="admin-form-input"
          />
        </div>
        <div>
          <label className="admin-form-label" htmlFor="presenter-topic">
            Presentation Topic
          </label>
          <input
            id="presenter-topic"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Q1 Product Innovation"
            required
            className="admin-form-input"
          />
        </div>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="hidden"
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`admin-upload-zone ${dragging ? "dragging" : ""}`}
        >
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Preview"
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <Upload className="h-8 w-8 text-slate-500" />
          )}
          <p>Choose file or drag and drop</p>
          <span>PNG, JPG up to 5MB</span>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="admin-submit-btn">
        {submitting ? "Adding..." : "Add Presenter & Generate QR"}
      </button>
    </form>
  );
}
