import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import * as useAuthModule from "../hooks/useAuth";

// Mock the useAuth hook
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows loading spinner when isLoading is true", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  test("renders children when authenticated", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: "1", email: "test@example.com", createdAt: new Date().toISOString() },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  test("redirects to login when not authenticated", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("does not show spinner when not loading", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: "1", email: "test@example.com", createdAt: new Date().toISOString() },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });
});
