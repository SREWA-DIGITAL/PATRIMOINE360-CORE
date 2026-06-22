// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const betterAuthFindUnique = vi.fn().mockResolvedValue(null);
  const createUser = vi.fn().mockResolvedValue({
    data: {
      user: {
        id: "auth-user-id",
        email: "user@example.com",
      },
    },
    error: null,
  });

  const generateOtpCode = vi.fn().mockResolvedValue({
    otp: "123456",
    error: null,
  });

  const sendEmail = vi.fn();
  const signUpWithBetterAuthEmail = vi.fn();
  const verifyRecoveryOtp = vi.fn().mockResolvedValue({
    data: {
      user: { id: "auth-user-id" },
      session: { access_token: "access-token" },
    },
    error: null,
  });
  const generateEmailChangeOtpCode = vi.fn().mockResolvedValue({
    otp: "654321",
    error: null,
  });
  const sendBetterAuthSignInOtp = vi.fn();
  const signInWithBetterAuthEmailOtp = vi.fn();
  const requestBetterAuthEmailChange = vi.fn();
  const requestBetterAuthPasswordResetOtp = vi.fn();
  const resetBetterAuthPasswordWithOtp = vi.fn();
  const revokeBetterAuthOtherSessions = vi.fn();
  const changeBetterAuthEmail = vi.fn();
  const verifyEmailChangeOtpWithProvider = vi.fn().mockResolvedValue({
    data: {},
    error: null,
  });
  const updateAuthUserById = vi.fn().mockResolvedValue({
    data: {},
    error: null,
  });
  const signOutOtherSessions = vi.fn().mockResolvedValue({
    error: null,
  });

  return {
    changeBetterAuthEmail,
    betterAuthFindUnique,
    createUser,
    generateOtpCode,
    requestBetterAuthEmailChange,
    requestBetterAuthPasswordResetOtp,
    resetBetterAuthPasswordWithOtp,
    revokeBetterAuthOtherSessions,
    sendBetterAuthSignInOtp,
    signUpWithBetterAuthEmail,
    sendEmail,
    signInWithBetterAuthEmailOtp,
    updateAuthUserById,
    verifyRecoveryOtp,
    generateEmailChangeOtpCode,
    verifyEmailChangeOtpWithProvider,
    signOutOtherSessions,
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

vi.mock("~/emails/mail.server", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("./better-auth.server", () => ({
  isBetterAuthConfigured: vi.fn(() => true),
}));

vi.mock("./better-auth-session.server", () => ({
  changeBetterAuthEmail: mocks.changeBetterAuthEmail,
  getBetterAuthErrorCode: vi.fn(),
  getBetterAuthSession: vi.fn(),
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

vi.mock("./auth-provider.server", () => ({
  createAuthUser: mocks.createUser,
  generateAuthOtpCode: mocks.generateOtpCode,
  generateRecoveryOtpCode: mocks.generateOtpCode,
  generateEmailChangeOtpCode: mocks.generateEmailChangeOtpCode,
  updateAuthUserById: mocks.updateAuthUserById,
  verifyEmailChangeOtpWithProvider: mocks.verifyEmailChangeOtpWithProvider,
  verifyRecoveryOtpWithProvider: mocks.verifyRecoveryOtp,
  signOutOtherSessions: mocks.signOutOtherSessions,
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
  resendVerificationEmail,
  resetPasswordWithOtp,
  requestEmailChangeOtp,
  revokeOtherSessions,
  sendOTP,
  signUpWithBetterAuthEmailPass,
  signUpWithEmailPass,
  verifyEmailChangeOtp,
  verifyRecoveryOtp,
} = await import("./service.server");

describe("auth email otp delivery", () => {
  beforeEach(() => {
    mocks.changeBetterAuthEmail.mockClear();
    mocks.betterAuthFindUnique.mockClear();
    mocks.createUser.mockClear();
    mocks.generateOtpCode.mockClear();
    mocks.requestBetterAuthEmailChange.mockClear();
    mocks.requestBetterAuthPasswordResetOtp.mockClear();
    mocks.resetBetterAuthPasswordWithOtp.mockClear();
    mocks.revokeBetterAuthOtherSessions.mockClear();
    mocks.sendBetterAuthSignInOtp.mockClear();
    mocks.signUpWithBetterAuthEmail.mockClear();
    mocks.sendEmail.mockClear();
    mocks.signInWithBetterAuthEmailOtp.mockClear();
    mocks.updateAuthUserById.mockClear();
    mocks.verifyRecoveryOtp.mockClear();
    mocks.generateEmailChangeOtpCode.mockClear();
    mocks.verifyEmailChangeOtpWithProvider.mockClear();
    mocks.signOutOtherSessions.mockClear();
    mocks.betterAuthFindUnique.mockResolvedValue(null);
  });

  it("sends login OTPs through Better Auth", async () => {
    await sendOTP("user@example.com", "login");

    expect(mocks.sendBetterAuthSignInOtp).toHaveBeenCalledWith(
      "user@example.com"
    );
  });

  it("sends signup verification emails through application delivery", async () => {
    await resendVerificationEmail("new-user@example.com");

    expect(mocks.generateOtpCode).toHaveBeenCalledWith(
      "signup",
      "new-user@example.com"
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new-user@example.com",
        subject: "Confirm your email address: 123456",
        tags: ["auth", "otp", "confirm-signup"],
      })
    );
  });

  it("creates password signups and sends the verification OTP with app email delivery", async () => {
    await signUpWithEmailPass("user@example.com", "password-123");

    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password-123",
      email_confirm: false,
      user_metadata: {
        signup_method: "email-password",
      },
    });
    expect(mocks.generateOtpCode).toHaveBeenCalledWith(
      "signup",
      "user@example.com"
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Confirm your email address: 123456",
        tags: ["auth", "otp", "confirm-signup"],
      })
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

  it("verifies recovery OTPs through the auth provider facade", async () => {
    await expect(
      verifyRecoveryOtp("user@example.com", "123456")
    ).resolves.toEqual({
      userId: "auth-user-id",
      accessToken: "access-token",
    });

    expect(mocks.verifyRecoveryOtp).toHaveBeenCalledWith(
      "user@example.com",
      "123456"
    );
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
