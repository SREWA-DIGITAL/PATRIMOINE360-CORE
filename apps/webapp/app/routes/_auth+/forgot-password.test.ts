// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn().mockResolvedValue({ id: "user-1", sso: false }),
  resetPasswordWithOtp: vi.fn().mockResolvedValue(undefined),
  sendResetPasswordLink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/database/db.server", () => ({
  db: {
    user: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("~/modules/auth/service.server", () => ({
  resetPasswordWithOtp: mocks.resetPasswordWithOtp,
  sendResetPasswordLink: mocks.sendResetPasswordLink,
}));

const { action } = await import("./forgot-password");

describe("forgot-password route action", () => {
  beforeEach(() => {
    mocks.findFirst.mockClear();
    mocks.resetPasswordWithOtp.mockClear();
    mocks.sendResetPasswordLink.mockClear();
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
    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

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

  it("resets the password through the backend OTP flow", async () => {
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
    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(mocks.resetPasswordWithOtp).toHaveBeenCalledWith(
      "user@example.com",
      "123456",
      "password-123"
    );
    expect(destroySession).toHaveBeenCalled();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?password_reset=true");
  });
});
