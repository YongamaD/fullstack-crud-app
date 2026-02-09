import { useState, useEffect, useCallback } from "react";
import { getPosts } from "../api/posts";
import type { Post, Pagination } from "../api/types";
import PostList from "../components/posts/PostList";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Button from "../components/common/Button";
import "./PostsPage.css";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getPosts({ page, search: search || undefined });
      setPosts(response.posts);
      setPagination(response.pagination || null);
    } catch {
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  if (isLoading && posts.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="posts-page">
      <div className="posts-header">
        <h1>Published Posts</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {error && <div className="posts-error">{error}</div>}

      <PostList posts={posts} emptyMessage="No published posts yet" />

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
