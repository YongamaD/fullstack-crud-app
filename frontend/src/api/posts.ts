import { apiClient } from "./client";
import type {
  PostsResponse,
  PostResponse,
  CreatePostData,
  UpdatePostData,
  PaginationParams,
} from "./types";

function buildQueryString(params: PaginationParams): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getPosts(params: PaginationParams = {}): Promise<PostsResponse> {
  return apiClient<PostsResponse>(`/posts${buildQueryString(params)}`);
}

export async function getMyPosts(params: PaginationParams = {}): Promise<PostsResponse> {
  return apiClient<PostsResponse>(`/posts/me${buildQueryString(params)}`);
}

export async function getPost(id: string): Promise<PostResponse> {
  return apiClient<PostResponse>(`/posts/${id}`);
}

export async function createPost(data: CreatePostData): Promise<PostResponse> {
  return apiClient<PostResponse>("/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePost(id: string, data: UpdatePostData): Promise<PostResponse> {
  return apiClient<PostResponse>(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string): Promise<void> {
  return apiClient<void>(`/posts/${id}`, {
    method: "DELETE",
  });
}
