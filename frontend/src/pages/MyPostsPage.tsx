import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { getMyPosts, deletePost } from "../api/posts";
import type { Post, Pagination } from "../api/types";
import PostList from "../components/posts/PostList";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Button from "../components/common/Button";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import "./PostsPage.css";

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const { targetRef, isIntersecting } = useIntersectionObserver();
  const isLoadingRef = useRef(false);

  const hasMore = pagination ? page < pagination.totalPages : false;

  const loadPosts = useCallback(async (pageNum: number, isInitial: boolean) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError("");

    try {
      const response = await getMyPosts({ page: pageNum });

      if (isInitial) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      setPagination(response.pagination || null);
    } catch {
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPosts(1, true);
  }, [loadPosts]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, false);
    }
  }, [isIntersecting, hasMore, isLoading, isLoadingMore, page, loadPosts]);

  function handleLoadMore() {
    if (hasMore && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch {
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

      {/* Infinite scroll trigger */}
      <div ref={targetRef} className="scroll-trigger" />

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="loading-more">
          <LoadingSpinner />
        </div>
      )}

      {/* Fallback load more button */}
      {hasMore && !isLoadingMore && (
        <div className="load-more-container">
          <Button variant="secondary" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {/* End of list message */}
      {!hasMore && posts.length > 0 && !isLoading && (
        <div className="end-of-list">
          No more posts to load
        </div>
      )}
    </div>
  );
}
