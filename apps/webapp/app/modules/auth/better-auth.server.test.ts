import {
  betterAuthBasePath,
  getBetterAuthBasePathWildcard,
  isBetterAuthConfigured,
} from "./better-auth.server";

describe("better auth server scaffold", () => {
  it("uses the configured public base path", () => {
    expect(betterAuthBasePath).toBe("/api/auth");
    expect(getBetterAuthBasePathWildcard()).toBe("/api/auth/*");
  });

  it("detects that better auth is configured in tests", () => {
    expect(isBetterAuthConfigured()).toBe(true);
  });
});
