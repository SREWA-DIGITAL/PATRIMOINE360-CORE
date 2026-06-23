import {
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
  EMAIL_PROVIDER,
  SMTP_FROM,
  SUPPORT_EMAIL,
} from "~/utils/env";
import { ShelfError } from "~/utils/error";
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

function getBrevoDefaultSender() {
  if (!BREVO_SENDER_EMAIL) {
    return SMTP_FROM || '"Shelf" <hello@example.com>';
  }

  if (BREVO_SENDER_NAME?.trim()) {
    return `"${BREVO_SENDER_NAME.trim()}" <${BREVO_SENDER_EMAIL}>`;
  }

  return BREVO_SENDER_EMAIL;
}

export async function deliverEmail(payload: EmailPayloadType) {
  const provider = resolveEmailProvider();
  const resolvedPayload: EmailPayloadType = {
    ...payload,
    from:
      payload.from ||
      (provider === "brevo"
        ? getBrevoDefaultSender()
        : SMTP_FROM || '"Shelf" <hello@example.com>'),
    replyTo: payload.replyTo || SUPPORT_EMAIL,
  };

  switch (provider) {
    case "brevo":
      await import("./brevo-email-provider.server").then((module) =>
        module.sendEmailWithBrevo(resolvedPayload)
      );
      return;
    case "smtp":
      await import("./smtp-email-provider.server").then((module) =>
        module.sendEmailWithSmtp(resolvedPayload)
      );
      return;
  }
}
