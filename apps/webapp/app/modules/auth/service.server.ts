import type { AuthSession } from "@server/session";
import { config } from "~/config/shelf.config";
import { db } from "~/database/db.server";
import { sendEmail } from "~/emails/mail.server";
import { SERVER_URL } from "~/utils/env";

import type { ErrorLabel } from "~/utils/error";
import { isLikeShelfError, ShelfError } from "~/utils/error";
import { assertEnterpriseFeature } from "~/utils/license";
import { Logger } from "~/utils/logger";
import {
  getAuthErrorCode,
  getAuthErrorMessage,
  isAuthApiErrorLike,
  isRetryableAuthError,
} from "./auth-error-classifier.server";
import type { getAuthUserByAccessToken } from "./auth-provider.server";
import {
  createAuthUser,
  findAuthUserIdByEmail,
  generateAuthOtpCode,
  updateAuthUserById,
  verifyRecoveryOtpWithProvider,
} from "./auth-provider.server";
import {
  deleteBetterAuthUserIdentity,
  getBetterAuthProviderUserById,
  updateBetterAuthCredentialPassword,
  updateBetterAuthUserEmail,
} from "./better-auth-identity.server";
import {
  changeBetterAuthEmail,
  getBetterAuthErrorCode,
  getBetterAuthSession,
  isBetterAuthApiError,
  refreshBetterAuthAppSession,
  requestBetterAuthEmailChange,
  requestBetterAuthPasswordResetOtp,
  resetBetterAuthPasswordWithOtp,
  revokeBetterAuthOtherSessions,
  sendBetterAuthSignInOtp,
  signInWithBetterAuthEmail,
  signInWithBetterAuthEmailOtp,
  signInWithBetterAuthOAuthProvider,
  signUpWithBetterAuthEmail,
  signOutBetterAuthSession,
} from "./better-auth-session.server";
import { findBetterAuthSsoProviderByDomain } from "./better-auth.server";

const label: ErrorLabel = "Auth";
type AuthOtpMode = "login" | "signup" | "confirm_signup";
type EmailChangeOtpRequestResult =
  | { provider: "better-auth" }
  | { otp: string; provider: "supabase" };
type SessionValidationInput =
  | string
  | Pick<AuthSession, "provider" | "accessToken" | "refreshToken">;
type AuthAccessTokenResponse = Awaited<
  ReturnType<typeof getAuthUserByAccessToken>
>;

function mapBetterAuthAccessTokenResponse(
  session: NonNullable<Awaited<ReturnType<typeof getBetterAuthSession>>>
): AuthAccessTokenResponse {
  if (!session.user.email) {
    throw new ShelfError({
      cause: null,
      message: "Better Auth user should have an email",
      additionalData: {
        userId: session.user.id || session.session.userId,
      },
      label,
    });
  }

  return {
    data: {
      user: {
        id: session.user.id || session.session.userId,
        email: session.user.email,
      },
    },
    error: null,
  } as AuthAccessTokenResponse;
}

function getAuthSessionProvider(
  authSession: Pick<AuthSession, "provider"> | null | undefined
) {
  return authSession?.provider ?? "better-auth";
}

function getAuthSessionToken(input: SessionValidationInput) {
  if (typeof input === "string") {
    return {
      provider: "better-auth" as const,
      token: input,
    };
  }

  const provider = getAuthSessionProvider(input);

  return {
    provider,
    token: provider === "better-auth" ? input.accessToken : input.refreshToken,
  };
}

function getBetterAuthSignupName(email: string) {
  return email.split("@")[0] ?? email;
}

function buildSignupVerificationCallbackURL(
  email: string,
  redirectTo?: string | undefined
) {
  const params = new URLSearchParams({
    email,
    email_verified: "true",
  });

  if (redirectTo) {
    params.set("redirectTo", redirectTo);
  }

  return `${SERVER_URL}/login?${params.toString()}`;
}

function buildSsoCallbackURL(redirectTo?: string | undefined) {
  const callbackURL = new URL("/oauth/callback", SERVER_URL);

  if (redirectTo) {
    callbackURL.searchParams.set("redirectTo", redirectTo);
  }

  return callbackURL.toString();
}

function getAuthOtpModeCopy(mode: AuthOtpMode) {
  switch (mode) {
    case "login":
      return {
        headline: "Login code",
        intro: "To log in, please use the following one-time code:",
        subject: "Your login code",
        tags: ["auth", "otp", "login"],
      };
    case "signup":
      return {
        headline: "Create your account",
        intro:
          "To create your account, please use the following one-time code:",
        subject: "Your signup code",
        tags: ["auth", "otp", "signup"],
      };
    case "confirm_signup":
      return {
        headline: "Confirm your email",
        intro:
          "To confirm your email address, please use the following one-time code:",
        subject: "Confirm your email address",
        tags: ["auth", "otp", "confirm-signup"],
      };
  }
}

async function sendGeneratedAuthOtp(email: string, mode: AuthOtpMode) {
  const linkType = mode === "login" ? "magiclink" : "signup";
  const { otp, error } =
    mode === "login"
      ? await generateAuthOtpCode("magiclink", email)
      : await generateAuthOtpCode("signup", email);

  if (error) {
    throw error;
  }

  if (!otp) {
    throw new ShelfError({
      cause: null,
      message: "Auth provider did not return an email OTP",
      additionalData: { email, mode, linkType },
      label,
    });
  }

  const copy = getAuthOtpModeCopy(mode);

  sendEmail({
    to: email,
    subject: `${copy.subject}: ${otp}`,
    text: [
      copy.headline,
      "",
      copy.intro,
      otp,
      "",
      "Do not share this code with anyone.",
    ].join("\n"),
    html: [
      `<h2>${copy.headline}</h2>`,
      `<p>${copy.intro}</p>`,
      `<h2><b>${otp}</b></h2>`,
      "<p>Do not share this code with anyone.</p>",
    ].join(""),
    tags: copy.tags,
  });
}

export async function createEmailAuthAccount(email: string, password: string) {
  try {
    const { data, error } = await createAuthUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      throw error;
    }

    const { user } = data;

    return user;
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: "Failed to create email auth account",
      additionalData: { email },
      label,
    });
  }
}

/**
 * Looks up an existing Supabase auth account by email and confirms it.
 *
 * Used as a fallback during invite acceptance when `createEmailAuthAccount`
 * fails because the email already exists in Supabase (e.g. user signed up
 * but never confirmed their email). The invite JWT serves as proof of email
 * ownership, making direct confirmation safe.
 *
 * @returns The confirmed auth user, or `null` if no auth account exists
 *          for the given email.
 */
export async function confirmExistingAuthAccount(
  email: string,
  password: string
) {
  try {
    const authUserId = await findAuthUserIdByEmail(email);

    if (!authUserId) {
      return null;
    }

    const { data, error } = await updateAuthUserById(authUserId, {
      email_confirm: true,
      password,
    });

    if (error) {
      throw error;
    }

    return data.user;
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: "Failed to confirm existing auth account",
      additionalData: { email },
      label,
    });
  }
}

export async function signUpWithEmailPass(email: string, password: string) {
  try {
    const { data, error } = await createAuthUser({
      email: email,
      password: password,
      email_confirm: false,
      user_metadata: {
        signup_method: "email-password",
      },
    });

    if (error) {
      throw error;
    }

    const { user } = data;

    if (!user) {
      throw new ShelfError({
        cause: null,
        message: "The user returned by Supabase is null",
        label,
      });
    }

    await sendGeneratedAuthOtp(email, "confirm_signup");

    return user;
  } catch (cause) {
    const isRateLimitError =
      isAuthApiErrorLike(cause) &&
      (cause.status === 429 ||
        cause.message.includes("request this after 5 seconds"));
    const isTransientFetchError = isRetryableAuthError(cause);
    /** Supabase can return transient database errors during user creation
     * that resolve on retry — suppress these from Sentry. */
    const isDatabaseError =
      isAuthApiErrorLike(cause) && cause.message.includes("Database error");
    const message = isRateLimitError
      ? "You're trying too fast. Please wait a few seconds and try again."
      : "Something went wrong, refresh page and try to signup again.";
    throw new ShelfError({
      cause,
      message,
      additionalData: { email },
      label,
      shouldBeCaptured: !(
        isRateLimitError ||
        isTransientFetchError ||
        isDatabaseError
      ),
    });
  }
}

export async function signUpWithBetterAuthEmailPass(
  email: string,
  password: string,
  redirectTo?: string
) {
  try {
    const normalizedEmail = email.toLowerCase();
    const callbackURL = buildSignupVerificationCallbackURL(
      normalizedEmail,
      redirectTo
    );
    const { user } = await signUpWithBetterAuthEmail({
      callbackURL,
      email: normalizedEmail,
      name: getBetterAuthSignupName(normalizedEmail),
      password,
    });

    if (!user) {
      throw new ShelfError({
        cause: null,
        message: "The user returned by Better Auth is null",
        label,
      });
    }

    return user;
  } catch (cause) {
    const betterAuthErrorCode = getBetterAuthErrorCode(cause);
    const isBetterAuthDuplicateEmail =
      betterAuthErrorCode === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";
    const message = isBetterAuthDuplicateEmail
      ? "User with this Email already exits, login instead"
      : "Something went wrong, refresh page and try to signup again.";

    throw new ShelfError({
      cause,
      message,
      additionalData: { email },
      label,
      shouldBeCaptured: !isBetterAuthDuplicateEmail,
      status: isBetterAuthDuplicateEmail ? 409 : undefined,
    });
  }
}

function createBetterAuthEmailNotVerifiedError(
  email: string,
  redirectTo?: string
) {
  return new ShelfError({
    cause: null,
    message:
      "Check your inbox and click the verification link before logging in.",
    additionalData: {
      authState: "email-not-verified",
      email,
      redirectTo,
    },
    label,
    shouldBeCaptured: false,
    status: 403,
  });
}

function getBetterAuthOtpErrorState(cause: unknown) {
  const betterAuthErrorCode = getBetterAuthErrorCode(cause);

  switch (betterAuthErrorCode) {
    case "INVALID_OTP":
    case "OTP_EXPIRED":
      return {
        message: "Invalid or expired verification code",
        shouldBeCaptured: false,
      };
    case "TOO_MANY_ATTEMPTS":
      return {
        message: "Too many attempts. Please request a new code and try again.",
        shouldBeCaptured: false,
      };
    default:
      return null;
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    await sendGeneratedAuthOtp(email, "confirm_signup");
  } catch (cause) {
    const isRateLimitError =
      getAuthErrorCode(cause) === "over_email_send_rate_limit";
    throw new ShelfError({
      cause,
      message:
        "Something went wrong while resending the verification email. Please try again later or contact support.",
      additionalData: { email },
      label,
      shouldBeCaptured: !isRateLimitError,
    });
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
  redirectTo?: string
): Promise<AuthSession | null> {
  try {
    const normalizedEmail = email.toLowerCase();
    return await signInWithBetterAuthEmail(
      normalizedEmail,
      password,
      buildSignupVerificationCallbackURL(normalizedEmail, redirectTo)
    );
  } catch (cause) {
    const betterAuthErrorCode = getBetterAuthErrorCode(cause);
    if (betterAuthErrorCode === "EMAIL_NOT_VERIFIED") {
      throw createBetterAuthEmailNotVerifiedError(
        email.toLowerCase(),
        redirectTo
      );
    }

    const isInvalidCredentials =
      isAuthApiErrorLike(cause) &&
      cause.message === "Invalid login credentials";
    const isBetterAuthInvalidCredentials =
      betterAuthErrorCode === "INVALID_EMAIL_OR_PASSWORD";
    // Supabase 504s and intermittent fetch failures surface as
    // `AuthRetryableFetchError`. They resolve on retry and shouldn't page us.
    const isTransientFetchError = isRetryableAuthError(cause);
    // "Database error finding user" / similar transient backend hiccups.
    const isDatabaseError =
      isAuthApiErrorLike(cause) && cause.message.includes("Database error");
    const isRateLimitError = isAuthApiErrorLike(cause) && cause.status === 429;

    const message =
      isInvalidCredentials || isBetterAuthInvalidCredentials
        ? "Incorrect email or password"
        : "Something went wrong. Please try again later or contact support.";

    throw new ShelfError({
      cause,
      message,
      label,
      shouldBeCaptured: !(
        isInvalidCredentials ||
        isBetterAuthInvalidCredentials ||
        isTransientFetchError ||
        isDatabaseError ||
        isRateLimitError
      ),
    });
  }
}

export async function signInWithSSO(domain: string, redirectTo?: string) {
  if (!config.license.isEnterprise) {
    assertEnterpriseFeature("SSO", config.license.type);
  }

  if (config.disableSSO) {
    throw new ShelfError({
      cause: null,
      title: "SSO is disabled",
      message:
        "For more information, please contact your workspace administrator.",
      label,
      status: 403,
      shouldBeCaptured: false,
    });
  }

  try {
    const betterAuthSsoProvider = findBetterAuthSsoProviderByDomain(domain);

    if (!betterAuthSsoProvider) {
      throw new ShelfError({
        cause: null,
        message: "No SSO provider assigned for your organization's domain",
        additionalData: { domain },
        label,
        shouldBeCaptured: false,
        status: 404,
      });
    }

    const result = await signInWithBetterAuthOAuthProvider({
      callbackURL: buildSsoCallbackURL(redirectTo),
      providerId: betterAuthSsoProvider.providerId,
    });

    return result.url;
  } catch (cause) {
    let message =
      "Something went wrong. Please try again later or contact support.";
    let shouldBeCaptured = true;

    if (isLikeShelfError(cause) && cause.shouldBeCaptured === false) {
      message = "No SSO provider assigned for your organization's domain";
      shouldBeCaptured = false;
    }

    throw new ShelfError({
      cause,
      message,
      label,
      shouldBeCaptured,
      additionalData: { domain },
    });
  }
}

/**
 * Helper function to check if user is SSO-only and throw appropriate error
 * @param email User's email address
 * @throws ShelfError if user exists and is SSO-only
 */
async function validateNonSSOUser(email: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { sso: true },
  });

  if (user?.sso) {
    throw new ShelfError({
      cause: null,
      title: "SSO User",
      message:
        "This email address is associated with an SSO account. Please use SSO login instead.",
      additionalData: { email },
      label: "Auth",
      shouldBeCaptured: false,
    });
  }
}

export async function sendOTP(email: string, mode: AuthOtpMode = "login") {
  try {
    const normalizedEmail = email.toLowerCase();

    await validateNonSSOUser(normalizedEmail);

    if (mode === "login") {
      await sendBetterAuthSignInOtp(normalizedEmail);
      return;
    }

    await sendGeneratedAuthOtp(normalizedEmail, mode);
  } catch (cause) {
    // Read `code` via narrowing instead of `@ts-expect-error` — `cause` is
    // `unknown`, and a bare property access would throw at runtime if it
    // were null/undefined.
    const errorCode = getAuthErrorCode(cause);
    // Match `signInWithEmail`'s rate-limit handling: cover both the
    // Supabase OTP-specific `over_email_send_rate_limit` code and the
    // generic HTTP 429 `AuthApiError` (which can carry a different code).
    const isRateLimitError =
      errorCode === "over_email_send_rate_limit" ||
      (isAuthApiErrorLike(cause) && cause.status === 429) ||
      (isBetterAuthApiError(cause) && cause.status === 429);
    // Supabase 504s and intermittent fetch failures resolve on retry.
    const isTransientFetchError = isRetryableAuthError(cause);
    // "Database error finding user" — Supabase backend hiccup, not actionable.
    const isDatabaseError =
      isAuthApiErrorLike(cause) && cause.message.includes("Database error");
    // SSO-mismatch / similar `validateNonSSOUser` rejections already opt out
    // via their own `shouldBeCaptured: false` — preserve that decision.
    const inheritedShouldBeCaptured = isLikeShelfError(cause)
      ? cause.shouldBeCaptured
      : undefined;

    const fallbackMessage =
      "Something went wrong while sending the OTP. Please try again later or contact support.";

    // AuthRetryableFetchError (e.g. from 504 timeout) can have "{}" as message,
    // so we validate the message is actually useful before showing it to users
    const providerMessage =
      getAuthErrorMessage(cause) ||
      (isBetterAuthApiError(cause) ? cause.message : undefined);

    throw new ShelfError({
      cause,
      message: providerMessage ?? fallbackMessage,
      additionalData: { email: email.toLowerCase(), mode },
      label,
      shouldBeCaptured:
        inheritedShouldBeCaptured === false
          ? false
          : !(isRateLimitError || isTransientFetchError || isDatabaseError),
    });
  }
}

export async function sendResetPasswordLink(email: string) {
  try {
    const normalizedEmail = email.toLowerCase();
    await validateNonSSOUser(normalizedEmail);
    await requestBetterAuthPasswordResetOtp(normalizedEmail);
  } catch (cause) {
    const isRateLimitError =
      (isAuthApiErrorLike(cause) && cause.status === 429) ||
      (isBetterAuthApiError(cause) && cause.status === 429);

    throw new ShelfError({
      cause,
      message:
        "Something went wrong while sending the reset password link. Please try again later or contact support.",
      additionalData: { email: email.toLowerCase() },
      label,
      shouldBeCaptured: !isRateLimitError,
    });
  }
}

export async function requestEmailChangeOtp(
  authSession: AuthSession,
  newEmail: string
): Promise<EmailChangeOtpRequestResult> {
  try {
    const normalizedNewEmail = newEmail.toLowerCase();
    await requestBetterAuthEmailChange(
      authSession.accessToken,
      normalizedNewEmail
    );

    return {
      provider: "better-auth",
    };
  } catch (cause) {
    if (isLikeShelfError(cause)) {
      throw cause;
    }

    throw new ShelfError({
      cause,
      message: "Failed to initiate email change",
      additionalData: {
        currentEmail: authSession.email.toLowerCase(),
        newEmail: newEmail.toLowerCase(),
        provider: getAuthSessionProvider(authSession),
      },
      label,
    });
  }
}

export async function verifyEmailChangeOtp(
  authSession: AuthSession,
  newEmail: string,
  otp: string
) {
  try {
    const normalizedNewEmail = newEmail.toLowerCase();
    await changeBetterAuthEmail(
      authSession.accessToken,
      normalizedNewEmail,
      otp
    );
  } catch (cause) {
    if (isLikeShelfError(cause)) {
      throw cause;
    }

    throw new ShelfError({
      cause,
      message: "Invalid or expired verification code",
      additionalData: { email: newEmail.toLowerCase() },
      label: "Auth",
      shouldBeCaptured: false,
    });
  }
}

export async function revokeOtherSessions(
  authSessionOrAccessToken: AuthSession | string
) {
  try {
    const accessToken =
      typeof authSessionOrAccessToken === "string"
        ? authSessionOrAccessToken
        : authSessionOrAccessToken.accessToken;

    await revokeBetterAuthOtherSessions(accessToken);
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: "Failed to revoke the other active sessions",
      label,
    });
  }
}

export async function signOutCurrentAuthSession(authSession: AuthSession) {
  if (getAuthSessionProvider(authSession) !== "better-auth") {
    return;
  }

  try {
    await signOutBetterAuthSession(authSession.accessToken);
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: "Failed to revoke the current Better Auth session",
      label,
    });
  }
}

export async function setAuthUserEmail(userId: string, email: string) {
  return updateBetterAuthUserEmail(userId, email);
}

export async function softDeleteAuthUser(userId: string) {
  return deleteBetterAuthUserIdentity(userId);
}

export async function updateAccountPassword(
  id: string,
  password: string,
  accessToken?: string | undefined
) {
  try {
    const user = await db.user.findFirst({
      where: { id },
      select: {
        sso: true,
      },
    });
    if (user?.sso) {
      throw new ShelfError({
        cause: null,
        message: "You cannot update the password of an SSO user.",
        label,
      });
    }
    //logout all the others session expect the current sesssion.
    if (accessToken) {
      await revokeOtherSessions(accessToken);
    }
    await updateBetterAuthCredentialPassword(id, password);
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Something went wrong while updating the password. Please try again later or contact support.",
      additionalData: { id },
      label,
    });
  }
}

export async function deleteAuthAccount(userId: string) {
  try {
    const { error } = await deleteBetterAuthUserIdentity(userId);

    if (error) {
      throw error;
    }
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message:
          "Something went wrong while deleting the auth account. Please manually delete the user account in the Supabase dashboard.",
        additionalData: { userId },
        label,
      })
    );
  }
}

export async function getAuthUserById(userId: string) {
  try {
    const user = await getBetterAuthProviderUserById(userId);

    if (!user) {
      throw new ShelfError({
        cause: null,
        message: "Auth user was not found",
        additionalData: { userId },
        label,
        shouldBeCaptured: false,
        status: 404,
      });
    }

    return user;
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Something went wrong while getting the auth user by id. Please try again later or contact support.",
      additionalData: { userId },
      label,
    });
  }
}

export async function getAuthResponseByAccessToken(accessToken: string) {
  try {
    const betterAuthSession = await getBetterAuthSession(accessToken);

    if (!betterAuthSession) {
      return {
        data: {
          user: null,
        },
        error: null,
      };
    }

    return mapBetterAuthAccessTokenResponse(betterAuthSession);
  } catch (cause) {
    if (isBetterAuthApiError(cause)) {
      return {
        data: {
          user: null,
        },
        error: cause,
      };
    }

    throw new ShelfError({
      cause,
      message:
        "Something went wrong while getting the auth response by access token. Please try again later or contact support.",
      label,
    });
  }
}

export async function validateSession(input: SessionValidationInput) {
  try {
    const { token } = getAuthSessionToken(input);

    if (!token) {
      return false;
    }

    const session = await getBetterAuthSession(token);

    return Boolean(session);
  } catch (_err) {
    Logger.error(
      new ShelfError({
        cause: null,
        message: "Something went wrong while valdiating the session",
        label,
        shouldBeCaptured: false,
      })
    );
    return false;
  }
}

export async function refreshAccessToken(
  authSessionOrRefreshToken?: AuthSession | string
): Promise<AuthSession> {
  try {
    const accessToken =
      typeof authSessionOrRefreshToken === "string"
        ? authSessionOrRefreshToken
        : authSessionOrRefreshToken?.accessToken;

    if (!accessToken) {
      throw new ShelfError({
        cause: null,
        message: "Access token is required",
        label,
      });
    }

    return await refreshBetterAuthAppSession(accessToken);
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Unable to refresh access token. Please try again. If the issue persists, contact support",
      label,
      additionalData: {
        accessToken:
          typeof authSessionOrRefreshToken === "string"
            ? authSessionOrRefreshToken
            : authSessionOrRefreshToken?.accessToken,
      },
    });
  }
}

export async function verifyAuthSession(authSession: AuthSession) {
  try {
    const session = await getBetterAuthSession(authSession.accessToken);

    return Boolean(session);
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Something went wrong while verifying the auth session. Please try again later or contact support.",
      label,
    });
  }
}

export async function verifyOtpAndSignin(email: string, otp: string) {
  try {
    const normalizedEmail = email.toLowerCase();
    return await signInWithBetterAuthEmailOtp(normalizedEmail, otp);
  } catch (cause) {
    let message =
      "Something went wrong. Please try again later or contact support.";
    let shouldBeCaptured = true;

    const betterAuthOtpError = getBetterAuthOtpErrorState(cause);
    const providerMessage = getAuthErrorMessage(cause);

    if (betterAuthOtpError) {
      message = betterAuthOtpError.message;
      shouldBeCaptured = betterAuthOtpError.shouldBeCaptured;
    } else if (isBetterAuthApiError(cause) && cause.message) {
      message = cause.message;
      shouldBeCaptured = false;
    }

    if (isAuthApiErrorLike(cause) && providerMessage) {
      message = providerMessage;
      shouldBeCaptured = false;
    }

    throw new ShelfError({
      cause,
      message,
      label,
      shouldBeCaptured,
      additionalData: { email: email.toLowerCase() },
    });
  }
}

export async function verifyRecoveryOtp(email: string, otp: string) {
  try {
    const { data, error } = await verifyRecoveryOtpWithProvider(email, otp);

    if (error || !data.user || !data.session) {
      throw new ShelfError({
        cause: error,
        message: "Invalid or expired verification code",
        additionalData: { email },
        label,
        shouldBeCaptured: false,
      });
    }

    return {
      userId: data.user.id,
      accessToken: data.session.access_token,
    };
  } catch (cause) {
    if (isLikeShelfError(cause)) {
      throw cause;
    }

    throw new ShelfError({
      cause,
      message: "Invalid or expired verification code",
      additionalData: { email },
      label,
      shouldBeCaptured: false,
    });
  }
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  password: string
) {
  try {
    const normalizedEmail = email.toLowerCase();
    await resetBetterAuthPasswordWithOtp(normalizedEmail, otp, password);
  } catch (cause) {
    const betterAuthOtpError = getBetterAuthOtpErrorState(cause);

    if (betterAuthOtpError) {
      throw new ShelfError({
        cause,
        message: betterAuthOtpError.message,
        additionalData: { email: email.toLowerCase() },
        label,
        shouldBeCaptured: betterAuthOtpError.shouldBeCaptured,
      });
    }

    if (isLikeShelfError(cause)) {
      throw cause;
    }

    throw new ShelfError({
      cause,
      message: "Invalid or expired verification code",
      additionalData: { email: email.toLowerCase() },
      label,
      shouldBeCaptured: false,
    });
  }
}
