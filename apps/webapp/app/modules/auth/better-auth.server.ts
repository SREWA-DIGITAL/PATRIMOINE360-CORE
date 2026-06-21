import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/database/db.server";
import {
  BETTER_AUTH_BASE_PATH,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  SERVER_URL,
} from "~/utils/env";
import { ShelfError } from "~/utils/error";

const DEFAULT_BETTER_AUTH_BASE_PATH = "/api/auth";

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

function createBetterAuthInstance() {
  const config = getBetterAuthConfig();

  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: config.basePath,
    database: prismaAdapter(db, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
    },
  });
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
