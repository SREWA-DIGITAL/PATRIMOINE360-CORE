import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMobileSession,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  signInWithEmail,
  signOutWithToken,
} from "./auth-client";
import {
  clearAuthSession,
  getStoredAuthSession,
  saveAuthSession,
  type MobileAuthSession,
  type MobileAuthUser,
} from "./auth-storage";
import { onAuthError } from "./api/client";

type AuthState = {
  session: MobileAuthSession | null;
  user: MobileAuthUser | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  confirmPasswordReset: (
    email: string,
    otp: string,
    password: string
  ) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MobileAuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getStoredAuthSession()
      .then(async (storedSession) => {
        if (!storedSession) return null;

        const verifiedSession = await fetchMobileSession(
          storedSession.accessToken
        );

        if (verifiedSession.error || !verifiedSession.data) {
          await clearAuthSession();
          return null;
        }

        await saveAuthSession(verifiedSession.data);
        return verifiedSession.data;
      })
      .catch((err) => {
        if (__DEV__) console.error("Failed to restore session:", err);
        clearAuthSession();
      })
      .then((restoredSession) => {
        if (isMounted) setSession(restoredSession ?? null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = onAuthError(async () => {
      await clearAuthSession();
      setSession(null);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await signInWithEmail(email, password);

    if (error || !data) {
      return { error };
    }

    await saveAuthSession(data);
    setSession(data);

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const accessToken = session?.accessToken;

    await clearAuthSession();
    setSession(null);

    if (accessToken) {
      await signOutWithToken(accessToken);
    }
  }, [session?.accessToken]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await requestPasswordResetOtp(email);
    return { error };
  }, []);

  const confirmPasswordReset = useCallback(
    async (email: string, otp: string, password: string) => {
      const { error } = await resetPasswordWithOtp({
        email,
        otp,
        password,
      });
      return { error };
    },
    []
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signIn,
      signOut,
      resetPassword,
      confirmPasswordReset,
    }),
    [
      session,
      isLoading,
      signIn,
      signOut,
      resetPassword,
      confirmPasswordReset,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
