import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_SESSION_KEY = "patrimoine360_auth_session";

export type MobileAuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
};

export type MobileAuthSession = {
  accessToken: string;
  user: MobileAuthUser;
};

let cachedSession: MobileAuthSession | null | undefined;

async function getItem(key: string) {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getStoredAuthSession() {
  if (cachedSession !== undefined) {
    return cachedSession;
  }

  const rawSession = await getItem(AUTH_SESSION_KEY);
  if (!rawSession) {
    cachedSession = null;
    return null;
  }

  try {
    cachedSession = JSON.parse(rawSession) as MobileAuthSession;
    return cachedSession;
  } catch {
    cachedSession = null;
    await removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export async function getStoredAccessToken() {
  const session = await getStoredAuthSession();
  return session?.accessToken ?? null;
}

export async function saveAuthSession(session: MobileAuthSession) {
  cachedSession = session;
  await setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function clearAuthSession() {
  cachedSession = null;
  await removeItem(AUTH_SESSION_KEY);
}
