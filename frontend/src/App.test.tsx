import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import App from "./App";

test("renders app shell", () => {
  render(<App />);
  expect(screen.getByText(/Fullstack CRUD App/i)).toBeInTheDocument();
});
