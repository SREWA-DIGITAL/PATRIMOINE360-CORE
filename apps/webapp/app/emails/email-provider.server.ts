import {
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
  EMAIL_REPLY_TO,
  EMAIL_REPLY_TO_NAME,
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
  const senderEmail = BREVO_SENDER_EMAIL?.trim() || SUPPORT_EMAIL?.trim();

  if (!senderEmail) {
    throw new ShelfError({
      cause: null,
      message:
        "BREVO_SENDER_EMAIL or SUPPORT_EMAIL is required when EMAIL_PROVIDER is set to brevo",
      label: "Email",
      shouldBeCaptured: false,
    });
  }

  if (BREVO_SENDER_NAME?.trim()) {
    return `"${BREVO_SENDER_NAME.trim()}" <${senderEmail}>`;
  }

  return `"Patrimoine360" <${senderEmail}>`;
}

function getDefaultReplyTo() {
  const replyToEmail = EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL?.trim();

  if (!replyToEmail) {
    return undefined;
  }

  if (EMAIL_REPLY_TO_NAME?.trim()) {
    return `"${EMAIL_REPLY_TO_NAME.trim()}" <${replyToEmail}>`;
  }

  return replyToEmail;
}

export async function deliverEmail(payload: EmailPayloadType) {
  const provider = resolveEmailProvider();
  const resolvedPayload: EmailPayloadType = {
    ...payload,
    from:
      payload.from ||
      (provider === "brevo"
        ? getBrevoDefaultSender()
        : SMTP_FROM || '"Patrimoine360" <hello@example.com>'),
    replyTo: payload.replyTo || getDefaultReplyTo(),
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
