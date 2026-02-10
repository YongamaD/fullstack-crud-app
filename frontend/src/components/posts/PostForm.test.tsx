import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostForm from "./PostForm";

describe("PostForm", () => {
  test("renders form fields", () => {
    render(<PostForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  test("renders with custom submit label", () => {
    render(<PostForm onSubmit={vi.fn()} submitLabel="Create Post" />);

    expect(screen.getByRole("button", { name: /create post/i })).toBeInTheDocument();
  });

  test("populates fields with initial data", () => {
    render(
      <PostForm
        onSubmit={vi.fn()}
        initialData={{
          title: "Test Title",
          content: "Test Content",
          status: "published",
        }}
      />
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue("Test Title");
    expect(screen.getByLabelText(/content/i)).toHaveValue("Test Content");
    expect(screen.getByLabelText(/status/i)).toHaveValue("published");
  });

  test("prevents submit when title is empty (native validation)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PostForm onSubmit={onSubmit} />);

    // The input has required attribute which prevents form submission
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toBeRequired();

    await user.click(screen.getByRole("button", { name: /save/i }));

    // Native validation prevents onSubmit from being called
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("shows error when title is only whitespace", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<PostForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "   ");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("calls onSubmit with form data when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<PostForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "My Post Title");
    await user.type(screen.getByLabelText(/content/i), "My post content");
    await user.selectOptions(screen.getByLabelText(/status/i), "published");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: "My Post Title",
        content: "My post content",
        status: "published",
      });
    });
  });

  test("trims whitespace from title and content", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<PostForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "  Trimmed Title  ");
    await user.type(screen.getByLabelText(/content/i), "  Trimmed Content  ");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Trimmed Title",
          content: "Trimmed Content",
        })
      );
    });
  });

  test("sends undefined for empty content", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<PostForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "Title Only");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Title Only",
          content: undefined,
        })
      );
    });
  });

  test("displays error message when onSubmit throws", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server error"));

    render(<PostForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), "Test Title");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  test("shows loading state", () => {
    render(<PostForm onSubmit={vi.fn()} isLoading />);

    const button = screen.getByRole("button", { name: /loading/i });
    expect(button).toBeDisabled();
  });

  test("defaults status to draft", () => {
    render(<PostForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/status/i)).toHaveValue("draft");
  });

  test("status can be changed", async () => {
    const user = userEvent.setup();

    render(<PostForm onSubmit={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/status/i), "published");

    expect(screen.getByLabelText(/status/i)).toHaveValue("published");
  });
});
