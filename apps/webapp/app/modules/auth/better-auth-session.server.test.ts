// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const signInEmail = vi.fn();
  const signInEmailOTP = vi.fn();
  const signUpEmail = vi.fn();
  const requestEmailChangeEmailOTP = vi.fn();
  const requestPasswordResetEmailOTP = vi.fn();
  const sendVerificationOTP = vi.fn();
  const resetPasswordEmailOTP = vi.fn();
  const changeEmailEmailOTP = vi.fn();
  const getSession = vi.fn();
  const revokeOtherSessions = vi.fn();
  const signInWithOAuth2 = vi.fn();
  const signOut = vi.fn();

  return {
    changeEmailEmailOTP,
    getSession,
    requestEmailChangeEmailOTP,
    requestPasswordResetEmailOTP,
    resetPasswordEmailOTP,
    revokeOtherSessions,
    sendVerificationOTP,
    signInEmail,
    signInEmailOTP,
    signInWithOAuth2,
    signUpEmail,
    signOut,
  };
});

vi.mock("./better-auth.server", () => ({
  getBetterAuth: () => ({
    api: {
      changeEmailEmailOTP: mocks.changeEmailEmailOTP,
      getSession: mocks.getSession,
      requestEmailChangeEmailOTP: mocks.requestEmailChangeEmailOTP,
      requestPasswordResetEmailOTP: mocks.requestPasswordResetEmailOTP,
      resetPasswordEmailOTP: mocks.resetPasswordEmailOTP,
      revokeOtherSessions: mocks.revokeOtherSessions,
      sendVerificationOTP: mocks.sendVerificationOTP,
      signInEmail: mocks.signInEmail,
      signInEmailOTP: mocks.signInEmailOTP,
      signInWithOAuth2: mocks.signInWithOAuth2,
      signUpEmail: mocks.signUpEmail,
      signOut: mocks.signOut,
    },
  }),
}));

const {
  changeBetterAuthEmail,
  getBetterAuthSessionFromHeaders,
  getBetterAuthSession,
  requestBetterAuthEmailChange,
  requestBetterAuthPasswordResetOtp,
  resetBetterAuthPasswordWithOtp,
  refreshBetterAuthAppSession,
  revokeBetterAuthOtherSessions,
  sendBetterAuthSignInOtp,
  signInWithBetterAuthEmail,
  signInWithBetterAuthEmailOtp,
  signInWithBetterAuthOAuthProvider,
  signUpWithBetterAuthEmail,
  signOutBetterAuthSession,
} = await import("./better-auth-session.server");

describe("better auth session bridge", () => {
  beforeEach(() => {
    mocks.changeEmailEmailOTP.mockReset();
    mocks.signInEmail.mockReset();
    mocks.signInEmailOTP.mockReset();
    mocks.signUpEmail.mockReset();
    mocks.requestEmailChangeEmailOTP.mockReset();
    mocks.requestPasswordResetEmailOTP.mockReset();
    mocks.resetPasswordEmailOTP.mockReset();
    mocks.sendVerificationOTP.mockReset();
    mocks.getSession.mockReset();
    mocks.revokeOtherSessions.mockReset();
    mocks.signInWithOAuth2.mockReset();
    mocks.signOut.mockReset();
  });

  it("maps a Better Auth email sign-in into the app session format", async () => {
    mocks.signInEmail.mockResolvedValue({
      token: "better-auth-token",
      redirect: false,
      user: {
        id: "better-user-1",
        email: "owner@example.com",
      },
    });
    mocks.getSession.mockResolvedValue({
      session: {
        token: "better-auth-token",
        userId: "better-user-1",
        expiresAt: "2026-06-21T12:00:00.000Z",
      },
      user: {
        id: "better-user-1",
        email: "owner@example.com",
      },
    });

    await expect(
      signInWithBetterAuthEmail("owner@example.com", "secret-123")
    ).resolves.toMatchObject({
      provider: "better-auth",
      accessToken: "better-auth-token",
      refreshToken: "better-auth-token",
      userId: "better-user-1",
      email: "owner@example.com",
    });
  });

  it("uses bearer authorization for session reads and revocations", async () => {
    mocks.getSession.mockResolvedValue(null);
    mocks.revokeOtherSessions.mockResolvedValue({ status: true });
    mocks.signOut.mockResolvedValue({ success: true });

    await getBetterAuthSession("bridge-token");
    await revokeBetterAuthOtherSessions("bridge-token");
    await signOutBetterAuthSession("bridge-token");

    expect(mocks.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      query: { disableCookieCache: true },
    });
    expect(
      mocks.getSession.mock.calls[0]?.[0]?.headers.get("authorization")
    ).toBe("Bearer bridge-token");
    expect(
      mocks.revokeOtherSessions.mock.calls[0]?.[0]?.headers.get("authorization")
    ).toBe("Bearer bridge-token");
    expect(mocks.signOut.mock.calls[0]?.[0]?.headers.get("authorization")).toBe(
      "Bearer bridge-token"
    );
  });

  it("reads Better Auth sessions from request headers when the cookie session already exists", async () => {
    mocks.getSession.mockResolvedValue(null);

    await getBetterAuthSessionFromHeaders({
      cookie: "better-auth.session_token=cookie-token",
    });

    expect(mocks.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      query: { disableCookieCache: true },
    });
    expect(mocks.getSession.mock.calls[0]?.[0]?.headers.get("cookie")).toBe(
      "better-auth.session_token=cookie-token"
    );
  });

  it("refreshes the app session from the Better Auth session endpoint", async () => {
    mocks.getSession.mockResolvedValue({
      session: {
        token: "refreshed-token",
        userId: "better-user-2",
        expiresAt: "2026-06-21T12:30:00.000Z",
      },
      user: {
        id: "better-user-2",
        email: "member@example.com",
      },
    });

    await expect(
      refreshBetterAuthAppSession("refreshed-token")
    ).resolves.toMatchObject({
      provider: "better-auth",
      accessToken: "refreshed-token",
      refreshToken: "refreshed-token",
      userId: "better-user-2",
      email: "member@example.com",
    });
  });

  it("forwards Better Auth password signup payloads including callback URL", async () => {
    mocks.signUpEmail.mockResolvedValue({
      token: null,
      user: {
        id: "better-user-3",
        email: "signup@example.com",
      },
    });

    await expect(
      signUpWithBetterAuthEmail({
        callbackURL: "http://localhost:3000/login?email_verified=true",
        email: "signup@example.com",
        name: "signup",
        password: "secret-123",
      })
    ).resolves.toMatchObject({
      user: {
        id: "better-user-3",
      },
    });

    expect(mocks.signUpEmail).toHaveBeenCalledWith({
      body: {
        callbackURL: "http://localhost:3000/login?email_verified=true",
        email: "signup@example.com",
        name: "signup",
        password: "secret-123",
      },
    });
  });

  it("requests login OTP delivery through Better Auth", async () => {
    mocks.sendVerificationOTP.mockResolvedValue({
      success: true,
    });

    await expect(
      sendBetterAuthSignInOtp("owner@example.com")
    ).resolves.toMatchObject({
      success: true,
    });

    expect(mocks.sendVerificationOTP).toHaveBeenCalledWith({
      body: {
        email: "owner@example.com",
        type: "sign-in",
      },
    });
  });

  it("maps Better Auth email OTP sign-in into the app session format", async () => {
    mocks.signInEmailOTP.mockResolvedValue({
      token: "better-auth-otp-token",
      user: {
        id: "better-user-4",
        email: "otp@example.com",
      },
    });
    mocks.getSession.mockResolvedValue({
      session: {
        token: "better-auth-otp-token",
        userId: "better-user-4",
        expiresAt: "2026-06-21T13:00:00.000Z",
      },
      user: {
        id: "better-user-4",
        email: "otp@example.com",
      },
    });

    await expect(
      signInWithBetterAuthEmailOtp("otp@example.com", "123456")
    ).resolves.toMatchObject({
      provider: "better-auth",
      accessToken: "better-auth-otp-token",
      userId: "better-user-4",
      email: "otp@example.com",
    });

    expect(mocks.signInEmailOTP).toHaveBeenCalledWith({
      body: {
        email: "otp@example.com",
        otp: "123456",
      },
    });
  });

  it("starts generic OAuth sign-in for Better Auth SSO providers", async () => {
    mocks.signInWithOAuth2.mockResolvedValue({
      redirect: true,
      url: "https://idp.example.com/oauth/authorize",
    });

    await expect(
      signInWithBetterAuthOAuthProvider({
        callbackURL:
          "http://localhost:3000/oauth/callback?redirectTo=%2Fassets",
        errorCallbackURL: "http://localhost:3000/login?sso_error=true",
        providerId: "example-entra",
      })
    ).resolves.toMatchObject({
      url: "https://idp.example.com/oauth/authorize",
    });

    expect(mocks.signInWithOAuth2).toHaveBeenCalledWith({
      body: {
        callbackURL:
          "http://localhost:3000/oauth/callback?redirectTo=%2Fassets",
        errorCallbackURL: "http://localhost:3000/login?sso_error=true",
        providerId: "example-entra",
      },
    });
  });

  it("requests Better Auth password reset OTP delivery", async () => {
    mocks.requestPasswordResetEmailOTP.mockResolvedValue({
      success: true,
    });

    await expect(
      requestBetterAuthPasswordResetOtp("reset@example.com")
    ).resolves.toMatchObject({
      success: true,
    });

    expect(mocks.requestPasswordResetEmailOTP).toHaveBeenCalledWith({
      body: {
        email: "reset@example.com",
      },
    });
  });

  it("resets a Better Auth password with email OTP", async () => {
    mocks.resetPasswordEmailOTP.mockResolvedValue({
      success: true,
    });

    await expect(
      resetBetterAuthPasswordWithOtp(
        "reset@example.com",
        "123456",
        "password-123"
      )
    ).resolves.toMatchObject({
      success: true,
    });

    expect(mocks.resetPasswordEmailOTP).toHaveBeenCalledWith({
      body: {
        email: "reset@example.com",
        otp: "123456",
        password: "password-123",
      },
    });
  });

  it("requests Better Auth email change OTP delivery with bearer auth", async () => {
    mocks.requestEmailChangeEmailOTP.mockResolvedValue({
      success: true,
    });

    await expect(
      requestBetterAuthEmailChange("bridge-token", "new@example.com")
    ).resolves.toMatchObject({
      success: true,
    });

    expect(mocks.requestEmailChangeEmailOTP).toHaveBeenCalledWith({
      body: {
        newEmail: "new@example.com",
      },
      headers: expect.any(Headers),
    });
    expect(
      mocks.requestEmailChangeEmailOTP.mock.calls[0]?.[0]?.headers.get(
        "authorization"
      )
    ).toBe("Bearer bridge-token");
  });

  it("confirms a Better Auth email change with bearer auth", async () => {
    mocks.changeEmailEmailOTP.mockResolvedValue({
      success: true,
    });

    await expect(
      changeBetterAuthEmail("bridge-token", "new@example.com", "123456")
    ).resolves.toMatchObject({
      success: true,
    });

    expect(mocks.changeEmailEmailOTP).toHaveBeenCalledWith({
      body: {
        newEmail: "new@example.com",
        otp: "123456",
      },
      headers: expect.any(Headers),
    });
    expect(
      mocks.changeEmailEmailOTP.mock.calls[0]?.[0]?.headers.get("authorization")
    ).toBe("Bearer bridge-token");
  });
});
