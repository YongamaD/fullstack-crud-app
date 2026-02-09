import { getToken } from "../utils/storage";
import type { ApiError } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class ApiClientError extends Error {
  status: number;
  details?: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    status: number,
    details?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: "Network error",
    }));
    throw new ApiClientError(error.error, response.status, error.details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
