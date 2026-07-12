// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShelfError } from "~/utils/error";

const mocks = vi.hoisted(() => ({
  getSelectedOrganization: vi.fn(),
  setSelectedOrganizationIdCookie: vi.fn(),
  signInWithEmail: vi.fn(),
}));

vi.mock("~/config/shelf.config", () => ({
  config: {
    disableSignup: false,
    disableSSO: false,
  },
}));

vi.mock("~/modules/auth/service.server", () => ({
  signInWithEmail: mocks.signInWithEmail,
}));

vi.mock("~/modules/organization/context.server", () => ({
  getSelectedOrganization: mocks.getSelectedOrganization,
  setSelectedOrganizationIdCookie: mocks.setSelectedOrganizationIdCookie,
}));

vi.mock("~/utils/cookies.server", () => ({
  setCookie: vi.fn(() => ["set-cookie", "organization=org-1"]),
}));

const { action } = await import("./login");

describe("login route action", () => {
  beforeEach(() => {
    mocks.signInWithEmail.mockReset();
    mocks.getSelectedOrganization.mockReset();
    mocks.setSelectedOrganizationIdCookie.mockReset();
  });

  it("redirects back to login with email_sent when Better Auth email is not verified", async () => {
    mocks.signInWithEmail.mockRejectedValue(
      new ShelfError({
        cause: null,
        message:
          "Consultez votre boîte de réception puis cliquez sur le lien de vérification avant de vous connecter.",
        additionalData: {
          authState: "email-not-verified",
          email: "owner@example.com",
          redirectTo: "/assets",
        },
        label: "Auth",
        shouldBeCaptured: false,
        status: 403,
      })
    );

    const request = new Request("http://localhost/login", {
      method: "POST",
      body: new URLSearchParams({
        email: "OWNER@example.com",
        password: "password-123",
        redirectTo: "/assets",
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const response = await action({
      request,
      context: {
        setSession: vi.fn(),
      },
    } as never);

    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(mocks.signInWithEmail).toHaveBeenCalledWith(
      "owner@example.com",
      "password-123",
      "/assets"
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/login?email=owner%40example.com&email_sent=true&redirectTo=%2Fassets"
    );
  });
});
