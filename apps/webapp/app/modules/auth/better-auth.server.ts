import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins/bearer";
import { emailOTP } from "better-auth/plugins/email-otp";
import {
  genericOAuth,
  type GenericOAuthConfig,
} from "better-auth/plugins/generic-oauth";
import { db } from "~/database/db.server";
import { sendTemplatedEmail } from "~/emails/template-registry.server";
import {
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_SSO_PROVIDERS,
  BETTER_AUTH_URL,
  SERVER_URL,
} from "~/utils/env";
import { ShelfError } from "~/utils/error";
import {
  ensureDomainUserForBetterAuthUser,
  syncDomainUserProfileFromBetterAuthUser,
} from "./better-auth-user-sync.server";
import { verifyPasswordWithLegacySupport } from "./legacy-password-hash.server";

const DEFAULT_BETTER_AUTH_BASE_PATH = "/api/auth";

export const betterAuthModelNames = {
  account: "betterAuthAccount",
  session: "betterAuthSession",
  user: "betterAuthUser",
  verification: "betterAuthVerification",
} as const;

type BetterAuthSsoProviderConfig = {
  accessType?: string;
  authorizationUrl?: string;
  authorizationUrlParams?: Record<string, string>;
  clientId: string;
  clientSecret?: string;
  discoveryUrl?: string;
  domain: string;
  issuer?: string;
  pkce?: boolean;
  prompt?:
    | "consent"
    | "create"
    | "login"
    | "login consent"
    | "none"
    | "select_account"
    | "select_account consent";
  providerId: string;
  requireIssuerValidation?: boolean;
  responseMode?: "form_post" | "query";
  responseType?: string;
  scopes?: string[];
  tokenUrl?: string;
  tokenUrlParams?: Record<string, string>;
  userInfoUrl?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBetterAuthBasePath(path: string | undefined) {
  const trimmedPath = path?.trim();

  if (!trimmedPath) {
    return DEFAULT_BETTER_AUTH_BASE_PATH;
  }

  const withLeadingSlash = trimmedPath.startsWith("/")
    ? trimmedPath
    : `/${trimmedPath}`;
  const normalizedPath = withLeadingSlash.replace(/\/+$/, "");

  return normalizedPath || DEFAULT_BETTER_AUTH_BASE_PATH;
}

export const betterAuthBasePath = normalizeBetterAuthBasePath(
  BETTER_AUTH_BASE_PATH
);

export function getBetterAuthBasePathWildcard() {
  return `${betterAuthBasePath}/*`;
}

export function isBetterAuthConfigured() {
  return Boolean(BETTER_AUTH_SECRET);
}

function normalizeSsoDomain(domain: string) {
  return domain.trim().toLowerCase();
}

function normalizeSsoProviderId(domain: string, providerId?: string) {
  const normalizedDomain = normalizeSsoDomain(domain);
  const trimmedProviderId = providerId?.trim();

  return trimmedProviderId && trimmedProviderId.length > 0
    ? trimmedProviderId
    : normalizedDomain;
}

function splitSsoName(value: unknown) {
  if (typeof value !== "string") {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const [firstName, ...rest] = trimmedValue.split(/\s+/);

  return {
    firstName: firstName ?? "",
    lastName: rest.join(" ").trim(),
  };
}

function getSsoProfileString(
  profile: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = profile[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getSsoProfileGroups(profile: Record<string, unknown>) {
  const groups = profile.groups;

  if (!Array.isArray(groups)) {
    return [];
  }

  return groups
    .map((group) => (typeof group === "string" ? group.trim() : ""))
    .filter(Boolean);
}

function buildSsoClaims(profile: Record<string, unknown>) {
  const firstName =
    getSsoProfileString(profile, ["firstname", "firstName", "given_name"]) ??
    "";
  const lastName =
    getSsoProfileString(profile, ["lastname", "lastName", "family_name"]) ?? "";
  const fullName =
    getSsoProfileString(profile, ["name", "displayName"]) ??
    [firstName, lastName].filter(Boolean).join(" ").trim();
  const splitName = splitSsoName(fullName);

  return {
    city: getSsoProfileString(profile, ["city"]),
    country: getSsoProfileString(profile, ["country"]),
    firstname: firstName || splitName.firstName,
    groups: getSsoProfileGroups(profile),
    lastname: lastName || splitName.lastName,
    mobilephone: getSsoProfileString(profile, ["mobilephone", "phone_number"]),
    postalCode: getSsoProfileString(profile, ["postalcode", "postal_code"]),
    stateProvince: getSsoProfileString(profile, ["stateprovince", "state"]),
    streetAddress: getSsoProfileString(profile, [
      "streetaddress",
      "street_address",
      "address",
    ]),
  };
}

function mapSsoProfileToBetterAuthUser(
  provider: BetterAuthSsoProviderConfig,
  profile: Record<string, unknown>
) {
  const claims = buildSsoClaims(profile);
  const firstName = claims.firstname || "";
  const lastName = claims.lastname || "";
  const name =
    getSsoProfileString(profile, ["name", "displayName"]) ??
    [firstName, lastName].filter(Boolean).join(" ").trim() ??
    "";

  return {
    appMetadata: {
      domain: provider.domain,
      provider: "sso",
      providerId: provider.providerId,
    },
    name,
    userMetadata: {
      custom_claims: claims,
      sso: {
        domain: provider.domain,
        providerId: provider.providerId,
      },
    },
  };
}

function parseBetterAuthSsoProviders() {
  const rawValue = BETTER_AUTH_SSO_PROVIDERS?.trim();

  if (!rawValue) {
    return [] as BetterAuthSsoProviderConfig[];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      throw new Error("BETTER_AUTH_SSO_PROVIDERS must be a JSON array");
    }

    return parsedValue.map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        throw new Error(`Provider entry at index ${index} must be an object`);
      }

      const domain =
        typeof entry.domain === "string"
          ? normalizeSsoDomain(entry.domain)
          : "";
      const clientId =
        typeof entry.clientId === "string" ? entry.clientId.trim() : "";

      if (!domain || !clientId) {
        throw new Error(
          `Provider entry at index ${index} must define both domain and clientId`
        );
      }

      const providerConfig: BetterAuthSsoProviderConfig = {
        accessType:
          typeof entry.accessType === "string" ? entry.accessType : undefined,
        authorizationUrl:
          typeof entry.authorizationUrl === "string"
            ? entry.authorizationUrl
            : undefined,
        authorizationUrlParams:
          entry.authorizationUrlParams &&
          typeof entry.authorizationUrlParams === "object" &&
          !Array.isArray(entry.authorizationUrlParams)
            ? (entry.authorizationUrlParams as Record<string, string>)
            : undefined,
        clientId,
        clientSecret:
          typeof entry.clientSecret === "string"
            ? entry.clientSecret
            : undefined,
        discoveryUrl:
          typeof entry.discoveryUrl === "string"
            ? entry.discoveryUrl
            : undefined,
        domain,
        issuer: typeof entry.issuer === "string" ? entry.issuer : undefined,
        pkce: typeof entry.pkce === "boolean" ? entry.pkce : undefined,
        prompt: typeof entry.prompt === "string" ? entry.prompt : undefined,
        providerId: normalizeSsoProviderId(domain, entry.providerId),
        requireIssuerValidation:
          typeof entry.requireIssuerValidation === "boolean"
            ? entry.requireIssuerValidation
            : undefined,
        responseMode:
          entry.responseMode === "form_post" || entry.responseMode === "query"
            ? entry.responseMode
            : undefined,
        responseType:
          typeof entry.responseType === "string"
            ? entry.responseType
            : undefined,
        scopes: Array.isArray(entry.scopes)
          ? entry.scopes.filter(
              (scope: unknown): scope is string => typeof scope === "string"
            )
          : undefined,
        tokenUrl:
          typeof entry.tokenUrl === "string" ? entry.tokenUrl : undefined,
        tokenUrlParams:
          entry.tokenUrlParams &&
          typeof entry.tokenUrlParams === "object" &&
          !Array.isArray(entry.tokenUrlParams)
            ? (entry.tokenUrlParams as Record<string, string>)
            : undefined,
        userInfoUrl:
          typeof entry.userInfoUrl === "string" ? entry.userInfoUrl : undefined,
      };

      return providerConfig;
    });
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "BETTER_AUTH_SSO_PROVIDERS is invalid. Expected a JSON array of OAuth provider configurations.",
      label: "Auth",
      shouldBeCaptured: false,
      status: 500,
    });
  }
}

export function getBetterAuthSsoProviders() {
  return parseBetterAuthSsoProviders();
}

export function findBetterAuthSsoProviderByDomain(domain: string) {
  const normalizedDomain = normalizeSsoDomain(domain);

  return getBetterAuthSsoProviders().find(
    (provider) => provider.domain === normalizedDomain
  );
}

function getBetterAuthSsoPluginConfigs(): GenericOAuthConfig[] {
  return getBetterAuthSsoProviders().map((provider) => ({
    accessType: provider.accessType,
    authorizationUrl: provider.authorizationUrl,
    authorizationUrlParams: provider.authorizationUrlParams,
    clientId: provider.clientId,
    clientSecret: provider.clientSecret,
    discoveryUrl: provider.discoveryUrl,
    issuer: provider.issuer,
    mapProfileToUser(profile) {
      return mapSsoProfileToBetterAuthUser(provider, profile);
    },
    pkce: provider.pkce,
    prompt: provider.prompt,
    providerId: provider.providerId,
    requireIssuerValidation: provider.requireIssuerValidation,
    responseMode: provider.responseMode,
    responseType: provider.responseType,
    scopes: provider.scopes,
    tokenUrl: provider.tokenUrl,
    tokenUrlParams: provider.tokenUrlParams,
    userInfoUrl: provider.userInfoUrl,
  }));
}

function getBetterAuthConfig() {
  if (!BETTER_AUTH_SECRET) {
    throw new ShelfError({
      cause: null,
      message:
        "Better Auth is not configured. Define BETTER_AUTH_SECRET before using the auth handler.",
      label: "Auth",
      status: 503,
      shouldBeCaptured: false,
    });
  }

  return {
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL || SERVER_URL,
    basePath: betterAuthBasePath,
  };
}

function sendBetterAuthVerificationEmail(input: {
  email: string;
  url: string;
}) {
  return Promise.resolve(
    sendTemplatedEmail({
      to: input.email,
      template: "auth.verify-email-link",
      data: {
        email: input.email,
        url: input.url,
      },
    })
  );
}

function getBetterAuthOtpTemplateKey(
  type: "change-email" | "email-verification" | "forget-password" | "sign-in"
) {
  switch (type) {
    case "sign-in":
      return "auth.login-otp";
    case "email-verification":
      return "auth.signup-otp";
    case "forget-password":
      return "auth.reset-password-otp";
    case "change-email":
      return "auth.change-email-otp";
  }
}

function sendBetterAuthOtp(input: {
  email: string;
  otp: string;
  type: "change-email" | "email-verification" | "forget-password" | "sign-in";
}) {
  const template = getBetterAuthOtpTemplateKey(input.type);

  return Promise.resolve(
    sendTemplatedEmail({
      to: input.email,
      template,
      data:
        template === "auth.change-email-otp"
          ? {
              otp: input.otp,
              user: {
                email: input.email,
              },
            }
          : {
              email: input.email,
              otp: input.otp,
            },
    })
  );
}

export function getBetterAuthOptions(): BetterAuthOptions {
  const config = getBetterAuthConfig();
  const ssoPluginConfigs = getBetterAuthSsoPluginConfigs();

  return {
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: config.basePath,
    database: prismaAdapter(db, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      password: {
        // Preserve access for migrated Supabase users while new and reset
        // passwords continue to use Better Auth's native hashing.
        verify: verifyPasswordWithLegacySupport,
      },
      requireEmailVerification: true,
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      sendOnSignIn: true,
      sendOnSignUp: true,
      sendVerificationEmail({ user, url }) {
        return sendBetterAuthVerificationEmail({
          email: user.email,
          url,
        });
      },
    },
    plugins: [
      bearer(),
      emailOTP({
        changeEmail: {
          enabled: true,
        },
        disableSignUp: true,
        sendVerificationOTP({ email, otp, type }) {
          return sendBetterAuthOtp({ email, otp, type });
        },
      }),
      ...(ssoPluginConfigs.length > 0
        ? [genericOAuth({ config: ssoPluginConfigs })]
        : []),
    ],
    user: {
      modelName: betterAuthModelNames.user,
      additionalFields: {
        userMetadata: {
          type: "json",
          required: false,
          input: false,
        },
        appMetadata: {
          type: "json",
          required: false,
          input: false,
        },
        invitedAt: {
          type: "date",
          required: false,
          input: false,
        },
        lastSignInAt: {
          type: "date",
          required: false,
          input: false,
        },
      },
    },
    session: {
      modelName: betterAuthModelNames.session,
    },
    account: {
      modelName: betterAuthModelNames.account,
    },
    verification: {
      modelName: betterAuthModelNames.verification,
    },
    databaseHooks: {
      user: {
        create: {
          async before(user) {
            const appMetadata = isRecord(user.appMetadata)
              ? user.appMetadata
              : {
                  provider: "email",
                };
            const syncedUser = await ensureDomainUserForBetterAuthUser({
              appMetadata,
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            });

            return {
              data: {
                ...user,
                id: syncedUser.id,
                email: syncedUser.email,
                name: syncedUser.name,
                image: syncedUser.image,
                appMetadata,
              },
            };
          },
        },
        update: {
          async after(user) {
            await syncDomainUserProfileFromBetterAuthUser({
              appMetadata: isRecord(user.appMetadata) ? user.appMetadata : null,
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            });
          },
        },
      },
    },
  };
}

function createBetterAuthInstance() {
  return betterAuth(getBetterAuthOptions());
}

let betterAuthInstance: ReturnType<typeof createBetterAuthInstance> | null =
  null;

export function getBetterAuth() {
  if (betterAuthInstance) {
    return betterAuthInstance;
  }

  betterAuthInstance = createBetterAuthInstance();

  return betterAuthInstance;
}

export async function handleBetterAuthRequest(request: Request) {
  return getBetterAuth().handler(request);
}
