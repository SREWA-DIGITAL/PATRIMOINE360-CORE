// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUser: vi.fn().mockResolvedValue({ id: "domain-user-1" }),
  findUserByEmail: vi.fn().mockResolvedValue(null),
  generateUniqueUsername: vi.fn().mockResolvedValue("user123"),
  getSelectedOrganization: vi.fn().mockResolvedValue({
    organizationId: "org-1",
  }),
  setSelectedOrganizationIdCookie: vi
    .fn()
    .mockResolvedValue("organization=org-1"),
  verifyOtpAndSignin: vi.fn().mockResolvedValue({
    provider: "better-auth" as const,
    accessToken: "access-token",
    refreshToken: "access-token",
    userId: "user-1",
    email: "user@example.com",
    expiresAt: 1,
    expiresIn: 1,
  }),
}));

vi.mock("~/modules/auth/service.server", () => ({
  verifyOtpAndSignin: mocks.verifyOtpAndSignin,
}));

vi.mock("~/modules/organization/context.server", () => ({
  getSelectedOrganization: mocks.getSelectedOrganization,
  setSelectedOrganizationIdCookie: mocks.setSelectedOrganizationIdCookie,
}));

vi.mock("~/modules/user/service.server", () => ({
  createUser: mocks.createUser,
  findUserByEmail: mocks.findUserByEmail,
}));

vi.mock("~/modules/user/utils.server", () => ({
  generateUniqueUsername: mocks.generateUniqueUsername,
}));

vi.mock("~/utils/cookies.server", () => ({
  setCookie: vi.fn(() => ["set-cookie", "organization=org-1"]),
}));

const { action } = await import("./otp");

describe("otp route action", () => {
  it("signs the user in, creates the missing domain user and redirects with the organization cookie", async () => {
    const setSession = vi.fn();
    const response = await action({
      request: new Request("http://localhost/otp", {
        method: "POST",
        body: new URLSearchParams({
          email: "USER@example.com",
          otp: "123456",
        }),
      }),
      context: {
        setSession,
      },
    } as never);

    expect(mocks.verifyOtpAndSignin).toHaveBeenCalledWith(
      "user@example.com",
      "123456"
    );
    expect(mocks.findUserByEmail).toHaveBeenCalledWith("user@example.com");
    expect(mocks.generateUniqueUsername).toHaveBeenCalledWith(
      "user@example.com"
    );
    expect(mocks.createUser).toHaveBeenCalledWith({
      provider: "better-auth",
      accessToken: "access-token",
      refreshToken: "access-token",
      userId: "user-1",
      email: "user@example.com",
      expiresAt: 1,
      expiresIn: 1,
      username: "user123",
    });
    expect(setSession).toHaveBeenCalledWith({
      provider: "better-auth",
      accessToken: "access-token",
      refreshToken: "access-token",
      userId: "user-1",
      email: "user@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });
    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/assets");
    expect(response.headers.get("set-cookie")).toBe("organization=org-1");
  });
});
