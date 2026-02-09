import type { Post } from "../../api/types";
import PostCard from "./PostCard";
import "./PostList.css";

interface PostListProps {
  posts: Post[];
  showActions?: boolean;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export default function PostList({
  posts,
  showActions,
  onDelete,
  emptyMessage = "No posts found",
}: PostListProps) {
  if (posts.length === 0) {
    return <p className="posts-empty">{emptyMessage}</p>;
  }

  return (
    <div className="posts-list">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          showActions={showActions}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
