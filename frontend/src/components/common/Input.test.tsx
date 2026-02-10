import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Input from "./Input";

describe("Input", () => {
  it("renders with label", () => {
    render(<Input id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("associates label with input via id", () => {
    render(<Input id="email" label="Email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "email");
  });

  it("renders error message when provided", () => {
    render(<Input id="email" label="Email" error="Invalid email" />);
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("applies error class when error is provided", () => {
    render(<Input id="email" label="Email" error="Invalid email" />);
    expect(screen.getByLabelText("Email")).toHaveClass("form-input-error");
  });

  it("sets aria-invalid when error is provided", () => {
    render(<Input id="email" label="Email" error="Invalid email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Input id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
  });

  it("passes through type prop", () => {
    render(<Input id="password" label="Password" type="password" />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("passes through placeholder prop", () => {
    render(<Input id="email" label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("placeholder", "Enter email");
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<Input id="email" label="Email" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("respects required prop", () => {
    render(<Input id="email" label="Email" required />);
    expect(screen.getByLabelText("Email")).toBeRequired();
  });

  it("respects disabled prop", () => {
    render(<Input id="email" label="Email" disabled />);
    expect(screen.getByLabelText("Email")).toBeDisabled();
  });

  it("respects minLength prop", () => {
    render(<Input id="password" label="Password" minLength={8} />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "8");
  });
});
