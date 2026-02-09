import { apiClient } from "./client";
import type { AuthResponse, MeResponse, LoginData, RegisterData } from "./types";

export async function login(data: LoginData): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<MeResponse> {
  return apiClient<MeResponse>("/auth/me");
}
