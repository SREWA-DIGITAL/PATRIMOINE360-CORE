// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthResponseByAccessToken: vi.fn().mockResolvedValue({
    data: {
      user: {
        id: "auth-user-id",
        email: "user@example.com",
      },
    },
    error: null,
  }),
  findUnique: vi.fn().mockResolvedValue({
    id: "user-1",
    email: "user@example.com",
    firstName: "Alex",
    lastName: "Martin",
    profilePicture: null,
    onboarded: true,
    deletedAt: null,
  }),
}));

vi.mock("~/modules/auth/service.server", () => ({
  getAuthResponseByAccessToken: mocks.getAuthResponseByAccessToken,
}));

vi.mock("~/database/db.server", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
  },
}));

const { requireMobileAuth } = await import("./mobile-auth.server");

describe("requireMobileAuth", () => {
  beforeEach(() => {
    mocks.getAuthResponseByAccessToken.mockClear();
    mocks.findUnique.mockClear();
  });

  it("validates bearer tokens through the auth service facade", async () => {
    const request = new Request("http://localhost/api/mobile", {
      headers: {
        Authorization: "Bearer access-token",
      },
    });

    const result = await requireMobileAuth(request);

    expect(mocks.getAuthResponseByAccessToken).toHaveBeenCalledWith(
      "access-token"
    );
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        onboarded: true,
        deletedAt: true,
      },
    });
    expect(result.user).toEqual({
      id: "user-1",
      email: "user@example.com",
      firstName: "Alex",
      lastName: "Martin",
      profilePicture: null,
      onboarded: true,
    });
  });
});
