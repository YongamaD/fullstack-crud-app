import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import * as authApi from "../api/auth";
import * as storage from "../utils/storage";

// Mock the API and storage modules
vi.mock("../api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock("../utils/storage", () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

// Test component that uses the auth hook
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout, register } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="authenticated">{isAuthenticated ? "yes" : "no"}</div>
      <div data-testid="user">{user ? user.email : "no-user"}</div>
      <button onClick={() => login("test@example.com", "password123")}>Login</button>
      <button onClick={() => register("new@example.com", "password123")}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.getToken).mockReturnValue(null);
  });

  test("provides initial unauthenticated state when no token", async () => {
    vi.mocked(storage.getToken).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });

  test("checks token on mount and fetches user if token exists", async () => {
    vi.mocked(storage.getToken).mockReturnValue("existing-token");
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      user: { id: "1", email: "existing@example.com", createdAt: new Date().toISOString() },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("existing@example.com");
    });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("yes");
  });

  test("removes token if getMe fails", async () => {
    vi.mocked(storage.getToken).mockReturnValue("invalid-token");
    vi.mocked(authApi.getMe).mockRejectedValueOnce(new Error("Invalid token"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(storage.removeToken).toHaveBeenCalled();
    });
  });

  test("login stores token and fetches user", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValueOnce({ token: "new-token" });
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      user: { id: "1", email: "test@example.com", createdAt: new Date().toISOString() },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(storage.setToken).toHaveBeenCalledWith("new-token");
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });
  });

  test("register stores token and fetches user", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValueOnce({ token: "new-token" });
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      user: { id: "2", email: "new@example.com", createdAt: new Date().toISOString() },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("new@example.com");
    });
  });

  test("logout removes token and clears user", async () => {
    const user = userEvent.setup();
    vi.mocked(storage.getToken).mockReturnValue("existing-token");
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      user: { id: "1", email: "logged-in@example.com", createdAt: new Date().toISOString() },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("yes");
    });

    await user.click(screen.getByText("Logout"));

    expect(storage.removeToken).toHaveBeenCalled();
    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });
});

describe("useAuth hook", () => {
  test("throws error when used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });
});
