// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  getAuthErrorCode,
  getAuthErrorMessage,
  isAuthApiErrorLike,
  isRetryableAuthError,
} from "./supabase-auth-error-classifier.server";

describe("supabase auth error classifier", () => {
  it("extracts auth error codes", () => {
    expect(getAuthErrorCode({ code: "email_exists" })).toBe("email_exists");
  });

  it("returns null when no auth error code exists", () => {
    expect(getAuthErrorCode({ message: "missing code" })).toBeNull();
  });

  it("keeps readable auth error messages", () => {
    expect(getAuthErrorMessage({ message: "Invalid login credentials" })).toBe(
      "Invalid login credentials"
    );
  });

  it("drops unusable auth error messages", () => {
    expect(getAuthErrorMessage({ message: "{}" })).toBeNull();
  });

  it("detects auth api errors", () => {
    expect(
      isAuthApiErrorLike({
        __isAuthError: true,
        name: "AuthApiError",
        status: 429,
        code: "over_email_send_rate_limit",
        message: "Too many requests",
      })
    ).toBe(true);
  });

  it("detects retryable auth transport errors", () => {
    expect(
      isRetryableAuthError({
        __isAuthError: true,
        name: "AuthRetryableFetchError",
        message: "fetch failed",
      })
    ).toBe(true);
  });
});
