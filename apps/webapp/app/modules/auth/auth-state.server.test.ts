// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("~/database/db.server", () => ({
  db: {
    $queryRaw: mocks.queryRaw,
  },
}));

const { findAuthUserIdByEmail, isRefreshTokenActive } = await import(
  "./auth-state.server"
);

describe("auth state backend", () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset();
  });

  it("returns the auth user id when an auth account exists", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ id: "auth-user-id" }]);

    await expect(findAuthUserIdByEmail("User@Example.com")).resolves.toBe(
      "auth-user-id"
    );
  });

  it("returns null when no auth account exists for the email", async () => {
    mocks.queryRaw.mockResolvedValueOnce([]);

    await expect(findAuthUserIdByEmail("missing@example.com")).resolves.toBe(
      null
    );
  });

  it("returns true when the refresh token is still active", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "refresh-token-id", revoked: false },
    ]);

    await expect(isRefreshTokenActive("refresh-token")).resolves.toBe(true);
  });

  it("returns false when the refresh token is not active anymore", async () => {
    mocks.queryRaw.mockResolvedValueOnce([]);

    await expect(isRefreshTokenActive("refresh-token")).resolves.toBe(false);
  });
});
