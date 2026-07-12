// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  getConfiguredSSODomains: vi.fn().mockResolvedValue([]),
  getUserByID: vi.fn().mockResolvedValue({
    id: "user-1",
    firstName: "Ada",
    lastName: "Lovelace",
    displayName: null,
    email: "owner@example.com",
  }),
  refreshAccessToken: vi.fn().mockResolvedValue({
    provider: "better-auth",
    accessToken: "new-token",
    refreshToken: "new-token",
    userId: "user-1",
    email: "new@example.com",
    expiresAt: 1,
    expiresIn: 1,
  }),
  requestEmailChangeOtp: vi.fn().mockResolvedValue({
    provider: "better-auth",
  }),
  requirePermission: vi.fn().mockResolvedValue(undefined),
  revokeOtherSessions: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn(),
  sendNotification: vi.fn(),
  setSession: vi.fn(),
  updateUserEmail: vi.fn().mockResolvedValue(undefined),
  verifyEmailChangeOtp: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/components/shared/card", () => ({
  Card: ({ children }: { children: unknown }) => children,
}));

vi.mock("~/components/user/change-email", () => ({
  createChangeEmailSchema: vi.fn(() =>
    z.object({
      email: z.string().email(),
    })
  ),
}));

vi.mock("~/components/user/details-form", () => ({
  UserDetailsForm: () => null,
  UserDetailsFormSchema: z.object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
}));

vi.mock("~/components/user/display-name-form", () => ({
  DisplayNameForm: () => null,
  DisplayNameFormSchema: z.object({
    displayName: z.string().optional(),
  }),
}));

vi.mock("~/components/user/password-reset-form", () => ({
  default: () => null,
}));

vi.mock("~/components/user/request-delete-user", () => ({
  RequestDeleteUser: () => null,
}));

vi.mock("~/components/user/user-contact-form", () => ({
  UserContactDetailsForm: () => null,
  UserContactDetailsFormSchema: z.object({
    phone: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    stateProvince: z.string().optional(),
    zipPostalCode: z.string().optional(),
    countryRegion: z.string().optional(),
  }),
}));

vi.mock("~/emails/change-user-email-address", () => ({
  changeEmailAddressHtmlEmail: vi.fn().mockResolvedValue("<p>otp</p>"),
  changeEmailAddressTextEmail: vi.fn().mockReturnValue("otp"),
}));

vi.mock("~/emails/mail.server", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("~/modules/auth/service.server", () => ({
  refreshAccessToken: mocks.refreshAccessToken,
  requestEmailChangeOtp: mocks.requestEmailChangeOtp,
  revokeOtherSessions: mocks.revokeOtherSessions,
  verifyEmailChangeOtp: mocks.verifyEmailChangeOtp,
}));

vi.mock("~/modules/user/service.server", () => ({
  getUserByID: mocks.getUserByID,
  getUserWithContact: vi.fn(),
  updateProfilePicture: vi.fn(),
  updateUser: vi.fn(),
  updateUserEmail: mocks.updateUserEmail,
}));

vi.mock("~/modules/user-contact/service.server", () => ({
  updateUserContact: vi.fn(),
}));

vi.mock("~/utils/append-to-meta-title", () => ({
  appendToMetaTitle: vi.fn((title: string) => title),
}));

vi.mock("~/utils/delay", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/utils/emitter/send-notification.server", () => ({
  sendNotification: mocks.sendNotification,
}));

vi.mock("~/utils/env", () => ({
  ADMIN_EMAIL: "admin@example.com",
  COLLECT_BUSINESS_INTEL: false,
  DISABLE_SIGNUP: false,
  DISABLE_SSO: false,
  ENABLE_PREMIUM_FEATURES: false,
  FREE_TRIAL_DAYS: "7",
  GEOCODING_USER_AGENT: "test-agent",
  LICENSE_TYPE: "community",
  NODE_ENV: "test",
  SEND_ONBOARDING_EMAIL: false,
  SERVER_URL: "http://localhost:3000",
  SHOW_HOW_DID_YOU_FIND_US: false,
  SUPPORT_EMAIL: "support@example.com",
}));

vi.mock("~/utils/roles.server", () => ({
  requirePermission: mocks.requirePermission,
}));

vi.mock("~/utils/sso.server", () => ({
  getConfiguredSSODomains: mocks.getConfiguredSSODomains,
}));

const { action } = await import("./account-details.general");

describe("account details email change action", () => {
  beforeEach(() => {
    mocks.getConfiguredSSODomains.mockClear();
    mocks.getUserByID.mockClear();
    mocks.refreshAccessToken.mockClear();
    mocks.requestEmailChangeOtp.mockClear();
    mocks.requirePermission.mockClear();
    mocks.revokeOtherSessions.mockClear();
    mocks.sendEmail.mockClear();
    mocks.sendNotification.mockClear();
    mocks.setSession.mockClear();
    mocks.updateUserEmail.mockClear();
    mocks.verifyEmailChangeOtp.mockClear();
    mocks.requestEmailChangeOtp.mockResolvedValue({
      provider: "better-auth",
    });
  });

  it("initiates email change through Better Auth without sending a legacy app email", async () => {
    const authSession = {
      provider: "better-auth" as const,
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "user-1",
      email: "owner@example.com",
      expiresAt: 1,
      expiresIn: 1,
    };

    const result = await action({
      request: new Request("http://localhost/account-details/general", {
        method: "POST",
        body: new URLSearchParams({
          intent: "initiateEmailChange",
          type: "initiateEmailChange",
          email: "new@example.com",
        }),
      }),
      context: {
        getSession: () => authSession,
      },
    } as never);

    expect(mocks.requestEmailChangeOtp).toHaveBeenCalledWith(
      authSession,
      "new@example.com"
    );
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      awaitingOtp: true,
      error: null,
      newEmail: "new@example.com",
      success: true,
    });
  });

  it("confirms email change through Better Auth and refreshes the app session", async () => {
    const authSession = {
      provider: "better-auth" as const,
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "user-1",
      email: "owner@example.com",
      expiresAt: 1,
      expiresIn: 1,
    };

    const result = await action({
      request: new Request("http://localhost/account-details/general", {
        method: "POST",
        body: new URLSearchParams({
          intent: "verifyEmailChange",
          type: "verifyEmailChange",
          email: "new@example.com",
          otp: "123456",
        }),
      }),
      context: {
        getSession: () => authSession,
        setSession: mocks.setSession,
      },
    } as never);

    expect(mocks.verifyEmailChangeOtp).toHaveBeenCalledWith(
      authSession,
      "new@example.com",
      "123456"
    );
    expect(mocks.updateUserEmail).not.toHaveBeenCalled();
    expect(mocks.refreshAccessToken).toHaveBeenCalledWith(authSession);
    expect(mocks.setSession).toHaveBeenCalledWith({
      provider: "better-auth",
      accessToken: "new-token",
      refreshToken: "new-token",
      userId: "user-1",
      email: "new@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });
    expect(mocks.revokeOtherSessions).toHaveBeenCalledWith({
      provider: "better-auth",
      accessToken: "new-token",
      refreshToken: "new-token",
      userId: "user-1",
      email: "new@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });
    expect(result).toMatchObject({
      awaitingOtp: false,
      emailChanged: true,
      error: null,
      success: true,
    });
  });
});
