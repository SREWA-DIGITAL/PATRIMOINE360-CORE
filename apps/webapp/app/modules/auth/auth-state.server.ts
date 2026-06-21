import { db } from "~/database/db.server";

export async function findAuthUserIdByEmail(email: string) {
  const result = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM auth.users
    WHERE email = ${email.toLowerCase()}
    LIMIT 1
  `;

  return result[0]?.id ?? null;
}

export async function isRefreshTokenActive(token: string) {
  const result = await db.$queryRaw<{ id: string; revoked: boolean }[]>`
    SELECT id, revoked FROM auth.refresh_tokens
    WHERE token = ${token}
    AND revoked = false
    LIMIT 1
  `;

  return result.length > 0;
}
