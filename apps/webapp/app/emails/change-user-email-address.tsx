import { emailTemplateCatalog } from "./template-registry.server";

/**
 * This is the text version of the change email address email.
 */
export const changeEmailAddressTextEmail = ({
  otp,
  user,
}: {
  otp: string;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
  };
}) => emailTemplateCatalog["auth.change-email-otp"].text({ otp, user });

/*
 * The HTML content of an email will be accessed by a server file to send
 * email, so we export the rendered HTML string.
 */
export const changeEmailAddressHtmlEmail = (
  otp: string,
  user: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email: string;
  }
) => emailTemplateCatalog["auth.change-email-otp"].html({ otp, user });
