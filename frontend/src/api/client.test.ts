import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiClientError } from "./client";
import * as storage from "../utils/storage";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock storage module
vi.mock("../utils/storage", () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("makes GET request with correct URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiClient("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  test("includes Authorization header when token exists", async () => {
    vi.mocked(storage.getToken).mockReturnValue("test-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiClient("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  test("does not include Authorization header when no token", async () => {
    vi.mocked(storage.getToken).mockReturnValue(null);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiClient("/test");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  test("returns parsed JSON response", async () => {
    const responseData = { id: 1, name: "Test" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseData),
    });

    const result = await apiClient("/test");

    expect(result).toEqual(responseData);
  });

  test("handles 204 No Content response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error("No content")),
    });

    const result = await apiClient("/test");

    expect(result).toBeUndefined();
  });

  test("throws ApiClientError on error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad request", details: [] }),
    });

    await expect(apiClient("/test")).rejects.toThrow(ApiClientError);
  });

  test("ApiClientError contains status and message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    try {
      await apiClient("/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect((err as ApiClientError).status).toBe(401);
      expect((err as ApiClientError).message).toBe("Unauthorized");
    }
  });

  test("handles network error gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("Network error")),
    });

    try {
      await apiClient("/test");
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect((err as ApiClientError).message).toBe("Network error");
    }
  });

  test("passes custom options to fetch", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await apiClient("/test", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });
});

describe("ApiClientError", () => {
  test("is an instance of Error", () => {
    const error = new ApiClientError("Test error", 400);
    expect(error).toBeInstanceOf(Error);
  });

  test("has correct name", () => {
    const error = new ApiClientError("Test error", 400);
    expect(error.name).toBe("ApiClientError");
  });

  test("stores status code", () => {
    const error = new ApiClientError("Test error", 404);
    expect(error.status).toBe(404);
  });

  test("stores validation details", () => {
    const details = [{ path: "email", message: "Invalid email" }];
    const error = new ApiClientError("Validation failed", 400, details);
    expect(error.details).toEqual(details);
  });
});
