import { describe, expect, it } from "vitest";
import { ShelfError } from "./error";
import {
  isStorageRateLimitError,
  isStorageServerError,
} from "./storage-error-classifier.server";
import { findShelfErrorInCause } from "./storage.server";

describe("isStorageRateLimitError", () => {
  it("returns true for StorageApiError with numeric status 429", () => {
    const error = {
      name: "StorageApiError",
      message: "Too many requests",
      status: 429,
    };
    expect(isStorageRateLimitError(error)).toBe(true);
  });

  it("returns true for StorageApiError with string statusCode '429'", () => {
    const error = {
      name: "StorageApiError",
      message: "Rate limit exceeded",
      statusCode: "429",
    };
    expect(isStorageRateLimitError(error)).toBe(true);
  });

  it('returns true for StorageApiError with "too many" in message', () => {
    const error = {
      name: "StorageApiError",
      message: "Too many connections issued to the database",
      status: 0,
    };
    expect(isStorageRateLimitError(error)).toBe(true);
  });

  it('returns true for case-insensitive "too many" matching', () => {
    const error = {
      name: "StorageApiError",
      message: "TOO MANY REQUESTS",
    };
    expect(isStorageRateLimitError(error)).toBe(true);
  });

  it("returns false for non-StorageApiError with status 429", () => {
    const error = {
      name: "StorageUnknownError",
      message: "Some error",
      status: 429,
    };
    expect(isStorageRateLimitError(error)).toBe(false);
  });

  it("returns false for StorageApiError with non-429 status", () => {
    const error = {
      name: "StorageApiError",
      message: "Not found",
      status: 404,
    };
    expect(isStorageRateLimitError(error)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isStorageRateLimitError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isStorageRateLimitError(undefined)).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isStorageRateLimitError("error")).toBe(false);
    expect(isStorageRateLimitError(42)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(isStorageRateLimitError({})).toBe(false);
  });
});

describe("isStorageServerError", () => {
  it("returns true for StorageApiError with status 504", () => {
    const error = {
      name: "StorageApiError",
      message: "Gateway Timeout",
      status: 504,
    };
    expect(isStorageServerError(error)).toBe(true);
  });

  it("returns true for StorageApiError with status 502", () => {
    const error = {
      name: "StorageApiError",
      message: "Bad Gateway",
      status: 502,
    };
    expect(isStorageServerError(error)).toBe(true);
  });

  it("returns true for StorageApiError with status 503", () => {
    const error = {
      name: "StorageApiError",
      message: "Service Unavailable",
      status: 503,
    };
    expect(isStorageServerError(error)).toBe(true);
  });

  it("returns true for StorageApiError with status 500", () => {
    const error = {
      name: "StorageApiError",
      message: "Internal Server Error",
      status: 500,
    };
    expect(isStorageServerError(error)).toBe(true);
  });

  it("returns true for StorageApiError with string statusCode '504'", () => {
    const error = {
      name: "StorageApiError",
      message: "Gateway Timeout",
      statusCode: "504",
    };
    expect(isStorageServerError(error)).toBe(true);
  });

  it("returns false for non-StorageApiError with 5xx status", () => {
    const error = {
      name: "StorageUnknownError",
      message: "Some error",
      status: 504,
    };
    expect(isStorageServerError(error)).toBe(false);
  });

  it("returns false for StorageApiError with 4xx status", () => {
    const error = {
      name: "StorageApiError",
      message: "Not found",
      status: 404,
    };
    expect(isStorageServerError(error)).toBe(false);
  });

  it("returns false for StorageApiError with status 429 (rate limit)", () => {
    const error = {
      name: "StorageApiError",
      message: "Too many requests",
      status: 429,
    };
    expect(isStorageServerError(error)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isStorageServerError(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isStorageServerError(undefined)).toBe(false);
  });

  it("returns false for non-object values", () => {
    expect(isStorageServerError("error")).toBe(false);
    expect(isStorageServerError(42)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(isStorageServerError({})).toBe(false);
  });
});

describe("findShelfErrorInCause", () => {
  it("returns the ShelfError when it is the top-level error", () => {
    const shelfError = new ShelfError({
      cause: null,
      message: "Unsupported image format",
      title: "Bad format",
      label: "Crop image",
      shouldBeCaptured: false,
    });

    const result = findShelfErrorInCause(shelfError);

    expect(result).toBe(shelfError);
    expect(result?.message).toBe("Unsupported image format");
    expect(result?.title).toBe("Bad format");
    expect(result?.shouldBeCaptured).toBe(false);
  });

  it("finds a ShelfError nested one level deep in the cause chain", () => {
    const shelfError = new ShelfError({
      cause: null,
      message: "Unsupported image format",
      title: "Bad format",
      label: "Crop image",
      shouldBeCaptured: false,
    });

    // Simulates FormDataParseError wrapping a ShelfError
    const wrapper = new Error("Cannot parse form data");
    wrapper.cause = shelfError;

    const result = findShelfErrorInCause(wrapper);

    expect(result).toBe(shelfError);
    expect(result?.message).toBe("Unsupported image format");
    expect(result?.title).toBe("Bad format");
    expect(result?.shouldBeCaptured).toBe(false);
  });

  it("finds a ShelfError nested multiple levels deep", () => {
    const shelfError = new ShelfError({
      cause: null,
      message: "Original error",
      label: "File storage",
      shouldBeCaptured: false,
    });

    const innerWrapper = new Error("Inner wrapper");
    innerWrapper.cause = shelfError;

    const outerWrapper = new Error("Outer wrapper");
    outerWrapper.cause = innerWrapper;

    const result = findShelfErrorInCause(outerWrapper);

    expect(result).toBe(shelfError);
  });

  it("returns null when no ShelfError exists in the cause chain", () => {
    const plainError = new Error("Something went wrong");

    expect(findShelfErrorInCause(plainError)).toBeNull();
  });

  it("returns null for null input", () => {
    expect(findShelfErrorInCause(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(findShelfErrorInCause(undefined)).toBeNull();
  });
});
