// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const betterAuthFindUnique = vi.fn();
  const findBetterAuthSsoProviderByDomain = vi.fn();
  const getBetterAuthErrorCode = vi.fn();
  const userFindUnique = vi.fn();
  const userFindFirst = vi.fn();
  const signInWithBetterAuthEmail = vi.fn();
  const signUpWithBetterAuthEmail = vi.fn();
  const getBetterAuthSession = vi.fn();
  const refreshBetterAuthAppSession = vi.fn();
  const requestBetterAuthEmailChange = vi.fn();
  const requestBetterAuthPasswordResetOtp = vi.fn();
  const resetBetterAuthPasswordWithOtp = vi.fn();
  const revokeBetterAuthOtherSessions = vi.fn();
  const sendBetterAuthSignInOtp = vi.fn();
  const signOutBetterAuthSession = vi.fn();
  const signInWithBetterAuthOAuthProvider = vi.fn();
  const signInWithPassword = vi.fn();
  const signInWithBetterAuthEmailOtp = vi.fn();
  const signInWithSSOProvider = vi.fn();
  const changeBetterAuthEmail = vi.fn();
  const getAuthUserByAccessToken = vi.fn();
  const isBetterAuthApiError = vi.fn();

  return {
    betterAuthFindUnique,
    changeBetterAuthEmail,
    findBetterAuthSsoProviderByDomain,
    getAuthUserByAccessToken,
    getBetterAuthErrorCode,
    getBetterAuthSession,
    isBetterAuthApiError,
    refreshBetterAuthAppSession,
    requestBetterAuthEmailChange,
    requestBetterAuthPasswordResetOtp,
    resetBetterAuthPasswordWithOtp,
    revokeBetterAuthOtherSessions,
    sendBetterAuthSignInOtp,
    signInWithBetterAuthEmail,
    signInWithBetterAuthEmailOtp,
    signInWithBetterAuthOAuthProvider,
    signUpWithBetterAuthEmail,
    signInWithPassword,
    signInWithSSOProvider,
    signOutBetterAuthSession,
    userFindFirst,
    userFindUnique,
  };
});

vi.mock("~/database/db.server", () => ({
  db: {
    betterAuthUser: {
      findUnique: mocks.betterAuthFindUnique,
    },
    user: {
      findFirst: mocks.userFindFirst,
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("~/emails/mail.server", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("./better-auth.server", () => ({
  findBetterAuthSsoProviderByDomain: mocks.findBetterAuthSsoProviderByDomain,
  isBetterAuthConfigured: vi.fn(() => true),
}));

vi.mock("./better-auth-session.server", () => ({
  changeBetterAuthEmail: mocks.changeBetterAuthEmail,
  getBetterAuthErrorCode: mocks.getBetterAuthErrorCode,
  getBetterAuthSession: mocks.getBetterAuthSession,
  isBetterAuthApiError: mocks.isBetterAuthApiError,
  refreshBetterAuthAppSession: mocks.refreshBetterAuthAppSession,
  requestBetterAuthEmailChange: mocks.requestBetterAuthEmailChange,
  requestBetterAuthPasswordResetOtp: mocks.requestBetterAuthPasswordResetOtp,
  resetBetterAuthPasswordWithOtp: mocks.resetBetterAuthPasswordWithOtp,
  revokeBetterAuthOtherSessions: mocks.revokeBetterAuthOtherSessions,
  sendBetterAuthSignInOtp: mocks.sendBetterAuthSignInOtp,
  signInWithBetterAuthEmail: mocks.signInWithBetterAuthEmail,
  signInWithBetterAuthEmailOtp: mocks.signInWithBetterAuthEmailOtp,
  signInWithBetterAuthOAuthProvider: mocks.signInWithBetterAuthOAuthProvider,
  signUpWithBetterAuthEmail: mocks.signUpWithBetterAuthEmail,
  signOutBetterAuthSession: mocks.signOutBetterAuthSession,
}));

vi.mock("./auth-provider.server", () => ({
  getAuthUserByAccessToken: mocks.getAuthUserByAccessToken,
  signInWithPassword: mocks.signInWithPassword,
  signInWithSSO: mocks.signInWithSSOProvider,
}));

vi.mock("~/config/shelf.config", () => ({
  config: {
    disableSignup: false,
    disableSSO: false,
    license: {
      isEnterprise: true,
      type: "enterprise",
    },
  },
}));

vi.mock("~/utils/license", () => ({
  assertEnterpriseFeature: vi.fn(),
}));

vi.mock("~/utils/env", () => ({
  SERVER_URL: "http://localhost:3000",
}));

const {
  getAuthResponseByAccessToken,
  refreshAccessToken,
  requestEmailChangeOtp,
  resetPasswordWithOtp,
  revokeOtherSessions,
  sendOTP,
  sendResetPasswordLink,
  signInWithEmail,
  signInWithSSO,
  signUpWithBetterAuthEmailPass,
  signOutCurrentAuthSession,
  validateSession,
  verifyEmailChangeOtp,
  verifyOtpAndSignin,
  verifyAuthSession,
} = await import("./service.server");

describe("auth provider routing", () => {
  beforeEach(() => {
    mocks.betterAuthFindUnique.mockReset();
    mocks.changeBetterAuthEmail.mockReset();
    mocks.findBetterAuthSsoProviderByDomain.mockReset();
    mocks.getAuthUserByAccessToken.mockReset();
    mocks.getBetterAuthErrorCode.mockReset();
    mocks.userFindFirst.mockReset();
    mocks.userFindUnique.mockReset();
    mocks.signInWithBetterAuthEmail.mockReset();
    mocks.signUpWithBetterAuthEmail.mockReset();
    mocks.getBetterAuthSession.mockReset();
    mocks.refreshBetterAuthAppSession.mockReset();
    mocks.requestBetterAuthEmailChange.mockReset();
    mocks.requestBetterAuthPasswordResetOtp.mockReset();
    mocks.resetBetterAuthPasswordWithOtp.mockReset();
    mocks.revokeBetterAuthOtherSessions.mockReset();
    mocks.sendBetterAuthSignInOtp.mockReset();
    mocks.signOutBetterAuthSession.mockReset();
    mocks.signInWithBetterAuthOAuthProvider.mockReset();
    mocks.signInWithPassword.mockReset();
    mocks.signInWithBetterAuthEmailOtp.mockReset();
    mocks.signInWithSSOProvider.mockReset();
    mocks.isBetterAuthApiError.mockReset();

    mocks.findBetterAuthSsoProviderByDomain.mockReturnValue(null);
    mocks.userFindFirst.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.getAuthUserByAccessToken.mockResolvedValue({
      data: {
        user: null,
      },
      error: null,
    });
    mocks.isBetterAuthApiError.mockReturnValue(false);
  });

  it("uses Better Auth login when the email is already migrated", async () => {
    mocks.betterAuthFindUnique.mockResolvedValue({ id: "better-user-1" });
    mocks.signInWithBetterAuthEmail.mockResolvedValue({
      provider: "better-auth",
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "better-user-1",
      email: "owner@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });

    await expect(
      signInWithEmail("owner@example.com", "secret-123")
    ).resolves.toMatchObject({
      provider: "better-auth",
      userId: "better-user-1",
    });

    expect(mocks.signInWithBetterAuthEmail).toHaveBeenCalledWith(
      "owner@example.com",
      "secret-123",
      "http://localhost:3000/login?email=owner%40example.com&email_verified=true"
    );
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("keeps Supabase password login for legacy emails", async () => {
    mocks.betterAuthFindUnique.mockResolvedValue(null);
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: "legacy-access",
          refresh_token: "legacy-refresh",
          expires_in: 3600,
          expires_at: 1_718_968_000,
          user: {
            id: "legacy-user-1",
            email: "legacy@example.com",
          },
        },
      },
      error: null,
    });

    await expect(
      signInWithEmail("legacy@example.com", "password-123")
    ).resolves.toMatchObject({
      provider: "supabase",
      userId: "legacy-user-1",
    });

    expect(mocks.signInWithPassword).toHaveBeenCalledWith(
      "legacy@example.com",
      "password-123"
    );
  });

  it("validates, refreshes and revokes Better Auth sessions through the bridge", async () => {
    mocks.getBetterAuthSession.mockResolvedValue({
      session: {
        token: "better-token",
        userId: "better-user-2",
        expiresAt: "2026-06-21T12:00:00.000Z",
      },
      user: {
        id: "better-user-2",
        email: "member@example.com",
      },
    });
    mocks.refreshBetterAuthAppSession.mockResolvedValue({
      provider: "better-auth",
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "better-user-2",
      email: "member@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });
    mocks.signOutBetterAuthSession.mockResolvedValue({ success: true });

    const authSession = {
      provider: "better-auth" as const,
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "better-user-2",
      email: "member@example.com",
      expiresAt: 1,
      expiresIn: 1,
    };

    await expect(validateSession(authSession)).resolves.toBe(true);
    await expect(refreshAccessToken(authSession)).resolves.toMatchObject({
      provider: "better-auth",
      userId: "better-user-2",
    });
    await expect(verifyAuthSession(authSession)).resolves.toBe(true);
    await expect(
      signOutCurrentAuthSession(authSession)
    ).resolves.toBeUndefined();

    expect(mocks.getBetterAuthSession).toHaveBeenCalledWith("better-token");
    expect(mocks.refreshBetterAuthAppSession).toHaveBeenCalledWith(
      "better-token"
    );
    expect(mocks.signOutBetterAuthSession).toHaveBeenCalledWith("better-token");
  });

  it("reads Better Auth bearer tokens through the shared access-token facade", async () => {
    mocks.getBetterAuthSession.mockResolvedValue({
      session: {
        token: "better-mobile-token",
        userId: "better-user-3",
        expiresAt: "2026-06-21T12:00:00.000Z",
      },
      user: {
        id: "better-user-3",
        email: "mobile@example.com",
      },
    });

    await expect(
      getAuthResponseByAccessToken("better-mobile-token")
    ).resolves.toMatchObject({
      data: {
        user: {
          id: "better-user-3",
          email: "mobile@example.com",
        },
      },
      error: null,
    });

    expect(mocks.getBetterAuthSession).toHaveBeenCalledWith(
      "better-mobile-token"
    );
  });

  it("falls back to the legacy auth provider when Better Auth rejects a legacy bearer token", async () => {
    mocks.getBetterAuthSession.mockRejectedValue({
      message: "invalid session",
      status: 401,
    });
    mocks.isBetterAuthApiError.mockReturnValue(true);
    mocks.getAuthUserByAccessToken.mockResolvedValue({
      data: {
        user: {
          id: "legacy-user-3",
          email: "legacy-mobile@example.com",
        },
      },
      error: null,
    });

    await expect(
      getAuthResponseByAccessToken("legacy-mobile-token")
    ).resolves.toMatchObject({
      data: {
        user: {
          id: "legacy-user-3",
          email: "legacy-mobile@example.com",
        },
      },
      error: null,
    });

    expect(mocks.getAuthUserByAccessToken).toHaveBeenCalledWith(
      "legacy-mobile-token"
    );
  });

  it("builds Better Auth signup callback URLs for the login verification page", async () => {
    mocks.signUpWithBetterAuthEmail.mockResolvedValue({
      user: {
        id: "better-user-4",
        email: "signup@example.com",
      },
    });

    await expect(
      signUpWithBetterAuthEmailPass(
        "signup@example.com",
        "password-123",
        "/assets"
      )
    ).resolves.toMatchObject({
      id: "better-user-4",
    });

    expect(mocks.signUpWithBetterAuthEmail).toHaveBeenCalledWith({
      callbackURL:
        "http://localhost:3000/login?email=signup%40example.com&email_verified=true&redirectTo=%2Fassets",
      email: "signup@example.com",
      name: "signup",
      password: "password-123",
    });
  });

  it("surfaces Better Auth email verification as a non-captured login state", async () => {
    mocks.betterAuthFindUnique.mockResolvedValue({ id: "better-user-5" });
    mocks.getBetterAuthErrorCode.mockReturnValue("EMAIL_NOT_VERIFIED");
    mocks.signInWithBetterAuthEmail.mockRejectedValue(new Error("forbidden"));

    await expect(
      signInWithEmail("verify@example.com", "password-123", "/assets")
    ).rejects.toMatchObject({
      additionalData: {
        authState: "email-not-verified",
        email: "verify@example.com",
        redirectTo: "/assets",
      },
      shouldBeCaptured: false,
      status: 403,
    });

    expect(mocks.signInWithBetterAuthEmail).toHaveBeenCalledWith(
      "verify@example.com",
      "password-123",
      "http://localhost:3000/login?email=verify%40example.com&email_verified=true&redirectTo=%2Fassets"
    );
  });

  it("prefers Better Auth SSO when the domain is configured for a Better Auth provider", async () => {
    mocks.findBetterAuthSsoProviderByDomain.mockReturnValue({
      domain: "example.com",
      providerId: "example-entra",
    });
    mocks.signInWithBetterAuthOAuthProvider.mockResolvedValue({
      url: "https://idp.example.com/oauth/authorize",
    });

    await expect(signInWithSSO("example.com", "/assets")).resolves.toBe(
      "https://idp.example.com/oauth/authorize"
    );

    expect(mocks.signInWithBetterAuthOAuthProvider).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3000/oauth/callback?redirectTo=%2Fassets",
      providerId: "example-entra",
    });
    expect(mocks.signInWithSSOProvider).not.toHaveBeenCalled();
  });

  it("falls back to the legacy SSO provider when no Better Auth SSO provider is configured", async () => {
    mocks.signInWithSSOProvider.mockResolvedValue({
      data: {
        url: "https://legacy.example.com/saml",
      },
      error: null,
    });

    await expect(signInWithSSO("legacy.com", "/bookings")).resolves.toBe(
      "https://legacy.example.com/saml"
    );

    expect(mocks.signInWithSSOProvider).toHaveBeenCalledWith(
      "legacy.com",
      "http://localhost:3000/oauth/callback?redirectTo=%2Fbookings"
    );
  });

  it("uses Better Auth OTP delivery when the email is already migrated", async () => {
    mocks.betterAuthFindUnique.mockResolvedValue({ id: "better-user-6" });
    mocks.sendBetterAuthSignInOtp.mockResolvedValue({ success: true });

    await expect(
      sendOTP("otp-owner@example.com", "login")
    ).resolves.toBeUndefined();

    expect(mocks.sendBetterAuthSignInOtp).toHaveBeenCalledWith(
      "otp-owner@example.com"
    );
  });

  it("uses Better Auth OTP sign-in when the email is already migrated", async () => {
    mocks.betterAuthFindUnique.mockResolvedValue({ id: "better-user-7" });
    mocks.signInWithBetterAuthEmailOtp.mockResolvedValue({
      provider: "better-auth",
      accessToken: "otp-token",
      refreshToken: "otp-token",
      userId: "better-user-7",
      email: "otp-owner@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });

    await expect(
      verifyOtpAndSignin("otp-owner@example.com", "123456")
    ).resolves.toMatchObject({
      provider: "better-auth",
      userId: "better-user-7",
    });

    expect(mocks.signInWithBetterAuthEmailOtp).toHaveBeenCalledWith(
      "otp-owner@example.com",
      "123456"
    );
  });

  it("uses Better Auth password reset OTP delivery when the email is already migrated", async () => {
    mocks.betterAuthFindUnique.mockResolvedValue({ id: "better-user-8" });
    mocks.requestBetterAuthPasswordResetOtp.mockResolvedValue({
      success: true,
    });

    await expect(
      sendResetPasswordLink("reset@example.com")
    ).resolves.toBeUndefined();

    expect(mocks.requestBetterAuthPasswordResetOtp).toHaveBeenCalledWith(
      "reset@example.com"
    );
  });

  it("uses Better Auth password reset confirmation when the email is already migrated", async () => {
    mocks.betterAuthFindUnique.mockResolvedValue({ id: "better-user-9" });
    mocks.resetBetterAuthPasswordWithOtp.mockResolvedValue({ success: true });

    await expect(
      resetPasswordWithOtp("reset@example.com", "123456", "password-123")
    ).resolves.toBeUndefined();

    expect(mocks.resetBetterAuthPasswordWithOtp).toHaveBeenCalledWith(
      "reset@example.com",
      "123456",
      "password-123"
    );
  });

  it("uses Better Auth email change OTP delivery and confirmation for Better Auth sessions", async () => {
    mocks.requestBetterAuthEmailChange.mockResolvedValue({ success: true });
    mocks.changeBetterAuthEmail.mockResolvedValue({ success: true });
    mocks.revokeBetterAuthOtherSessions.mockResolvedValue({ status: true });

    const authSession = {
      provider: "better-auth" as const,
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "better-user-10",
      email: "owner@example.com",
      expiresAt: 1,
      expiresIn: 1,
    };

    await expect(
      requestEmailChangeOtp(authSession, "new@example.com")
    ).resolves.toMatchObject({
      provider: "better-auth",
    });
    await expect(
      verifyEmailChangeOtp(authSession, "new@example.com", "123456")
    ).resolves.toBeUndefined();
    await expect(revokeOtherSessions(authSession)).resolves.toBeUndefined();

    expect(mocks.requestBetterAuthEmailChange).toHaveBeenCalledWith(
      "better-token",
      "new@example.com"
    );
    expect(mocks.changeBetterAuthEmail).toHaveBeenCalledWith(
      "better-token",
      "new@example.com",
      "123456"
    );
    expect(mocks.revokeBetterAuthOtherSessions).toHaveBeenCalledWith(
      "better-token"
    );
  });
});
