import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/layout/Layout";

test("renders app header", () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/Posts App/i)).toBeInTheDocument();
});
