import type { InviteWithInviterAndOrg } from "~/modules/invite/types";
import { emailTemplateCatalog } from "./template-registry.server";

interface Props {
  invite: InviteWithInviterAndOrg;
  token: string;
  extraMessage?: string | null;
}

export function InvitationEmailTemplate(_props: Props) {
  return null;
}

/*
 * The HTML content of an email will be accessed by a server file to send
 * email, so we export the rendered HTML string.
 */
export const invitationTemplateString = ({
  token,
  invite,
  extraMessage,
}: Props) =>
  emailTemplateCatalog["invite.workspace"].html({
    token,
    invite,
    extraMessage,
  });
