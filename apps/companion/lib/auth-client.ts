import { API_BASE_URL } from "./api/client";
import type { MeResponse } from "./api/types";
import type { MobileAuthSession } from "./auth-storage";

const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;

type BetterAuthUser = {
  id: string;
  email: string;
};

type SignInResponse = {
  token?: string;
  user?: BetterAuthUser;
  error?: {
    message?: string;
  };
  message?: string;
};

type BetterAuthResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const error = record.error;

    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim()) return message;
    }

    const message = record.message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}

async function postAuth<T>(
  path: string,
  body?: unknown,
  token?: string
): Promise<BetterAuthResult<{ response: Response; payload: T | null }>> {
  try {
    const response = await fetch(`${AUTH_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await readJson<T>(response);

    if (!response.ok) {
      return {
        data: null,
        error: getErrorMessage(payload, `Request failed (${response.status})`),
      };
    }

    return { data: { response, payload }, error: null };
  } catch (cause) {
    return {
      data: null,
      error:
        cause instanceof Error ? cause.message : "Network request failed",
    };
  }
}

export async function fetchMobileSession(
  accessToken: string
): Promise<BetterAuthResult<MobileAuthSession>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await readJson<MeResponse & { error?: { message?: string } }>(
      response
    );

    if (!response.ok || !payload?.user) {
      return {
        data: null,
        error: getErrorMessage(payload, "Session expired. Please sign in again."),
      };
    }

    return {
      data: {
        accessToken,
        user: payload.user,
      },
      error: null,
    };
  } catch (cause) {
    return {
      data: null,
      error:
        cause instanceof Error ? cause.message : "Network request failed",
    };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<BetterAuthResult<MobileAuthSession>> {
  const result = await postAuth<SignInResponse>("/sign-in/email", {
    email,
    password,
  });

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error || "Sign-in failed. Please try again.",
    };
  }

  const accessToken =
    result.data.response.headers.get("set-auth-token") ||
    result.data.payload?.token;

  if (!accessToken) {
    return {
      data: null,
      error: "Sign-in succeeded but no bearer token was returned.",
    };
  }

  return fetchMobileSession(accessToken);
}

export async function signOutWithToken(accessToken: string) {
  await postAuth("/sign-out", undefined, accessToken);
}

export async function requestPasswordResetOtp(email: string) {
  return postAuth<{ success: boolean }>("/email-otp/request-password-reset", {
    email,
  });
}

export async function resetPasswordWithOtp(input: {
  email: string;
  otp: string;
  password: string;
}) {
  return postAuth<{ success: boolean }>("/email-otp/reset-password", input);
}
