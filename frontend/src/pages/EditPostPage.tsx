import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost, updatePost } from "../api/posts";
import { ApiClientError } from "../api/client";
import type { Post, UpdatePostData } from "../api/types";
import PostForm from "../components/posts/PostForm";
import LoadingSpinner from "../components/common/LoadingSpinner";
import "./CreatePostPage.css";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadPost(id);
    }
  }, [id]);

  async function loadPost(postId: string) {
    try {
      const response = await getPost(postId);
      setPost(response.post);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load post");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(data: UpdatePostData) {
    if (!id) return;
    setIsSaving(true);
    try {
      await updatePost(id, data);
      navigate("/my-posts");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 403) {
          setError("You can only edit your own posts");
        } else {
          setError(err.message);
        }
      }
      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="create-post-page">
        <div className="posts-error">{error}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="create-post-page">
        <div className="posts-error">Post not found</div>
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <h1>Edit Post</h1>
      <PostForm
        initialData={post}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        submitLabel="Update Post"
      />
    </div>
  );
}
