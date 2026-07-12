import { emailTemplateCatalog } from "~/emails/template-registry.server";
import type { InviteWithInviterAndOrg } from "./types";

export function generateRandomCode(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}

export const inviteEmailText = ({
  invite,
  token,
  extraMessage,
}: {
  invite: InviteWithInviterAndOrg;
  token: string;
  extraMessage?: string | null;
}) =>
  emailTemplateCatalog["invite.workspace"].text({
    invite,
    token,
    extraMessage,
  });

export function splitName(fullName?: string | null): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (fullName ?? "").trim();
  const spaceIndex = trimmed.indexOf(" ");

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: "" };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  };
}

export const revokeAccessEmailText = ({
  orgName,
  customEmailFooter,
}: {
  orgName: string;
  customEmailFooter?: string | null;
}) =>
  emailTemplateCatalog["team.access-revoked"].text({
    orgName,
    customEmailFooter,
    recipientEmail: "",
  });

export const roleChangeEmailText = ({
  orgName,
  previousRole,
  newRole,
  customEmailFooter,
}: {
  orgName: string;
  previousRole: string;
  newRole: string;
  customEmailFooter?: string | null;
}) =>
  emailTemplateCatalog["team.role-changed"].text({
    orgName,
    previousRole,
    newRole,
    customEmailFooter,
    recipientEmail: "",
  });
