// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOutCurrentAuthSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/modules/auth/service.server", () => ({
  signOutCurrentAuthSession: mocks.signOutCurrentAuthSession,
}));

const { action, loader } = await import("./logout");

describe("logout route", () => {
  it("revokes the Better Auth session before destroying the app session", async () => {
    const destroySession = vi.fn();
    const session = {
      provider: "better-auth" as const,
      accessToken: "access-token",
      refreshToken: "access-token",
      userId: "user-1",
      email: "user@example.com",
      expiresAt: 1,
      expiresIn: 1,
    };

    const response = await action({
      request: new Request("http://localhost/logout", {
        method: "POST",
        body: new URLSearchParams({
          redirectTo: "/join",
        }),
      }),
      context: {
        destroySession,
        getSession: vi.fn(() => session),
        isAuthenticated: true,
      },
    } as never);

    expect(mocks.signOutCurrentAuthSession).toHaveBeenCalledWith(session);
    expect(destroySession).toHaveBeenCalled();
    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/join");
  });

  it("redirects GET requests away from the route", () => {
    const response = loader();

    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });
});
