// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signUpWithEmailPass: vi.fn().mockResolvedValue(undefined),
  findUserByEmail: vi.fn().mockResolvedValue(null),
  validateNonSSOSignup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/config/shelf.config", () => ({
  config: {
    disableSignup: false,
  },
}));

vi.mock("~/modules/auth/service.server", () => ({
  signUpWithEmailPass: mocks.signUpWithEmailPass,
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
    mocks.signUpWithEmailPass.mockClear();
    mocks.findUserByEmail.mockClear();
    mocks.validateNonSSOSignup.mockClear();
  });

  it("creates a password signup and redirects to confirm_signup OTP flow", async () => {
    const request = new Request("http://localhost/join", {
      method: "POST",
      body: new URLSearchParams({
        email: "USER@example.com",
        password: "password-123",
        confirmPassword: "password-123",
      }),
    });

    const response = await action({ request } as never);

    expect(mocks.validateNonSSOSignup).toHaveBeenCalledWith("user@example.com");
    expect(mocks.findUserByEmail).toHaveBeenCalledWith("user@example.com");
    expect(mocks.signUpWithEmailPass).toHaveBeenCalledWith(
      "user@example.com",
      "password-123"
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/otp?email=user%40example.com&mode=confirm_signup"
    );
  });
});
