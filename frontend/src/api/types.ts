// User types
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// Auth types
export interface AuthResponse {
  token: string;
}

export interface MeResponse {
  user: User;
}

// Post types
export interface Post {
  id: string;
  title: string;
  content: string | null;
  status: "draft" | "published";
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  user?: { id: string; email: string };
}

export interface PostsResponse {
  posts: Post[];
  pagination?: Pagination;
}

export interface PostResponse {
  post: Post;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Error types
export interface ApiError {
  error: string;
  details?: Array<{ path: string; message: string }>;
}

// Form data types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface CreatePostData {
  title: string;
  content?: string;
  status?: "draft" | "published";
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  status?: "draft" | "published";
}
