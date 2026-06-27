// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  isSupabaseStorageFetchFailedError,
  isSupabaseStorageHtmlError,
  isSupabaseStorageRateLimitError,
  isSupabaseStorageServerError,
} from "./supabase-storage-error-classifier.server";

describe("supabase storage error classifier", () => {
  it("detects HTML payload parsing failures returned by storage", () => {
    expect(
      isSupabaseStorageHtmlError({
        name: "StorageUnknownError",
        message: "Unexpected token < in JSON at position 0 <html>",
      })
    ).toBe(true);
  });

  it("detects storage fetch failures", () => {
    expect(
      isSupabaseStorageFetchFailedError({
        name: "StorageUnknownError",
        message: "fetch failed",
      })
    ).toBe(true);
  });

  it("detects storage rate limits", () => {
    expect(
      isSupabaseStorageRateLimitError({
        name: "StorageApiError",
        message: "Too many requests",
        status: 429,
      })
    ).toBe(true);
  });

  it("detects storage server errors", () => {
    expect(
      isSupabaseStorageServerError({
        name: "StorageApiError",
        message: "Gateway Timeout",
        status: 504,
      })
    ).toBe(true);
  });
});
