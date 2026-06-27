import { APIError, isAPIError } from "better-auth/api";
import type { AuthSession } from "@server/session";
import { ShelfError } from "~/utils/error";
import { getBetterAuth } from "./better-auth.server";

type BetterAuthSessionResponse = {
  session: {
    token: string;
    userId: string;
    expiresAt: Date | string;
  };
  user: {
    id: string;
    email?: string | null;
  };
};

type BetterAuthExtendedApi = ReturnType<typeof getBetterAuth>["api"] & {
  changeEmailEmailOTP(input: {
    body: {
      newEmail: string;
      otp: string;
    };
    headers: Headers;
  }): Promise<unknown>;
  requestEmailChangeEmailOTP(input: {
    body: {
      newEmail: string;
    };
    headers: Headers;
  }): Promise<unknown>;
  requestPasswordResetEmailOTP(input: {
    body: {
      email: string;
    };
  }): Promise<unknown>;
  resetPasswordEmailOTP(input: {
    body: {
      email: string;
      otp: string;
      password: string;
    };
  }): Promise<unknown>;
  sendVerificationOTP(input: {
    body: {
      email: string;
      type: "sign-in";
    };
  }): Promise<unknown>;
  signInEmailOTP(input: {
    body: {
      email: string;
      otp: string;
    };
  }): Promise<{
    token: string;
  }>;
  signInWithOAuth2(input: {
    body: {
      callbackURL: string;
      errorCallbackURL?: string;
      providerId: string;
    };
  }): Promise<{
    redirect?: boolean;
    url: string;
  }>;
};

function createBearerHeaders(token: string) {
  return new Headers({
    authorization: `Bearer ${token}`,
  });
}

function createRequestHeaders(headers: HeadersInit) {
  return headers instanceof Headers ? headers : new Headers(headers);
}

function getBetterAuthApi() {
  return getBetterAuth().api as BetterAuthExtendedApi;
}

function toUnixTimestampSeconds(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return Math.floor(date.getTime() / 1000);
}

export function isBetterAuthApiError(error: unknown): error is APIError {
  return error instanceof APIError || isAPIError(error);
}

export function getBetterAuthErrorCode(error: unknown) {
  if (!isBetterAuthApiError(error)) {
    return undefined;
  }

  return error.body?.code;
}

export function mapBetterAuthSession(
  betterAuthSession: BetterAuthSessionResponse
): AuthSession {
  const email = betterAuthSession.user.email;

  if (!email) {
    throw new ShelfError({
      cause: null,
      message: "Better Auth user should have an email",
      additionalData: {
        userId: betterAuthSession.user.id || betterAuthSession.session.userId,
      },
      label: "Auth",
    });
  }

  const expiresAt = toUnixTimestampSeconds(betterAuthSession.session.expiresAt);
  const now = Math.floor(Date.now() / 1000);

  return {
    provider: "better-auth",
    accessToken: betterAuthSession.session.token,
    refreshToken: betterAuthSession.session.token,
    userId: betterAuthSession.user.id || betterAuthSession.session.userId,
    email,
    expiresIn: Math.max(0, expiresAt - now),
    expiresAt,
  };
}

export async function getBetterAuthSession(token: string) {
  return getBetterAuthApi().getSession({
    headers: createBearerHeaders(token),
    query: {
      disableCookieCache: true,
    },
  });
}

export async function refreshBetterAuthAppSession(token: string) {
  const session = await getBetterAuthSession(token);

  if (!session) {
    throw new ShelfError({
      cause: null,
      message: "Better Auth session was not found",
      label: "Auth",
      shouldBeCaptured: false,
    });
  }

  return mapBetterAuthSession(session);
}

export async function getBetterAuthSessionFromHeaders(headers: HeadersInit) {
  return getBetterAuthApi().getSession({
    headers: createRequestHeaders(headers),
    query: {
      disableCookieCache: true,
    },
  });
}

export async function signInWithBetterAuthEmail(
  email: string,
  password: string,
  callbackURL?: string
) {
  const result = await getBetterAuth().api.signInEmail({
    body: {
      callbackURL,
      email,
      password,
    },
  });

  const session = await getBetterAuthSession(result.token);

  if (!session) {
    throw new ShelfError({
      cause: null,
      message: "Better Auth sign-in did not produce a readable session",
      additionalData: { email },
      label: "Auth",
    });
  }

  return mapBetterAuthSession(session);
}

export async function signUpWithBetterAuthEmail(input: {
  email: string;
  password: string;
  name: string;
  callbackURL?: string;
}) {
  return getBetterAuth().api.signUpEmail({
    body: {
      callbackURL: input.callbackURL,
      email: input.email,
      name: input.name,
      password: input.password,
    },
  });
}

export async function signInWithBetterAuthOAuthProvider(input: {
  callbackURL: string;
  errorCallbackURL?: string;
  providerId: string;
}) {
  return getBetterAuthApi().signInWithOAuth2({
    body: {
      callbackURL: input.callbackURL,
      errorCallbackURL: input.errorCallbackURL,
      providerId: input.providerId,
    },
  });
}

export async function sendBetterAuthSignInOtp(email: string) {
  return getBetterAuthApi().sendVerificationOTP({
    body: {
      email,
      type: "sign-in",
    },
  });
}

export async function signInWithBetterAuthEmailOtp(email: string, otp: string) {
  const result = await getBetterAuthApi().signInEmailOTP({
    body: {
      email,
      otp,
    },
  });

  const session = await getBetterAuthSession(result.token);

  if (!session) {
    throw new ShelfError({
      cause: null,
      message: "Better Auth OTP sign-in did not produce a readable session",
      additionalData: { email },
      label: "Auth",
    });
  }

  return mapBetterAuthSession(session);
}

export async function requestBetterAuthPasswordResetOtp(email: string) {
  return getBetterAuthApi().requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
}

export async function resetBetterAuthPasswordWithOtp(
  email: string,
  otp: string,
  password: string
) {
  return getBetterAuthApi().resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password,
    },
  });
}

export async function requestBetterAuthEmailChange(
  token: string,
  newEmail: string
) {
  return getBetterAuthApi().requestEmailChangeEmailOTP({
    body: {
      newEmail,
    },
    headers: createBearerHeaders(token),
  });
}

export async function changeBetterAuthEmail(
  token: string,
  newEmail: string,
  otp: string
) {
  return getBetterAuthApi().changeEmailEmailOTP({
    body: {
      newEmail,
      otp,
    },
    headers: createBearerHeaders(token),
  });
}

export async function revokeBetterAuthOtherSessions(token: string) {
  return getBetterAuth().api.revokeOtherSessions({
    headers: createBearerHeaders(token),
  });
}

export async function signOutBetterAuthSession(token: string) {
  return getBetterAuth().api.signOut({
    headers: createBearerHeaders(token),
  });
}
