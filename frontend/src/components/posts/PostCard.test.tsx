import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import PostCard from "./PostCard";
import type { Post } from "../../api/types";

const mockPost: Post = {
  id: "test-id-123",
  title: "Test Post Title",
  content: "This is the content of the test post.",
  status: "published",
  createdAt: "2024-01-15T10:30:00Z",
  user: { id: "user-1", email: "author@example.com" },
};

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("PostCard", () => {
  it("renders post title", () => {
    renderWithRouter(<PostCard post={mockPost} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Test Post Title");
  });

  it("renders post content", () => {
    renderWithRouter(<PostCard post={mockPost} />);
    expect(screen.getByText("This is the content of the test post.")).toBeInTheDocument();
  });

  it("truncates long content to 200 characters", () => {
    const longContent = "A".repeat(250);
    const postWithLongContent = { ...mockPost, content: longContent };
    renderWithRouter(<PostCard post={postWithLongContent} />);
    expect(screen.getByText(/^A{200}\.\.\.$/)).toBeInTheDocument();
  });

  it("renders post status badge", () => {
    renderWithRouter(<PostCard post={mockPost} />);
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("applies correct status class", () => {
    renderWithRouter(<PostCard post={mockPost} />);
    expect(screen.getByText("published")).toHaveClass("post-status-published");
  });

  it("renders draft status", () => {
    const draftPost = { ...mockPost, status: "draft" as const };
    renderWithRouter(<PostCard post={draftPost} />);
    expect(screen.getByText("draft")).toHaveClass("post-status-draft");
  });

  it("renders author email", () => {
    renderWithRouter(<PostCard post={mockPost} />);
    expect(screen.getByText("By author@example.com")).toBeInTheDocument();
  });

  it("shows 'Unknown' when user is not provided", () => {
    const postWithoutUser = { ...mockPost, user: undefined };
    renderWithRouter(<PostCard post={postWithoutUser} />);
    expect(screen.getByText("By Unknown")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    renderWithRouter(<PostCard post={mockPost} />);
    // Date format depends on locale, just check it's there
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
  });

  it("does not render actions by default", () => {
    renderWithRouter(<PostCard post={mockPost} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("renders Edit and Delete buttons when showActions is true", () => {
    renderWithRouter(<PostCard post={mockPost} showActions />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("Edit button links to correct edit page", () => {
    renderWithRouter(<PostCard post={mockPost} showActions />);
    const editLink = screen.getByRole("link");
    expect(editLink).toHaveAttribute("href", "/posts/test-id-123/edit");
  });

  it("calls onDelete when Delete button is clicked", () => {
    const handleDelete = vi.fn();
    renderWithRouter(<PostCard post={mockPost} showActions onDelete={handleDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(handleDelete).toHaveBeenCalledWith("test-id-123");
  });

  it("renders without content when content is empty", () => {
    const postWithoutContent = { ...mockPost, content: undefined };
    renderWithRouter(<PostCard post={postWithoutContent} />);
    expect(screen.getByRole("heading")).toHaveTextContent("Test Post Title");
    expect(screen.queryByText("This is the content")).not.toBeInTheDocument();
  });
});
