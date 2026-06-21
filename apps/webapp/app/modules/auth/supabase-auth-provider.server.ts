import { getSupabaseAdmin } from "~/integrations/supabase/client";

export async function generateAuthLink(
  type: "magiclink" | "signup",
  email: string
) {
  return getSupabaseAdmin().auth.admin.generateLink({
    type,
    email,
  });
}

export async function generateRecoveryLink(email: string) {
  return getSupabaseAdmin().auth.admin.generateLink({
    type: "recovery",
    email,
  });
}

export async function generateEmailChangeLink(email: string, newEmail: string) {
  return getSupabaseAdmin().auth.admin.generateLink({
    type: "email_change_new",
    email,
    newEmail,
  });
}

function extractEmailOtp(
  response:
    | Awaited<ReturnType<typeof generateAuthLink>>
    | Awaited<ReturnType<typeof generateRecoveryLink>>
    | Awaited<ReturnType<typeof generateEmailChangeLink>>
) {
  return response.data.properties.email_otp ?? null;
}

export async function generateAuthOtpCode(
  type: "magiclink" | "signup",
  email: string
) {
  const response = await generateAuthLink(type, email);

  return {
    otp: extractEmailOtp(response),
    error: response.error,
  };
}

export async function generateRecoveryOtpCode(email: string) {
  const response = await generateRecoveryLink(email);

  return {
    otp: extractEmailOtp(response),
    error: response.error,
  };
}

export async function generateEmailChangeOtpCode(
  email: string,
  newEmail: string
) {
  const response = await generateEmailChangeLink(email, newEmail);

  return {
    otp: extractEmailOtp(response),
    error: response.error,
  };
}

export async function createAuthUser(args: {
  email: string;
  password: string;
  email_confirm: boolean;
  user_metadata?: Record<string, unknown>;
}) {
  return getSupabaseAdmin().auth.admin.createUser(args);
}

export async function updateAuthUserById(
  userId: string,
  attributes: {
    email_confirm?: boolean;
    password?: string;
    email?: string;
  }
) {
  return getSupabaseAdmin().auth.admin.updateUserById(userId, attributes);
}

export async function signInWithPassword(email: string, password: string) {
  return getSupabaseAdmin().auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithSSO(domain: string, redirectTo: string) {
  return getSupabaseAdmin().auth.signInWithSSO({
    domain,
    options: {
      redirectTo,
    },
  });
}

export async function signOutOtherSessions(accessToken: string) {
  return getSupabaseAdmin().auth.admin.signOut(accessToken, "others");
}

export async function deleteAuthUser(userId: string, shouldSoftDelete = false) {
  return getSupabaseAdmin().auth.admin.deleteUser(userId, shouldSoftDelete);
}

export async function getAuthUserByIdFromProvider(userId: string) {
  return getSupabaseAdmin().auth.admin.getUserById(userId);
}

export async function getAuthUserByAccessToken(accessToken: string) {
  return getSupabaseAdmin().auth.getUser(accessToken);
}

export async function refreshAuthSession(refreshToken: string) {
  return getSupabaseAdmin().auth.refreshSession({
    refresh_token: refreshToken,
  });
}

export async function verifyEmailOtp(email: string, token: string) {
  return getSupabaseAdmin().auth.verifyOtp({
    email,
    token,
    type: "email",
  });
}

export async function verifyRecoveryOtpWithProvider(
  email: string,
  token: string
) {
  return getSupabaseAdmin().auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
}

export async function verifyEmailChangeOtpWithProvider(
  email: string,
  token: string
) {
  return getSupabaseAdmin().auth.verifyOtp({
    email,
    token,
    type: "email_change",
  });
}
