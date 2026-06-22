import { hash as hashBcrypt } from "bcryptjs";
import { hashPassword as hashBetterAuthPassword } from "better-auth/crypto";
import { describe, expect, it } from "vitest";

import {
  isLegacySupabasePasswordHash,
  verifyPasswordWithLegacySupport,
} from "./legacy-password-hash.server";

describe("legacy password hash support", () => {
  it("detects Supabase bcrypt hashes", () => {
    expect(isLegacySupabasePasswordHash("$2b$10$example")).toBe(true);
    expect(isLegacySupabasePasswordHash("salt:key")).toBe(false);
  });

  it("verifies Better Auth hashes", async () => {
    const hash = await hashBetterAuthPassword("password-123");

    await expect(
      verifyPasswordWithLegacySupport({
        hash,
        password: "password-123",
      })
    ).resolves.toBe(true);
  });

  it("verifies imported Supabase bcrypt hashes", async () => {
    const hash = await hashBcrypt("password-123", 10);

    await expect(
      verifyPasswordWithLegacySupport({
        hash,
        password: "password-123",
      })
    ).resolves.toBe(true);
  });

  it("accepts legacy $2y$ bcrypt prefixes", async () => {
    const hash = (await hashBcrypt("password-123", 10)).replace("$2b$", "$2y$");

    await expect(
      verifyPasswordWithLegacySupport({
        hash,
        password: "password-123",
      })
    ).resolves.toBe(true);
  });

  it("returns false for malformed hashes", async () => {
    await expect(
      verifyPasswordWithLegacySupport({
        hash: "not-a-valid-hash",
        password: "password-123",
      })
    ).resolves.toBe(false);
  });
});
