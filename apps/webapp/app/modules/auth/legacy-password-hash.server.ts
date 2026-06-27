import { compare } from "bcryptjs";
import { verifyPassword as verifyBetterAuthPassword } from "better-auth/crypto";

const LEGACY_BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"] as const;

export function isLegacySupabasePasswordHash(hash: string) {
  return LEGACY_BCRYPT_PREFIXES.some((prefix) => hash.startsWith(prefix));
}

function normalizeLegacyBcryptHash(hash: string) {
  if (hash.startsWith("$2y$")) {
    return `$2b$${hash.slice(4)}`;
  }

  return hash;
}

export async function verifyPasswordWithLegacySupport(input: {
  hash: string;
  password: string;
}) {
  try {
    if (isLegacySupabasePasswordHash(input.hash)) {
      return await compare(
        input.password,
        normalizeLegacyBcryptHash(input.hash)
      );
    }

    return await verifyBetterAuthPassword(input);
  } catch {
    return false;
  }
}
