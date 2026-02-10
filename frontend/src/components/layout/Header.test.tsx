import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Header from "./Header";
import { AuthContext } from "../../context/auth-context";

const mockLogout = vi.fn();

function renderWithAuth(isAuthenticated: boolean, email?: string) {
  return render(
    <AuthContext.Provider
      value={{
        user: isAuthenticated ? { id: "1", email: email || "test@example.com" } : null,
        isAuthenticated,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
      }}
    >
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

describe("Header", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it("renders logo with link to home", () => {
    renderWithAuth(false);
    const logo = screen.getByText("Posts App");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("href", "/");
  });

  it("always shows Posts link", () => {
    renderWithAuth(false);
    expect(screen.getByRole("link", { name: "Posts" })).toHaveAttribute("href", "/");
  });

  describe("when not authenticated", () => {
    it("shows Login link", () => {
      renderWithAuth(false);
      expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    });

    it("shows Register link", () => {
      renderWithAuth(false);
      expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
    });

    it("does not show My Posts link", () => {
      renderWithAuth(false);
      expect(screen.queryByRole("link", { name: "My Posts" })).not.toBeInTheDocument();
    });

    it("does not show Create Post link", () => {
      renderWithAuth(false);
      expect(screen.queryByRole("link", { name: "Create Post" })).not.toBeInTheDocument();
    });

    it("does not show Logout button", () => {
      renderWithAuth(false);
      expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
    });
  });

  describe("when authenticated", () => {
    it("shows user email", () => {
      renderWithAuth(true, "user@example.com");
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("shows My Posts link", () => {
      renderWithAuth(true);
      expect(screen.getByRole("link", { name: "My Posts" })).toHaveAttribute("href", "/my-posts");
    });

    it("shows Create Post link", () => {
      renderWithAuth(true);
      expect(screen.getByRole("link", { name: "Create Post" })).toHaveAttribute("href", "/posts/new");
    });

    it("shows Logout button", () => {
      renderWithAuth(true);
      expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    });

    it("calls logout when Logout button is clicked", () => {
      renderWithAuth(true);
      fireEvent.click(screen.getByRole("button", { name: "Logout" }));
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it("does not show Login link", () => {
      renderWithAuth(true);
      expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    });

    it("does not show Register link", () => {
      renderWithAuth(true);
      expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
    });
  });
});
