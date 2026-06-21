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
import {
  createAuthUser,
  deleteAuthUser,
  findAuthUserIdByEmail,
  generateAuthOtpCode,
  generateEmailChangeOtpCode,
  generateRecoveryOtpCode,
  getAuthUserByAccessToken,
  getAuthUserByIdFromProvider,
  isRefreshTokenActive,
  refreshAuthSession,
  signInWithPassword,
  signInWithSSO as signInWithSSOProvider,
  signOutOtherSessions,
  updateAuthUserById,
  verifyEmailChangeOtpWithProvider,
  verifyEmailOtp,
  verifyRecoveryOtpWithProvider,
} from "./auth-provider.server";
import { mapAuthSession } from "./mappers.server";

const label: ErrorLabel = "Auth";
type AuthOtpMode = "login" | "signup" | "confirm_signup";

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

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await signInWithPassword(email, password);

    if (error?.message === "Email not confirmed") {
      return null;
    }

    if (error) {
      throw error;
    }

    const { session } = data;

    return mapAuthSession(session);
  } catch (cause) {
    const isInvalidCredentials =
      isAuthApiErrorLike(cause) &&
      cause.message === "Invalid login credentials";
    // Supabase 504s and intermittent fetch failures surface as
    // `AuthRetryableFetchError`. They resolve on retry and shouldn't page us.
    const isTransientFetchError = isRetryableAuthError(cause);
    // "Database error finding user" / similar transient backend hiccups.
    const isDatabaseError =
      isAuthApiErrorLike(cause) && cause.message.includes("Database error");
    const isRateLimitError = isAuthApiErrorLike(cause) && cause.status === 429;

    const message = isInvalidCredentials
      ? "Incorrect email or password"
      : "Something went wrong. Please try again later or contact support.";

    throw new ShelfError({
      cause,
      message,
      label,
      shouldBeCaptured: !(
        isInvalidCredentials ||
        isTransientFetchError ||
        isDatabaseError ||
        isRateLimitError
      ),
    });
  }
}

export async function signInWithSSO(domain: string) {
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
    const { data, error } = await signInWithSSOProvider(
      domain,
      `${SERVER_URL}/oauth/callback`
    );

    if (error) {
      throw error;
    }

    return data.url;
  } catch (cause) {
    let message =
      "Something went wrong. Please try again later or contact support.";
    let shouldBeCaptured = true;

    if (getAuthErrorCode(cause) === "sso_provider_not_found") {
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
    await validateNonSSOUser(email);
    await sendGeneratedAuthOtp(email, mode);
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
      (isAuthApiErrorLike(cause) && cause.status === 429);
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
    const providerMessage = getAuthErrorMessage(cause);

    throw new ShelfError({
      cause,
      message: providerMessage ?? fallbackMessage,
      additionalData: { email, mode },
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
    await validateNonSSOUser(email);

    const { otp, error } = await generateRecoveryOtpCode(email);

    if (error) {
      throw error;
    }

    if (!otp) {
      throw new ShelfError({
        cause: null,
        message: "Auth provider did not return a recovery OTP",
        additionalData: { email },
        label,
      });
    }

    sendEmail({
      to: email,
      subject: `Reset password code: ${otp}`,
      text: [
        "Reset Password",
        "",
        "To reset your password, please use the following one-time code:",
        otp,
        "",
        "Do not share this code with anyone.",
      ].join("\n"),
      html: [
        "<h2>Reset Password</h2>",
        "<p>To reset your password, please use the following one-time code:</p>",
        `<h2><b>${otp}</b></h2>`,
        "<p>Do not share this code with anyone.</p>",
      ].join(""),
      tags: ["auth", "password-reset"],
    });
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Something went wrong while sending the reset password link. Please try again later or contact support.",
      additionalData: { email },
      label,
    });
  }
}

export async function requestEmailChangeOtp(
  currentEmail: string,
  newEmail: string
) {
  try {
    const { otp, error } = await generateEmailChangeOtpCode(
      currentEmail,
      newEmail
    );

    if (error) {
      const emailExists = getAuthErrorCode(error) === "email_exists";
      throw new ShelfError({
        cause: error,
        ...(emailExists && { title: "Email is already taken." }),
        message: emailExists
          ? "Please choose a different email address which is not already in use."
          : "Failed to initiate email change",
        additionalData: { currentEmail, newEmail },
        label: "Auth",
        shouldBeCaptured: !emailExists,
      });
    }

    if (!otp) {
      throw new ShelfError({
        cause: null,
        message: "Auth provider did not return an email change OTP",
        additionalData: { currentEmail, newEmail },
        label,
      });
    }

    return otp;
  } catch (cause) {
    if (isLikeShelfError(cause)) {
      throw cause;
    }

    throw new ShelfError({
      cause,
      message: "Failed to initiate email change",
      additionalData: { currentEmail, newEmail },
      label,
    });
  }
}

export async function verifyEmailChangeOtp(email: string, otp: string) {
  try {
    const { error } = await verifyEmailChangeOtpWithProvider(email, otp);

    if (error) {
      throw new ShelfError({
        cause: error,
        message: "Invalid or expired verification code",
        additionalData: { email },
        label: "Auth",
        shouldBeCaptured: false,
      });
    }
  } catch (cause) {
    if (isLikeShelfError(cause)) {
      throw cause;
    }

    throw new ShelfError({
      cause,
      message: "Invalid or expired verification code",
      additionalData: { email },
      label: "Auth",
      shouldBeCaptured: false,
    });
  }
}

export async function revokeOtherSessions(accessToken: string) {
  try {
    const { error } = await signOutOtherSessions(accessToken);

    if (error) {
      throw error;
    }
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: "Failed to revoke the other active sessions",
      label,
    });
  }
}

export async function setAuthUserEmail(userId: string, email: string) {
  return updateAuthUserById(userId, {
    email,
  });
}

export async function softDeleteAuthUser(userId: string) {
  return deleteAuthUser(userId, true);
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
      await signOutOtherSessions(accessToken);
    }
    //on password update, it is remvoing the session in th supbase.
    const { error } = await updateAuthUserById(id, {
      password,
    });

    if (error) {
      throw error;
    }
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
    const { error } = await deleteAuthUser(userId);

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
    const { data, error } = await getAuthUserByIdFromProvider(userId);

    if (error) {
      throw error;
    }

    const { user } = data;

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
    return await getAuthUserByAccessToken(accessToken);
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Something went wrong while getting the auth response by access token. Please try again later or contact support.",
      label,
    });
  }
}

export async function validateSession(token: string) {
  try {
    const isActive = await isRefreshTokenActive(token);

    if (!isActive) {
      //logging for debug
      Logger.error(
        new ShelfError({
          cause: null,
          message: "Refresh token is invalid or has been revoked",
          label,
          shouldBeCaptured: false,
        })
      );
    }
    return isActive;
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
  refreshToken?: string
): Promise<AuthSession> {
  try {
    if (!refreshToken) {
      throw new ShelfError({
        cause: null,
        message: "Refresh token is required",
        label,
      });
    }

    const { data, error } = await refreshAuthSession(refreshToken);

    if (error) {
      throw error;
    }

    const { session } = data;

    if (!session) {
      throw new ShelfError({
        cause: null,
        message: "The auth provider returned a null session",
        label,
      });
    }

    return mapAuthSession(session);
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Unable to refresh access token. Please try again. If the issue persists, contact support",
      label,
      additionalData: {
        refreshToken,
      },
    });
  }
}

export async function verifyAuthSession(authSession: AuthSession) {
  try {
    const authAccount = await getAuthResponseByAccessToken(
      authSession.accessToken
    );

    return Boolean(authAccount);
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
    const { data, error } = await verifyEmailOtp(email, otp);

    if (error) {
      throw error;
    }

    const { session } = data;

    if (!session) {
      throw new ShelfError({
        cause: null,
        message: "The auth provider returned a null session",
        label,
      });
    }

    return mapAuthSession(session);
  } catch (cause) {
    let message =
      "Something went wrong. Please try again later or contact support.";
    let shouldBeCaptured = true;

    const providerMessage = getAuthErrorMessage(cause);

    if (isAuthApiErrorLike(cause) && providerMessage) {
      message = providerMessage;
      shouldBeCaptured = false;
    }

    throw new ShelfError({
      cause,
      message,
      label,
      shouldBeCaptured,
      additionalData: { email },
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
