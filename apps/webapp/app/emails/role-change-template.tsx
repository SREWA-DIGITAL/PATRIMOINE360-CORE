import { emailTemplateCatalog } from "./template-registry.server";

interface Props {
  orgName: string;
  previousRole: string;
  newRole: string;
  recipientEmail: string;
  customEmailFooter?: string | null;
}

export function RoleChangeEmailTemplate(_props: Props) {
  return null;
}

/*
 * The HTML content of an email will be accessed by a server file to send
 * email, so we export the rendered HTML string.
 */
export const roleChangeTemplateString = (props: Props) =>
  emailTemplateCatalog["team.role-changed"].html(props);
