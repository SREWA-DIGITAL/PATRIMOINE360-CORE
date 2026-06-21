// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn().mockResolvedValue({ id: "user-1", sso: false }),
  sendResetPasswordLink: vi.fn().mockResolvedValue(undefined),
  updateAccountPassword: vi.fn().mockResolvedValue(undefined),
  verifyRecoveryOtp: vi.fn().mockResolvedValue({
    userId: "auth-user-id",
    accessToken: "access-token",
  }),
}));

vi.mock("~/database/db.server", () => ({
  db: {
    user: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("~/modules/auth/service.server", () => ({
  sendResetPasswordLink: mocks.sendResetPasswordLink,
  updateAccountPassword: mocks.updateAccountPassword,
  verifyRecoveryOtp: mocks.verifyRecoveryOtp,
}));

const { action } = await import("./forgot-password");

describe("forgot-password route action", () => {
  beforeEach(() => {
    mocks.findFirst.mockClear();
    mocks.sendResetPasswordLink.mockClear();
    mocks.updateAccountPassword.mockClear();
    mocks.verifyRecoveryOtp.mockClear();
  });

  it("sends reset OTPs through the backend flow", async () => {
    const request = new Request("http://localhost/forgot-password", {
      method: "POST",
      body: new URLSearchParams({
        intent: "request-otp",
        email: "USER@example.com",
      }),
    });

    const response = await action({
      request,
      context: {
        destroySession: vi.fn(),
      },
    } as never);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: {
        id: true,
        sso: true,
      },
    });
    expect(mocks.sendResetPasswordLink).toHaveBeenCalledWith(
      "user@example.com"
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/forgot-password?email=user@example.com"
    );
  });

  it("verifies recovery OTPs and updates the password", async () => {
    const destroySession = vi.fn();
    const request = new Request("http://localhost/forgot-password", {
      method: "POST",
      body: new URLSearchParams({
        intent: "confirm-otp",
        email: "user@example.com",
        otp: "123456",
        password: "password-123",
        confirmPassword: "password-123",
      }),
    });

    const response = await action({
      request,
      context: {
        destroySession,
      },
    } as never);

    expect(mocks.verifyRecoveryOtp).toHaveBeenCalledWith(
      "user@example.com",
      "123456"
    );
    expect(mocks.updateAccountPassword).toHaveBeenCalledWith(
      "auth-user-id",
      "password-123",
      "access-token"
    );
    expect(destroySession).toHaveBeenCalled();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?password_reset=true");
  });
});
