import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/posts";
import type { CreatePostData, UpdatePostData } from "../api/types";
import PostForm from "../components/posts/PostForm";
import "./CreatePostPage.css";

export default function CreatePostPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(data: CreatePostData | UpdatePostData) {
    setIsLoading(true);
    try {
      await createPost(data as CreatePostData);
      navigate("/my-posts");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="create-post-page">
      <h1>Create Post</h1>
      <PostForm onSubmit={handleSubmit} isLoading={isLoading} submitLabel="Create Post" />
    </div>
  );
}
