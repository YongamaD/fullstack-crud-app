import { useState, useEffect, useCallback, useRef } from "react";
import { getPosts } from "../api/posts";
import type { Post, Pagination } from "../api/types";
import PostList from "../components/posts/PostList";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Button from "../components/common/Button";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import "./PostsPage.css";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const { targetRef, isIntersecting } = useIntersectionObserver();
  const isLoadingRef = useRef(false);

  const hasMore = pagination ? page < pagination.totalPages : false;

  const loadPosts = useCallback(async (pageNum: number, isNewSearch: boolean) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (isNewSearch) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError("");

    try {
      const response = await getPosts({ page: pageNum, search: search || undefined });

      if (isNewSearch) {
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
  }, [search]);

  // Initial load and search changes
  useEffect(() => {
    setPage(1);
    setPosts([]);
    loadPosts(1, true);
  }, [search, loadPosts]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, false);
    }
  }, [isIntersecting, hasMore, isLoading, isLoadingMore, page, loadPosts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function handleLoadMore() {
    if (hasMore && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, false);
    }
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {error && <div className="posts-error">{error}</div>}

      <PostList posts={posts} emptyMessage="No published posts yet" />

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
