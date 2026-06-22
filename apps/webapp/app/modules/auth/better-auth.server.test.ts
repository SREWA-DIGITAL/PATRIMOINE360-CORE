import { vi } from "vitest";

// why: the Better Auth scaffold test only validates static configuration and
// route wiring helpers, so a live Prisma connection would add unrelated noise.
vi.mock("~/database/db.server", () => ({
  db: {},
}));

import {
  betterAuthBasePath,
  betterAuthModelNames,
  getBetterAuthBasePathWildcard,
  getBetterAuthOptions,
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

  it("uses dedicated prisma models for the migration phase", () => {
    const options = getBetterAuthOptions();

    expect(options.user?.modelName).toBe(betterAuthModelNames.user);
    expect(options.session?.modelName).toBe(betterAuthModelNames.session);
    expect(options.account?.modelName).toBe(betterAuthModelNames.account);
    expect(options.verification?.modelName).toBe(
      betterAuthModelNames.verification
    );
    expect(options.user?.additionalFields).toMatchObject({
      appMetadata: { input: false, required: false, type: "json" },
      invitedAt: { input: false, required: false, type: "date" },
      lastSignInAt: { input: false, required: false, type: "date" },
      userMetadata: { input: false, required: false, type: "json" },
    });
    expect(options.emailAndPassword).toMatchObject({
      enabled: true,
      requireEmailVerification: true,
    });
    expect(options.emailVerification).toMatchObject({
      autoSignInAfterVerification: false,
      sendOnSignIn: true,
      sendOnSignUp: true,
    });
    expect(options.emailVerification?.sendVerificationEmail).toEqual(
      expect.any(Function)
    );
    expect(options.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "bearer",
        }),
        expect.objectContaining({
          id: "email-otp",
        }),
      ])
    );
  });
});
