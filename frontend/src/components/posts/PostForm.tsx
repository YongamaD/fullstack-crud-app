import { useState, type FormEvent } from "react";
import type { Post, CreatePostData, UpdatePostData } from "../../api/types";
import Input from "../common/Input";
import Button from "../common/Button";
import "./PostForm.css";

interface PostFormProps {
  initialData?: Partial<Post>;
  onSubmit: (data: CreatePostData | UpdatePostData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function PostForm({
  initialData,
  onSubmit,
  isLoading,
  submitLabel = "Save",
}: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status || "draft"
  );
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      await onSubmit({ title: title.trim(), content: content.trim() || undefined, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="post-form">
      {error && <div className="post-form-error">{error}</div>}

      <Input
        id="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={255}
      />

      <div className="form-group">
        <label htmlFor="content" className="form-label">
          Content
        </label>
        <textarea
          id="content"
          className="form-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
        />
      </div>

      <div className="form-group">
        <label htmlFor="status" className="form-label">
          Status
        </label>
        <select
          id="status"
          className="form-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <Button type="submit" isLoading={isLoading}>
        {submitLabel}
      </Button>
    </form>
  );
}
