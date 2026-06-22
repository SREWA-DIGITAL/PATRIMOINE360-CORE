import { hashPassword } from "better-auth/crypto";
import { db } from "~/database/db.server";
import { ShelfError } from "~/utils/error";
import { id as generateId } from "~/utils/id/id.server";

const label = "Auth";

type JsonRecord = Record<string, unknown>;

type BetterAuthProviderUser = {
  app_metadata: JsonRecord;
  email: string;
  email_confirmed_at: string | null;
  id: string;
  invited_at: string | null;
  user_metadata: JsonRecord;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mergeRecord(
  base: unknown,
  next: JsonRecord | undefined
): JsonRecord | undefined {
  if (!next) {
    return isRecord(base) ? base : undefined;
  }

  return {
    ...(isRecord(base) ? base : {}),
    ...next,
  };
}

function buildSignupMethod(input: {
  appMetadata: unknown;
  hasCredentialAccount: boolean;
  invitedAt: Date | null;
}) {
  if (input.invitedAt) {
    return "invited";
  }

  if (isRecord(input.appMetadata) && input.appMetadata.provider === "sso") {
    return "sso";
  }

  if (input.hasCredentialAccount) {
    return "email-password";
  }

  return "unknown";
}

export async function ensureBetterAuthCredentialIdentity(input: {
  appMetadata?: JsonRecord;
  email: string;
  emailVerified?: boolean;
  invitedAt?: Date | null;
  name: string;
  password: string;
  userId: string;
  userMetadata?: JsonRecord;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const existingUserById = await db.betterAuthUser.findUnique({
    where: { id: input.userId },
    select: {
      appMetadata: true,
      id: true,
      invitedAt: true,
      userMetadata: true,
    },
  });

  if (!existingUserById) {
    const existingUserByEmail = await db.betterAuthUser.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUserByEmail && existingUserByEmail.id !== input.userId) {
      throw new ShelfError({
        cause: null,
        message: "A Better Auth user already exists for this email address",
        additionalData: {
          email: normalizedEmail,
          existingUserId: existingUserByEmail.id,
          requestedUserId: input.userId,
        },
        label,
        shouldBeCaptured: false,
        status: 409,
      });
    }
  }

  const appMetadata = mergeRecord(existingUserById?.appMetadata, {
    provider: "email",
    ...input.appMetadata,
  });
  const userMetadata = mergeRecord(
    existingUserById?.userMetadata,
    input.userMetadata
  );

  if (existingUserById) {
    await db.betterAuthUser.update({
      where: { id: input.userId },
      data: {
        appMetadata,
        email: normalizedEmail,
        emailVerified: input.emailVerified ?? true,
        invitedAt:
          input.invitedAt === undefined
            ? existingUserById.invitedAt
            : input.invitedAt,
        name: input.name,
        userMetadata,
      },
    });
  } else {
    await db.betterAuthUser.create({
      data: {
        appMetadata,
        email: normalizedEmail,
        emailVerified: input.emailVerified ?? true,
        id: input.userId,
        invitedAt: input.invitedAt ?? null,
        name: input.name,
        userMetadata,
      },
    });
  }

  const existingCredentialAccount = await db.betterAuthAccount.findFirst({
    where: {
      accountId: input.userId,
      providerId: "credential",
      userId: input.userId,
    },
    select: { id: true },
  });

  if (existingCredentialAccount) {
    await db.betterAuthAccount.update({
      where: { id: existingCredentialAccount.id },
      data: {
        password: passwordHash,
      },
    });
  } else {
    await db.betterAuthAccount.create({
      data: {
        accountId: input.userId,
        id: generateId(),
        password: passwordHash,
        providerId: "credential",
        userId: input.userId,
      },
    });
  }

  return db.betterAuthUser.findUniqueOrThrow({
    where: { id: input.userId },
  });
}

export async function updateBetterAuthCredentialPassword(
  userId: string,
  password: string
) {
  const passwordHash = await hashPassword(password);
  const existingCredentialAccount = await db.betterAuthAccount.findFirst({
    where: {
      accountId: userId,
      providerId: "credential",
      userId,
    },
    select: { id: true },
  });

  if (existingCredentialAccount) {
    return db.betterAuthAccount.update({
      where: { id: existingCredentialAccount.id },
      data: {
        password: passwordHash,
      },
    });
  }

  return db.betterAuthAccount.create({
    data: {
      accountId: userId,
      id: generateId(),
      password: passwordHash,
      providerId: "credential",
      userId,
    },
  });
}

export async function updateBetterAuthUserEmail(userId: string, email: string) {
  try {
    const user = await db.betterAuthUser.update({
      where: { id: userId },
      data: {
        email: normalizeEmail(email),
      },
    });

    return {
      data: { user },
      error: null,
    };
  } catch (error) {
    return {
      data: { user: null },
      error,
    };
  }
}

export async function deleteBetterAuthUserIdentity(userId: string) {
  try {
    const user = await db.betterAuthUser.delete({
      where: { id: userId },
    });

    return {
      data: { user },
      error: null,
    };
  } catch (error) {
    return {
      data: { user: null },
      error,
    };
  }
}

export async function getBetterAuthProviderUserById(
  userId: string
): Promise<BetterAuthProviderUser | null> {
  const user = await db.betterAuthUser.findUnique({
    where: { id: userId },
    select: {
      appMetadata: true,
      email: true,
      emailVerified: true,
      id: true,
      invitedAt: true,
      updatedAt: true,
      userMetadata: true,
      accounts: {
        where: {
          accountId: userId,
          providerId: "credential",
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return null;
  }

  const signupMethod = buildSignupMethod({
    appMetadata: user.appMetadata,
    hasCredentialAccount: user.accounts.length > 0,
    invitedAt: user.invitedAt,
  });

  return {
    app_metadata: isRecord(user.appMetadata) ? user.appMetadata : {},
    email: user.email,
    email_confirmed_at: user.emailVerified
      ? user.updatedAt.toISOString()
      : null,
    id: user.id,
    invited_at: user.invitedAt?.toISOString() ?? null,
    user_metadata: {
      ...(isRecord(user.userMetadata) ? user.userMetadata : {}),
      signup_method: signupMethod,
    },
  };
}
