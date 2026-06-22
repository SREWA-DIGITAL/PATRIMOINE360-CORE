import { createId } from "@paralleldrive/cuid2";
import { createDatabaseClient } from "@shelf/database";

type TimestampLike = Date | string | null;

type SupabaseIdentity = {
  created_at: TimestampLike;
  id: string;
  identity_data: Record<string, unknown> | null;
  provider: string | null;
  updated_at: TimestampLike;
  user_id: string;
};

type SupabaseAuthUser = {
  created_at: TimestampLike;
  email: string | null;
  email_confirmed_at: TimestampLike;
  encrypted_password: string | null;
  id: string;
  identities: SupabaseIdentity[];
  invited_at: TimestampLike;
  last_sign_in_at: TimestampLike;
  raw_app_meta_data: Record<string, unknown> | null;
  raw_user_meta_data: Record<string, unknown> | null;
  updated_at: TimestampLike;
};

type DomainUserRecord = {
  betterAuthUser: { id: string } | null;
  email: string;
  id: string;
  sso: boolean;
};

type BetterAuthUserRecord = {
  email: string;
  id: string;
};

type BetterAuthAccountRecord = {
  accountId: string;
  providerId: string;
  userId: string;
};

export type SupabaseMigrationAccountPlan = {
  accountId: string;
  alreadyExists: boolean;
  providerId: string;
  readyToCreate: boolean;
  reason: string | null;
  source: "oauth" | "password";
};

export type SupabaseMigrationPlanEntry = {
  activeLegacyRefreshTokenCount: number;
  blockingReasons: string[];
  canMigrate: boolean;
  credentialAccount: SupabaseMigrationAccountPlan | null;
  domainUserByEmailId: string | null;
  domainUserById: boolean;
  email: string | null;
  hasBetterAuthUserByEmail: boolean;
  hasBetterAuthUserById: boolean;
  identities: Array<{
    accountId: string | null;
    provider: string | null;
  }>;
  needsBetterAuthUser: boolean;
  oauthAccounts: SupabaseMigrationAccountPlan[];
  userId: string;
};

export type SupabaseMigrationSummary = {
  alreadyMigratedUsers: number;
  blockedByEmailCollision: number;
  migratableUsers: number;
  missingDomainUsers: number;
  readyCredentialAccounts: number;
  readyOauthAccounts: number;
  readyUsers: number;
  totalUsers: number;
  usersWithActiveLegacyRefreshTokens: number;
  usersWithoutEmail: number;
};

export type SupabaseMigrationPlan = {
  entries: SupabaseMigrationPlanEntry[];
  summary: SupabaseMigrationSummary;
};

export function createScriptDatabaseClient() {
  return createDatabaseClient();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function firstString(values: unknown[]) {
  for (const value of values) {
    if (hasValue(value)) {
      return value.trim();
    }
  }

  return null;
}

function toDate(value: TimestampLike) {
  if (!value) {
    return new Date();
  }

  return value instanceof Date ? value : new Date(value);
}

function compactRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  );
}

function deriveIdentityAccountId(identity: SupabaseIdentity) {
  const identityData = isRecord(identity.identity_data)
    ? identity.identity_data
    : null;

  return firstString([
    identityData?.sub,
    identityData?.user_id,
    identityData?.id,
    identityData?.email,
    identity.id,
  ]);
}

function deriveUserName(user: SupabaseAuthUser) {
  const metadata = isRecord(user.raw_user_meta_data)
    ? user.raw_user_meta_data
    : {};
  const firstIdentity = user.identities.find((identity) =>
    isRecord(identity.identity_data)
  );
  const identityData = firstIdentity?.identity_data ?? null;

  return (
    firstString([
      metadata.full_name,
      metadata.name,
      metadata.display_name,
      [metadata.first_name, metadata.last_name].filter(hasValue).join(" "),
      metadata.user_name,
      metadata.username,
      isRecord(identityData) ? identityData.name : null,
      isRecord(identityData) ? identityData.full_name : null,
      isRecord(identityData) ? identityData.preferred_username : null,
      normalizeEmail(user.email)?.split("@")[0],
    ]) ?? "User"
  );
}

function deriveUserImage(user: SupabaseAuthUser) {
  const metadata = isRecord(user.raw_user_meta_data)
    ? user.raw_user_meta_data
    : {};
  const firstIdentity = user.identities.find((identity) =>
    isRecord(identity.identity_data)
  );
  const identityData = firstIdentity?.identity_data ?? null;

  return firstString([
    metadata.avatar_url,
    metadata.picture,
    isRecord(identityData) ? identityData.avatar_url : null,
    isRecord(identityData) ? identityData.picture : null,
  ]);
}

function buildBetterAuthUserAppMetadata(user: SupabaseAuthUser) {
  const rawAppMetadata = isRecord(user.raw_app_meta_data)
    ? user.raw_app_meta_data
    : {};
  const hasPassword = hasValue(user.encrypted_password);
  const hasOauth = user.identities.some(
    (identity) => hasValue(identity.provider) && identity.provider !== "email"
  );

  return compactRecord({
    ...rawAppMetadata,
    migratedFrom: "supabase-auth",
    provider: hasPassword ? "email" : hasOauth ? "oauth" : "supabase",
  });
}

function buildBetterAuthUserData(user: SupabaseAuthUser) {
  const rawUserMetadata = isRecord(user.raw_user_meta_data)
    ? user.raw_user_meta_data
    : undefined;
  const appMetadata = buildBetterAuthUserAppMetadata(user);

  return {
    appMetadata: Object.keys(appMetadata).length > 0 ? appMetadata : undefined,
    createdAt: toDate(user.created_at),
    email: normalizeEmail(user.email) ?? "",
    emailVerified: Boolean(user.email_confirmed_at),
    id: user.id,
    image: deriveUserImage(user),
    invitedAt: user.invited_at ? toDate(user.invited_at) : null,
    lastSignInAt: user.last_sign_in_at ? toDate(user.last_sign_in_at) : null,
    name: deriveUserName(user),
    updatedAt: toDate(user.updated_at),
    userMetadata: rawUserMetadata,
  };
}

async function loadSupabaseUsers(
  db: ReturnType<typeof createScriptDatabaseClient>
) {
  const rows = await db.$queryRaw<SupabaseAuthUser[]>`
    SELECT
      u.id,
      u.email,
      u.encrypted_password,
      u.email_confirmed_at,
      u.created_at,
      u.updated_at,
      u.invited_at,
      u.last_sign_in_at,
      u.raw_user_meta_data,
      u.raw_app_meta_data,
      COALESCE(
        json_agg(
          json_build_object(
            'id', i.id,
            'provider', i.provider,
            'identity_data', i.identity_data,
            'created_at', i.created_at,
            'updated_at', i.updated_at,
            'user_id', i.user_id
          ) ORDER BY i.id
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) AS identities
    FROM auth.users u
    LEFT JOIN auth.identities i ON i.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at ASC
  `;

  return rows.map((row) => ({
    ...row,
    email: normalizeEmail(row.email),
    identities: Array.isArray(row.identities) ? row.identities : [],
  }));
}

async function loadActiveRefreshTokenCounts(
  db: ReturnType<typeof createScriptDatabaseClient>
) {
  const rows = await db.$queryRaw<{ active_count: number; user_id: string }[]>`
    SELECT user_id, COUNT(*)::int AS active_count
    FROM auth.refresh_tokens
    WHERE revoked = false
    GROUP BY user_id
  `;

  return new Map(
    rows.map((row) => [row.user_id, Number(row.active_count) || 0])
  );
}

async function loadDomainUsers(
  db: ReturnType<typeof createScriptDatabaseClient>,
  userIds: string[],
  emails: string[]
) {
  if (userIds.length === 0 && emails.length === 0) {
    return [] as DomainUserRecord[];
  }

  return db.user.findMany({
    where: {
      OR: [
        ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
        ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
      ],
    },
    select: {
      betterAuthUser: {
        select: {
          id: true,
        },
      },
      email: true,
      id: true,
      sso: true,
    },
  });
}

async function loadBetterAuthUsers(
  db: ReturnType<typeof createScriptDatabaseClient>,
  userIds: string[],
  emails: string[]
) {
  if (userIds.length === 0 && emails.length === 0) {
    return [] as BetterAuthUserRecord[];
  }

  return db.betterAuthUser.findMany({
    where: {
      OR: [
        ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
        ...(emails.length > 0 ? [{ email: { in: emails } }] : []),
      ],
    },
    select: {
      email: true,
      id: true,
    },
  });
}

async function loadBetterAuthAccounts(
  db: ReturnType<typeof createScriptDatabaseClient>,
  userIds: string[]
) {
  if (userIds.length === 0) {
    return [] as BetterAuthAccountRecord[];
  }

  return db.betterAuthAccount.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    select: {
      accountId: true,
      providerId: true,
      userId: true,
    },
  });
}

export async function buildSupabaseMigrationPlan(input?: {
  email?: string;
  limit?: number;
  userId?: string;
}) {
  const db = createScriptDatabaseClient();

  try {
    const supabaseUsers = await loadSupabaseUsers(db);
    const filteredUsers = supabaseUsers
      .filter((user) =>
        input?.email ? user.email === normalizeEmail(input.email) : true
      )
      .filter((user) => (input?.userId ? user.id === input.userId : true))
      .slice(0, input?.limit ?? Number.MAX_SAFE_INTEGER);
    const userIds = filteredUsers.map((user) => user.id);
    const emails = filteredUsers
      .map((user) => user.email)
      .filter((email): email is string => Boolean(email));

    const [
      activeRefreshTokenCounts,
      domainUsers,
      betterAuthUsers,
      betterAuthAccounts,
    ] = await Promise.all([
      loadActiveRefreshTokenCounts(db),
      loadDomainUsers(db, userIds, emails),
      loadBetterAuthUsers(db, userIds, emails),
      loadBetterAuthAccounts(db, userIds),
    ]);

    const domainUsersById = new Map(domainUsers.map((user) => [user.id, user]));
    const domainUsersByEmail = new Map(
      domainUsers.map((user) => [user.email, user])
    );
    const betterAuthUsersById = new Map(
      betterAuthUsers.map((user) => [user.id, user])
    );
    const betterAuthUsersByEmail = new Map(
      betterAuthUsers.map((user) => [user.email, user])
    );
    const betterAuthAccountsByKey = new Set(
      betterAuthAccounts.map(
        (account) =>
          `${account.userId}:${account.providerId}:${account.accountId}`
      )
    );

    const entries: SupabaseMigrationPlanEntry[] = filteredUsers.map((user) => {
      const domainUserById = domainUsersById.get(user.id) ?? null;
      const domainUserByEmail = user.email
        ? domainUsersByEmail.get(user.email) ?? null
        : null;
      const betterAuthUserById = betterAuthUsersById.get(user.id) ?? null;
      const betterAuthUserByEmail = user.email
        ? betterAuthUsersByEmail.get(user.email) ?? null
        : null;
      const blockingReasons: string[] = [];

      if (!user.email) {
        blockingReasons.push("missing-email");
      }

      if (!domainUserById) {
        blockingReasons.push(
          domainUserByEmail && domainUserByEmail.id !== user.id
            ? "domain-user-id-mismatch"
            : "missing-domain-user"
        );
      }

      if (betterAuthUserByEmail && betterAuthUserByEmail.id !== user.id) {
        blockingReasons.push("better-auth-email-owned-by-another-user");
      }

      const credentialAccount =
        hasValue(user.encrypted_password) && user.email
          ? {
              accountId: user.id,
              alreadyExists: betterAuthAccountsByKey.has(
                `${user.id}:credential:${user.id}`
              ),
              providerId: "credential",
              readyToCreate:
                blockingReasons.length === 0 &&
                !betterAuthAccountsByKey.has(
                  `${user.id}:credential:${user.id}`
                ),
              reason:
                blockingReasons.length > 0
                  ? blockingReasons.join(",")
                  : betterAuthAccountsByKey.has(
                      `${user.id}:credential:${user.id}`
                    )
                  ? "already-exists"
                  : null,
              source: "password" as const,
            }
          : null;

      const oauthAccounts = user.identities
        .filter(
          (identity) =>
            hasValue(identity.provider) && identity.provider !== "email"
        )
        .map((identity) => {
          const accountId = deriveIdentityAccountId(identity);
          const providerId = identity.provider ?? "";
          const alreadyExists = accountId
            ? betterAuthAccountsByKey.has(
                `${user.id}:${providerId}:${accountId}`
              )
            : false;
          const reason = !accountId
            ? "missing-provider-account-id"
            : blockingReasons.length > 0
            ? blockingReasons.join(",")
            : alreadyExists
            ? "already-exists"
            : null;

          return {
            accountId: accountId ?? `${identity.id}`,
            alreadyExists,
            providerId,
            readyToCreate:
              Boolean(accountId) &&
              blockingReasons.length === 0 &&
              !alreadyExists,
            reason,
            source: "oauth" as const,
          };
        });

      return {
        activeLegacyRefreshTokenCount:
          activeRefreshTokenCounts.get(user.id) ?? 0,
        blockingReasons,
        canMigrate: blockingReasons.length === 0,
        credentialAccount,
        domainUserByEmailId: domainUserByEmail?.id ?? null,
        domainUserById: Boolean(domainUserById),
        email: user.email,
        hasBetterAuthUserByEmail: Boolean(betterAuthUserByEmail),
        hasBetterAuthUserById: Boolean(betterAuthUserById),
        identities: user.identities.map((identity) => ({
          accountId: deriveIdentityAccountId(identity),
          provider: identity.provider,
        })),
        needsBetterAuthUser: !betterAuthUserById,
        oauthAccounts,
        userId: user.id,
      };
    });

    const summary: SupabaseMigrationSummary = {
      alreadyMigratedUsers: entries.filter(
        (entry) =>
          entry.hasBetterAuthUserById &&
          !entry.credentialAccount?.readyToCreate &&
          entry.oauthAccounts.every((account) => !account.readyToCreate)
      ).length,
      blockedByEmailCollision: entries.filter((entry) =>
        entry.blockingReasons.includes(
          "better-auth-email-owned-by-another-user"
        )
      ).length,
      migratableUsers: entries.filter((entry) => entry.canMigrate).length,
      missingDomainUsers: entries.filter((entry) =>
        entry.blockingReasons.some((reason) =>
          ["domain-user-id-mismatch", "missing-domain-user"].includes(reason)
        )
      ).length,
      readyCredentialAccounts: entries.filter(
        (entry) => entry.credentialAccount?.readyToCreate
      ).length,
      readyOauthAccounts: entries.reduce(
        (count, entry) =>
          count +
          entry.oauthAccounts.filter((account) => account.readyToCreate).length,
        0
      ),
      readyUsers: entries.filter(
        (entry) => entry.needsBetterAuthUser && entry.canMigrate
      ).length,
      totalUsers: entries.length,
      usersWithActiveLegacyRefreshTokens: entries.filter(
        (entry) => entry.activeLegacyRefreshTokenCount > 0
      ).length,
      usersWithoutEmail: entries.filter((entry) => !entry.email).length,
    };

    return {
      entries,
      summary,
    } satisfies SupabaseMigrationPlan;
  } finally {
    await db.$disconnect();
  }
}

export async function executeSupabaseMigration(input?: {
  email?: string;
  includeOauthAccounts?: boolean;
  limit?: number;
  userId?: string;
}) {
  const db = createScriptDatabaseClient();

  try {
    const supabaseUsers = await loadSupabaseUsers(db);
    const filteredUsers = supabaseUsers
      .filter((user) =>
        input?.email ? user.email === normalizeEmail(input.email) : true
      )
      .filter((user) => (input?.userId ? user.id === input.userId : true))
      .slice(0, input?.limit ?? Number.MAX_SAFE_INTEGER);
    const userIds = filteredUsers.map((user) => user.id);
    const emails = filteredUsers
      .map((user) => user.email)
      .filter((email): email is string => Boolean(email));
    const [domainUsers, betterAuthUsers, betterAuthAccounts] =
      await Promise.all([
        loadDomainUsers(db, userIds, emails),
        loadBetterAuthUsers(db, userIds, emails),
        loadBetterAuthAccounts(db, userIds),
      ]);

    const domainUsersById = new Map(domainUsers.map((user) => [user.id, user]));
    const domainUsersByEmail = new Map(
      domainUsers.map((user) => [user.email, user])
    );
    const betterAuthUsersById = new Map(
      betterAuthUsers.map((user) => [user.id, user])
    );
    const betterAuthUsersByEmail = new Map(
      betterAuthUsers.map((user) => [user.email, user])
    );
    const betterAuthAccountsByKey = new Set(
      betterAuthAccounts.map(
        (account) =>
          `${account.userId}:${account.providerId}:${account.accountId}`
      )
    );

    const results: Array<{
      createdCredentialAccount: boolean;
      createdOauthAccounts: number;
      createdUser: boolean;
      skipped: boolean;
      userId: string;
    }> = [];

    for (const user of filteredUsers) {
      const domainUserById = domainUsersById.get(user.id) ?? null;
      const domainUserByEmail = user.email
        ? domainUsersByEmail.get(user.email) ?? null
        : null;
      const betterAuthUserById = betterAuthUsersById.get(user.id) ?? null;
      const betterAuthUserByEmail = user.email
        ? betterAuthUsersByEmail.get(user.email) ?? null
        : null;
      const blockingReasons: string[] = [];

      if (!user.email) {
        blockingReasons.push("missing-email");
      }

      if (!domainUserById) {
        blockingReasons.push(
          domainUserByEmail && domainUserByEmail.id !== user.id
            ? "domain-user-id-mismatch"
            : "missing-domain-user"
        );
      }

      if (betterAuthUserByEmail && betterAuthUserByEmail.id !== user.id) {
        blockingReasons.push("better-auth-email-owned-by-another-user");
      }

      if (blockingReasons.length > 0) {
        results.push({
          createdCredentialAccount: false,
          createdOauthAccounts: 0,
          createdUser: false,
          skipped: true,
          userId: user.id,
        });
        continue;
      }

      let createdUser = false;
      let createdCredentialAccount = false;
      let createdOauthAccounts = 0;

      await db.$transaction(async (tx) => {
        if (!betterAuthUserById) {
          await tx.betterAuthUser.create({
            data: buildBetterAuthUserData(user),
          });
          createdUser = true;
        }

        if (
          hasValue(user.encrypted_password) &&
          !betterAuthAccountsByKey.has(`${user.id}:credential:${user.id}`)
        ) {
          await tx.betterAuthAccount.create({
            data: {
              accountId: user.id,
              createdAt: toDate(user.created_at),
              id: createId(),
              password: user.encrypted_password,
              providerId: "credential",
              updatedAt: toDate(user.updated_at),
              userId: user.id,
            },
          });
          createdCredentialAccount = true;
        }

        if (input?.includeOauthAccounts) {
          for (const identity of user.identities) {
            if (!hasValue(identity.provider) || identity.provider === "email") {
              continue;
            }

            const accountId = deriveIdentityAccountId(identity);

            if (!accountId) {
              continue;
            }

            const key = `${user.id}:${identity.provider}:${accountId}`;

            if (betterAuthAccountsByKey.has(key)) {
              continue;
            }

            await tx.betterAuthAccount.create({
              data: {
                accountId,
                createdAt: toDate(identity.created_at ?? user.created_at),
                id: createId(),
                providerId: identity.provider,
                updatedAt: toDate(identity.updated_at ?? user.updated_at),
                userId: user.id,
              },
            });
            createdOauthAccounts += 1;
          }
        }
      });

      results.push({
        createdCredentialAccount,
        createdOauthAccounts,
        createdUser,
        skipped: false,
        userId: user.id,
      });
    }

    return results;
  } finally {
    await db.$disconnect();
  }
}

export function formatPlanSummary(summary: SupabaseMigrationSummary) {
  return [
    `Total users analysed: ${summary.totalUsers}`,
    `Migratable users: ${summary.migratableUsers}`,
    `Ready BetterAuthUser inserts: ${summary.readyUsers}`,
    `Ready credential account inserts: ${summary.readyCredentialAccounts}`,
    `Ready OAuth account inserts: ${summary.readyOauthAccounts}`,
    `Already migrated users: ${summary.alreadyMigratedUsers}`,
    `Users without email: ${summary.usersWithoutEmail}`,
    `Users missing or mismatching domain User: ${summary.missingDomainUsers}`,
    `Users blocked by Better Auth email collision: ${summary.blockedByEmailCollision}`,
    `Users with active legacy refresh tokens: ${summary.usersWithActiveLegacyRefreshTokens}`,
  ].join("\n");
}
