// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertSSOEnabled: vi.fn(),
  betterAuthUserFindUnique: vi.fn(),
  getBetterAuthSessionFromHeaders: vi.fn(),
  getUserOrganizations: vi.fn(),
  mapBetterAuthSession: vi.fn(),
  resolveUserAndOrgForSsoCallback: vi.fn(),
  setSelectedOrganizationIdCookie: vi.fn(),
  supabaseOnAuthStateChange: vi.fn(() => ({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  })),
}));

vi.mock("~/config/shelf.config", () => ({
  config: {
    disableSSO: false,
    license: {
      isEnterprise: true,
      type: "enterprise",
    },
  },
}));

vi.mock("~/database/db.server", () => ({
  db: {
    betterAuthUser: {
      findUnique: mocks.betterAuthUserFindUnique,
    },
  },
}));

vi.mock("~/integrations/supabase/client", () => ({
  supabaseClient: {
    auth: {
      onAuthStateChange: mocks.supabaseOnAuthStateChange,
    },
  },
}));

vi.mock("~/modules/auth/better-auth-session.server", () => ({
  getBetterAuthSessionFromHeaders: mocks.getBetterAuthSessionFromHeaders,
  mapBetterAuthSession: mocks.mapBetterAuthSession,
}));

vi.mock("~/modules/organization/context.server", () => ({
  setSelectedOrganizationIdCookie: mocks.setSelectedOrganizationIdCookie,
}));

vi.mock("~/modules/organization/service.server", () => ({
  getUserOrganizations: mocks.getUserOrganizations,
}));

vi.mock("~/utils/cookies.server", () => ({
  setCookie: vi.fn((value: string) => ["set-cookie", value]),
}));

vi.mock("~/utils/sso.server", () => ({
  assertSSOEnabled: mocks.assertSSOEnabled,
  resolveUserAndOrgForSsoCallback: mocks.resolveUserAndOrgForSsoCallback,
}));

const { loader } = await import("./oauth.callback");

describe("oauth callback loader", () => {
  beforeEach(() => {
    mocks.assertSSOEnabled.mockReset();
    mocks.betterAuthUserFindUnique.mockReset();
    mocks.getBetterAuthSessionFromHeaders.mockReset();
    mocks.getUserOrganizations.mockReset();
    mocks.mapBetterAuthSession.mockReset();
    mocks.resolveUserAndOrgForSsoCallback.mockReset();
    mocks.setSelectedOrganizationIdCookie.mockReset();
    mocks.supabaseOnAuthStateChange.mockClear();

    mocks.getUserOrganizations.mockResolvedValue([]);
  });

  it("completes Better Auth SSO on the server and redirects to the requested destination", async () => {
    const setSession = vi.fn();

    mocks.getBetterAuthSessionFromHeaders.mockResolvedValue({
      session: {
        token: "better-token",
        userId: "better-user-1",
        expiresAt: "2026-06-21T12:00:00.000Z",
      },
      user: {
        id: "better-user-1",
        email: "owner@example.com",
      },
    });
    mocks.mapBetterAuthSession.mockReturnValue({
      provider: "better-auth",
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "better-user-1",
      email: "owner@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });
    mocks.betterAuthUserFindUnique.mockResolvedValue({
      name: "Owner Example",
      userMetadata: {
        custom_claims: {
          firstname: "Owner",
          lastname: "Example",
          groups: ["group-1"],
        },
      },
    });
    mocks.resolveUserAndOrgForSsoCallback.mockResolvedValue({
      org: {
        id: "org-1",
      },
    });
    mocks.setSelectedOrganizationIdCookie.mockResolvedValue(
      "organization=org-1"
    );

    const response = await loader({
      request: new Request(
        "http://localhost/oauth/callback?redirectTo=%2Fassets"
      ),
      context: {
        isAuthenticated: false,
        setSession,
      },
    } as never);

    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(setSession).toHaveBeenCalledWith({
      provider: "better-auth",
      accessToken: "better-token",
      refreshToken: "better-token",
      userId: "better-user-1",
      email: "owner@example.com",
      expiresAt: 1,
      expiresIn: 1,
    });
    expect(mocks.resolveUserAndOrgForSsoCallback).toHaveBeenCalledWith({
      authSession: {
        provider: "better-auth",
        accessToken: "better-token",
        refreshToken: "better-token",
        userId: "better-user-1",
        email: "owner@example.com",
        expiresAt: 1,
        expiresIn: 1,
      },
      contactInfo: {
        city: undefined,
        countryRegion: undefined,
        phone: undefined,
        stateProvince: undefined,
        street: undefined,
        zipPostalCode: undefined,
      },
      firstName: "Owner",
      groups: ["group-1"],
      lastName: "Example",
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/assets");
  });
});
