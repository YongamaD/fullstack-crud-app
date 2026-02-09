import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyPosts, deletePost } from "../api/posts";
import type { Post, Pagination } from "../api/types";
import PostList from "../components/posts/PostList";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Button from "../components/common/Button";
import "./PostsPage.css";

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPosts();
  }, [page]);

  async function loadPosts() {
    setIsLoading(true);
    setError("");
    try {
      const response = await getMyPosts({ page });
      setPosts(response.posts);
      setPagination(response.pagination || null);
    } catch (err) {
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      setError("Failed to delete post");
    }
  }

  if (isLoading && posts.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="posts-page">
      <div className="posts-header">
        <h1>My Posts</h1>
        <Link to="/posts/new">
          <Button>Create Post</Button>
        </Link>
      </div>

      {error && <div className="posts-error">{error}</div>}

      <PostList
        posts={posts}
        showActions
        onDelete={handleDelete}
        emptyMessage="You haven't created any posts yet"
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
