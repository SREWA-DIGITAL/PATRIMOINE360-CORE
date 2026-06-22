import {
  AuthError,
  type AuthApiError,
  isAuthApiError,
  isAuthRetryableFetchError,
} from "@supabase/supabase-js";

function isUsableErrorMessage(message: string) {
  return message !== "" && message !== "{}" && !message.startsWith("{");
}

export function isAuthApiErrorLike(error: unknown): error is AuthApiError {
  return isAuthApiError(error);
}

export function isRetryableAuthError(error: unknown) {
  return isAuthRetryableFetchError(error);
}

export function getAuthErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthError && isUsableErrorMessage(error.message)) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    isUsableErrorMessage(error.message)
  ) {
    return error.message;
  }

  return null;
}
