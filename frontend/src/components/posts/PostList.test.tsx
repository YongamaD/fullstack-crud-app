import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import PostList from "./PostList";
import type { Post } from "../../api/types";

const mockPosts: Post[] = [
  {
    id: "post-1",
    title: "First Post",
    content: "Content of first post",
    status: "published",
    createdAt: "2024-01-15T10:00:00Z",
    user: { id: "user-1", email: "user1@example.com" },
  },
  {
    id: "post-2",
    title: "Second Post",
    content: "Content of second post",
    status: "draft",
    createdAt: "2024-01-16T10:00:00Z",
    user: { id: "user-2", email: "user2@example.com" },
  },
  {
    id: "post-3",
    title: "Third Post",
    content: "Content of third post",
    status: "published",
    createdAt: "2024-01-17T10:00:00Z",
    user: { id: "user-1", email: "user1@example.com" },
  },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("PostList", () => {
  it("renders all posts", () => {
    renderWithRouter(<PostList posts={mockPosts} />);
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Second Post")).toBeInTheDocument();
    expect(screen.getByText("Third Post")).toBeInTheDocument();
  });

  it("renders empty message when posts array is empty", () => {
    renderWithRouter(<PostList posts={[]} />);
    expect(screen.getByText("No posts found")).toBeInTheDocument();
  });

  it("renders custom empty message", () => {
    renderWithRouter(<PostList posts={[]} emptyMessage="You have no posts yet" />);
    expect(screen.getByText("You have no posts yet")).toBeInTheDocument();
  });

  it("does not show actions by default", () => {
    renderWithRouter(<PostList posts={mockPosts} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows actions on all posts when showActions is true", () => {
    renderWithRouter(<PostList posts={mockPosts} showActions />);
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });

  it("calls onDelete with correct post id when Delete is clicked", () => {
    const handleDelete = vi.fn();
    renderWithRouter(<PostList posts={mockPosts} showActions onDelete={handleDelete} />);

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[1]); // Click delete on second post

    expect(handleDelete).toHaveBeenCalledWith("post-2");
  });

  it("renders posts in provided order", () => {
    renderWithRouter(<PostList posts={mockPosts} />);
    const headings = screen.getAllByRole("heading");
    expect(headings[0]).toHaveTextContent("First Post");
    expect(headings[1]).toHaveTextContent("Second Post");
    expect(headings[2]).toHaveTextContent("Third Post");
  });

  it("renders single post correctly", () => {
    renderWithRouter(<PostList posts={[mockPosts[0]]} />);
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.queryByText("Second Post")).not.toBeInTheDocument();
  });
});
