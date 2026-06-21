import { EMAIL_PROVIDER, SMTP_FROM, SUPPORT_EMAIL } from "~/utils/env";
import { ShelfError } from "~/utils/error";
import { sendEmailWithBrevo } from "./brevo-email-provider.server";
import { sendEmailWithSmtp } from "./smtp-email-provider.server";
import type { EmailPayloadType } from "./types";

export type EmailProviderName = "smtp" | "brevo";

export function resolveEmailProvider(): EmailProviderName {
  if (EMAIL_PROVIDER === "smtp" || EMAIL_PROVIDER === "brevo") {
    return EMAIL_PROVIDER;
  }

  throw new ShelfError({
    cause: null,
    message: `Unsupported EMAIL_PROVIDER value: ${EMAIL_PROVIDER}`,
    label: "Email",
  });
}

export async function deliverEmail(payload: EmailPayloadType) {
  const resolvedPayload: EmailPayloadType = {
    ...payload,
    from: payload.from || SMTP_FROM || '"Shelf" <hello@example.com>',
    replyTo: payload.replyTo || SUPPORT_EMAIL,
  };

  const provider = resolveEmailProvider();

  switch (provider) {
    case "brevo":
      await sendEmailWithBrevo(resolvedPayload);
      return;
    case "smtp":
      await sendEmailWithSmtp(resolvedPayload);
      return;
  }
}
