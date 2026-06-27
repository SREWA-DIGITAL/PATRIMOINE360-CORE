// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUpWithBetterAuthEmailPass: vi.fn().mockResolvedValue(undefined),
  findUserByEmail: vi.fn().mockResolvedValue(null),
  validateNonSSOSignup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/config/shelf.config", () => ({
  config: {
    disableSignup: false,
  },
}));

vi.mock("~/modules/auth/service.server", () => ({
  signUpWithBetterAuthEmailPass: mocks.signUpWithBetterAuthEmailPass,
}));

vi.mock("~/modules/user/service.server", () => ({
  findUserByEmail: mocks.findUserByEmail,
}));

vi.mock("~/utils/sso.server", () => ({
  validateNonSSOSignup: mocks.validateNonSSOSignup,
}));

const { action } = await import("./join");

describe("join route action", () => {
  beforeEach(() => {
    mocks.signUpWithBetterAuthEmailPass.mockClear();
    mocks.findUserByEmail.mockClear();
    mocks.validateNonSSOSignup.mockClear();
  });

  it("creates a Better Auth password signup and redirects to login email verification notice", async () => {
    const request = new Request("http://localhost/join", {
      method: "POST",
      body: new URLSearchParams({
        email: "USER@example.com",
        password: "password-123",
        confirmPassword: "password-123",
        redirectTo: "/assets",
      }),
    });

    const response = await action({ request } as never);
    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(mocks.validateNonSSOSignup).toHaveBeenCalledWith("user@example.com");
    expect(mocks.findUserByEmail).toHaveBeenCalledWith("user@example.com");
    expect(mocks.signUpWithBetterAuthEmailPass).toHaveBeenCalledWith(
      "user@example.com",
      "password-123",
      "/assets"
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/login?email=user%40example.com&email_sent=true&redirectTo=%2Fassets"
    );
  });
});
