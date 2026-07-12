import { clearAuthSession, getStoredAccessToken } from "../auth-storage";

/**
 * Base URL for the Patrimoine360 API.
 * In development, this is your local dev server.
 * In production, this would be the deployed webapp URL.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
if (__DEV__) console.log("[API] Base URL:", API_BASE_URL);

/**
 * Global auth error listener.
 * Screens can subscribe to be notified when the session expires
 * so they can redirect to the login screen.
 */
type AuthErrorListener = () => void;
const authErrorListeners = new Set<AuthErrorListener>();
export function onAuthError(listener: AuthErrorListener): () => void {
  authErrorListeners.add(listener);
  return () => authErrorListeners.delete(listener);
}
export function notifyAuthError() {
  authErrorListeners.forEach((fn) => fn());
}

/** Default request timeout (20 seconds -- generous for first cold-start request) */
const REQUEST_TIMEOUT_MS = 20_000;

/** Max automatic retries for timeout/network errors */
const MAX_RETRIES = 1;

/** Returns the current Better Auth bearer token from secure storage. */
export async function getAccessToken(): Promise<string | null> {
  return getStoredAccessToken();
}

/**
 * Makes an authenticated API call to the Patrimoine360 API.
 * Automatically attaches the current Better Auth bearer token.
 * - Returns structured { data, error } -- never throws.
 * - Detects 401/session-expired and notifies global auth listeners.
 * - Enforces a request timeout to avoid hanging on slow networks.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retryCount = 0
): Promise<{ data: T | null; error: string | null }> {
  // Declared outside try so catch block can read it
  let timedOut = false;

  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      notifyAuthError();
      return { data: null, error: "Session expired. Please sign in again." };
    }

    const url = `${API_BASE_URL}${path}`;
    if (__DEV__)
      console.log(
        "[API] Fetching:",
        url,
        _retryCount > 0 ? `(retry ${_retryCount})` : ""
      );

    // Abort controller for timeout — tag it so we can distinguish
    // timeout aborts from user/navigation aborts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    // If caller provided a signal (e.g. from useEffect cleanup), chain it
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    // Safe JSON parsing — server may return HTML error pages or empty body
    let json: any;
    try {
      const text = await response.text();
      json = text ? JSON.parse(text) : null;
    } catch {
      if (!response.ok) {
        return { data: null, error: `Server error (${response.status})` };
      }
      return { data: null, error: "Invalid response from server" };
    }

    if (!response.ok) {
      // 401 = unauthenticated → session expired, redirect to login
      if (response.status === 401) {
        await clearAuthSession();
        notifyAuthError();
        return {
          data: null,
          error: "Session expired. Please sign in again.",
        };
      }
      // 403 = forbidden → user lacks permission, but session is valid
      if (response.status === 403) {
        return {
          data: null,
          error:
            json?.error?.message ||
            "You don't have permission to perform this action.",
        };
      }
      return {
        data: null,
        error: json?.error?.message || `Request failed (${response.status})`,
      };
    }

    return { data: json as T, error: null };
  } catch (err) {
    // Navigation/cleanup abort — silently return null (not an error)
    if (err instanceof Error && err.name === "AbortError" && !timedOut) {
      if (__DEV__) console.log("[API] Request cancelled (navigation):", path);
      return { data: null, error: null };
    }

    if (__DEV__) console.error("[API] Fetch error:", err);

    // Auto-retry on timeout or network errors (not on auth/permission errors)
    const isRetryable =
      (err instanceof Error && err.name === "AbortError" && timedOut) ||
      err instanceof TypeError; // TypeError = network failure
    if (isRetryable && _retryCount < MAX_RETRIES) {
      if (__DEV__) console.log("[API] Retrying…", path);
      return apiFetch<T>(path, options, _retryCount + 1);
    }

    if (err instanceof Error && err.name === "AbortError") {
      return { data: null, error: "Request timed out. Check your connection." };
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network request failed",
    };
  }
}

/**
 * Makes an authenticated multipart upload to the Patrimoine360 API.
 * Used for image uploads where we send FormData instead of JSON.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<{ data: T | null; error: string | null }> {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      notifyAuthError();
      return { data: null, error: "Session expired. Please sign in again." };
    }

    const url = `${API_BASE_URL}${path}`;
    if (__DEV__) console.log("[API] Uploading to:", url);

    // Abort controller for timeout (longer than regular fetch for uploads)
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS * 4
    );

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Do NOT set Content-Type — fetch auto-sets it with the multipart boundary
      },
      body: formData,
    });
    clearTimeout(timeoutId);

    // Safe JSON parsing — server may return HTML error pages or empty body
    let json: any;
    try {
      const text = await response.text();
      json = text ? JSON.parse(text) : null;
    } catch {
      if (!response.ok) {
        return { data: null, error: `Upload failed (${response.status})` };
      }
      return { data: null, error: "Invalid response from server" };
    }

    if (!response.ok) {
      if (response.status === 401) {
        await clearAuthSession();
        notifyAuthError();
        return { data: null, error: "Session expired. Please sign in again." };
      }
      if (response.status === 403) {
        return {
          data: null,
          error:
            json?.error?.message ||
            "You don't have permission to perform this action.",
        };
      }
      return {
        data: null,
        error: json?.error?.message || `Upload failed (${response.status})`,
      };
    }

    return { data: json as T, error: null };
  } catch (err) {
    if (__DEV__) console.error("[API] Upload error:", err);
    if (err instanceof Error && err.name === "AbortError") {
      return { data: null, error: "Upload timed out. Check your connection." };
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}
