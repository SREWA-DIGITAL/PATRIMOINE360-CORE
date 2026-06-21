// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
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
  const verifyEmailChangeOtpWithProvider = vi.fn().mockResolvedValue({
    data: {},
    error: null,
  });
  const signOutOtherSessions = vi.fn().mockResolvedValue({
    error: null,
  });

  return {
    createUser,
    generateOtpCode,
    sendEmail,
    verifyRecoveryOtp,
    generateEmailChangeOtpCode,
    verifyEmailChangeOtpWithProvider,
    signOutOtherSessions,
  };
});

vi.mock("~/database/db.server", () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("~/emails/mail.server", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("./auth-provider.server", () => ({
  createAuthUser: mocks.createUser,
  generateAuthOtpCode: mocks.generateOtpCode,
  generateRecoveryOtpCode: mocks.generateOtpCode,
  generateEmailChangeOtpCode: mocks.generateEmailChangeOtpCode,
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
  requestEmailChangeOtp,
  revokeOtherSessions,
  sendOTP,
  signUpWithEmailPass,
  verifyEmailChangeOtp,
  verifyRecoveryOtp,
} = await import("./service.server");

describe("auth email otp delivery", () => {
  beforeEach(() => {
    mocks.createUser.mockClear();
    mocks.generateOtpCode.mockClear();
    mocks.sendEmail.mockClear();
    mocks.verifyRecoveryOtp.mockClear();
    mocks.generateEmailChangeOtpCode.mockClear();
    mocks.verifyEmailChangeOtpWithProvider.mockClear();
    mocks.signOutOtherSessions.mockClear();
  });

  it("sends login OTPs with magiclink generation and app email delivery", async () => {
    await sendOTP("user@example.com", "login");

    expect(mocks.generateOtpCode).toHaveBeenCalledWith(
      "magiclink",
      "user@example.com"
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Your login code: 123456",
        tags: ["auth", "otp", "login"],
      })
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

  it("requests email change OTPs through the auth provider facade", async () => {
    await expect(
      requestEmailChangeOtp("old@example.com", "new@example.com")
    ).resolves.toBe("654321");

    expect(mocks.generateEmailChangeOtpCode).toHaveBeenCalledWith(
      "old@example.com",
      "new@example.com"
    );
  });

  it("verifies email change OTPs through the auth provider facade", async () => {
    await expect(
      verifyEmailChangeOtp("new@example.com", "654321")
    ).resolves.toBeUndefined();

    expect(mocks.verifyEmailChangeOtpWithProvider).toHaveBeenCalledWith(
      "new@example.com",
      "654321"
    );
  });

  it("revokes other sessions through the auth provider facade", async () => {
    await expect(revokeOtherSessions("access-token")).resolves.toBeUndefined();

    expect(mocks.signOutOtherSessions).toHaveBeenCalledWith("access-token");
  });
});
