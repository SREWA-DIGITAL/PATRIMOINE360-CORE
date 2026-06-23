// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const betterAuthFindUnique = vi.fn().mockResolvedValue(null);
  const signUpWithBetterAuthEmail = vi.fn();
  const sendBetterAuthSignInOtp = vi.fn();
  const signInWithBetterAuthEmailOtp = vi.fn();
  const requestBetterAuthEmailChange = vi.fn();
  const requestBetterAuthPasswordResetOtp = vi.fn();
  const resetBetterAuthPasswordWithOtp = vi.fn();
  const revokeBetterAuthOtherSessions = vi.fn();
  const changeBetterAuthEmail = vi.fn();

  return {
    betterAuthFindUnique,
    changeBetterAuthEmail,
    requestBetterAuthEmailChange,
    requestBetterAuthPasswordResetOtp,
    resetBetterAuthPasswordWithOtp,
    revokeBetterAuthOtherSessions,
    sendBetterAuthSignInOtp,
    signInWithBetterAuthEmailOtp,
    signUpWithBetterAuthEmail,
  };
});

vi.mock("~/database/db.server", () => ({
  db: {
    betterAuthUser: {
      findUnique: mocks.betterAuthFindUnique,
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("./better-auth.server", () => ({
  isBetterAuthConfigured: vi.fn(() => true),
}));

vi.mock("./better-auth-session.server", () => ({
  changeBetterAuthEmail: mocks.changeBetterAuthEmail,
  getBetterAuthErrorCode: vi.fn(),
  getBetterAuthSession: vi.fn(),
  isBetterAuthApiError: vi.fn(),
  refreshBetterAuthAppSession: vi.fn(),
  requestBetterAuthEmailChange: mocks.requestBetterAuthEmailChange,
  requestBetterAuthPasswordResetOtp: mocks.requestBetterAuthPasswordResetOtp,
  resetBetterAuthPasswordWithOtp: mocks.resetBetterAuthPasswordWithOtp,
  revokeBetterAuthOtherSessions: mocks.revokeBetterAuthOtherSessions,
  sendBetterAuthSignInOtp: mocks.sendBetterAuthSignInOtp,
  signInWithBetterAuthEmail: vi.fn(),
  signInWithBetterAuthEmailOtp: mocks.signInWithBetterAuthEmailOtp,
  signOutBetterAuthSession: vi.fn(),
  signUpWithBetterAuthEmail: mocks.signUpWithBetterAuthEmail,
}));

vi.mock("~/config/shelf.config", () => ({
  config: {
    disableSignup: false,
    disableSSO: false,
    license: {
      isEnterprise: false,
      type: "core",
    },
  },
}));

vi.mock("~/utils/env", () => ({
  SERVER_URL: "http://localhost:3000",
}));

const {
  resetPasswordWithOtp,
  requestEmailChangeOtp,
  revokeOtherSessions,
  sendOTP,
  signUpWithBetterAuthEmailPass,
  verifyEmailChangeOtp,
} = await import("./service.server");

describe("auth service Better Auth flows", () => {
  beforeEach(() => {
    mocks.betterAuthFindUnique.mockClear();
    mocks.changeBetterAuthEmail.mockClear();
    mocks.requestBetterAuthEmailChange.mockClear();
    mocks.requestBetterAuthPasswordResetOtp.mockClear();
    mocks.resetBetterAuthPasswordWithOtp.mockClear();
    mocks.revokeBetterAuthOtherSessions.mockClear();
    mocks.sendBetterAuthSignInOtp.mockClear();
    mocks.signInWithBetterAuthEmailOtp.mockClear();
    mocks.signUpWithBetterAuthEmail.mockClear();
    mocks.betterAuthFindUnique.mockResolvedValue(null);
  });

  it("sends login OTPs through Better Auth", async () => {
    await sendOTP("user@example.com", "login");

    expect(mocks.sendBetterAuthSignInOtp).toHaveBeenCalledWith(
      "user@example.com"
    );
  });

  it("creates Better Auth password signups and returns the created user", async () => {
    mocks.signUpWithBetterAuthEmail.mockResolvedValueOnce({
      user: {
        id: "better-auth-user-id",
        email: "user@example.com",
      },
    });

    await expect(
      signUpWithBetterAuthEmailPass("user@example.com", "password-123")
    ).resolves.toEqual({
      id: "better-auth-user-id",
      email: "user@example.com",
    });

    expect(mocks.signUpWithBetterAuthEmail).toHaveBeenCalledWith({
      callbackURL:
        "http://localhost:3000/login?email=user%40example.com&email_verified=true",
      email: "user@example.com",
      name: "user",
      password: "password-123",
    });
  });

  it("requests email change OTPs through Better Auth", async () => {
    await expect(
      requestEmailChangeOtp(
        {
          provider: "better-auth",
          accessToken: "access-token",
          refreshToken: "refresh-token",
          userId: "auth-user-id",
          email: "old@example.com",
          expiresAt: 1,
          expiresIn: 1,
        },
        "new@example.com"
      )
    ).resolves.toEqual({
      provider: "better-auth",
    });

    expect(mocks.requestBetterAuthEmailChange).toHaveBeenCalledWith(
      "access-token",
      "new@example.com"
    );
  });

  it("verifies email change OTPs through Better Auth", async () => {
    await expect(
      verifyEmailChangeOtp(
        {
          provider: "better-auth",
          accessToken: "access-token",
          refreshToken: "refresh-token",
          userId: "auth-user-id",
          email: "old@example.com",
          expiresAt: 1,
          expiresIn: 1,
        },
        "new@example.com",
        "654321"
      )
    ).resolves.toBeUndefined();

    expect(mocks.changeBetterAuthEmail).toHaveBeenCalledWith(
      "access-token",
      "new@example.com",
      "654321"
    );
  });

  it("revokes other sessions through Better Auth", async () => {
    await expect(revokeOtherSessions("access-token")).resolves.toBeUndefined();

    expect(mocks.revokeBetterAuthOtherSessions).toHaveBeenCalledWith(
      "access-token"
    );
  });

  it("resets passwords with Better Auth OTP confirmation", async () => {
    await expect(
      resetPasswordWithOtp("user@example.com", "123456", "password-123")
    ).resolves.toBeUndefined();

    expect(mocks.resetBetterAuthPasswordWithOtp).toHaveBeenCalledWith(
      "user@example.com",
      "123456",
      "password-123"
    );
  });
});
