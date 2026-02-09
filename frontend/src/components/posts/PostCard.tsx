import { Link } from "react-router-dom";
import type { Post } from "../../api/types";
import Button from "../common/Button";
import "./PostCard.css";

interface PostCardProps {
  post: Post;
  showActions?: boolean;
  onDelete?: (id: string) => void;
}

export default function PostCard({ post, showActions, onDelete }: PostCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString();

  return (
    <article className="post-card">
      <div className="post-header">
        <h2 className="post-title">{post.title}</h2>
        <span className={`post-status post-status-${post.status}`}>
          {post.status}
        </span>
      </div>

      {post.content && (
        <p className="post-content">
          {post.content.length > 200
            ? `${post.content.slice(0, 200)}...`
            : post.content}
        </p>
      )}

      <div className="post-meta">
        <span>By {post.user?.email || "Unknown"}</span>
        <span>{formattedDate}</span>
      </div>

      {showActions && (
        <div className="post-actions">
          <Link to={`/posts/${post.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button variant="danger" onClick={() => onDelete?.(post.id)}>
            Delete
          </Button>
        </div>
      )}
    </article>
  );
}
