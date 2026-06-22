import { BrevoClient, BrevoError } from "@getbrevo/brevo";
import { BREVO_API_KEY, BREVO_TIMEOUT_SECONDS } from "~/utils/env";
import { ShelfError } from "~/utils/error";
import type { EmailPayloadType } from "./types";

type MailboxAddress = {
  email: string;
  name?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __brevoClient__: BrevoClient | undefined;
}

const MAILBOX_PATTERN = /^(?:"?([^"]+)"?\s*)?<([^>]+)>$/;

function parseMailboxAddress(value: string): MailboxAddress {
  const trimmedValue = value.trim();
  const match = trimmedValue.match(MAILBOX_PATTERN);

  if (!match) {
    return { email: trimmedValue };
  }

  return {
    email: match[2].trim(),
    name: match[1]?.trim() || undefined,
  };
}

function getBrevoClient() {
  if (!BREVO_API_KEY) {
    throw new ShelfError({
      cause: null,
      message: "BREVO_API_KEY is required when EMAIL_PROVIDER is set to brevo",
      label: "Email",
      shouldBeCaptured: false,
    });
  }

  if (!global.__brevoClient__) {
    const parsedTimeout = Number.parseInt(BREVO_TIMEOUT_SECONDS || "", 10);

    global.__brevoClient__ = new BrevoClient({
      apiKey: BREVO_API_KEY,
      maxRetries: 3,
      ...(Number.isFinite(parsedTimeout) && parsedTimeout > 0
        ? { timeoutInSeconds: parsedTimeout }
        : {}),
    });
  }

  return global.__brevoClient__;
}

function getBrevoErrorMessage(cause: unknown) {
  if (cause instanceof BrevoError && cause.statusCode === 429) {
    return "Brevo rate limit reached while sending email";
  }

  if (cause instanceof BrevoError) {
    return `Brevo email delivery failed: ${cause.message}`;
  }

  return "Brevo email delivery failed";
}

export async function sendEmailWithBrevo({
  from = '"Shelf" <hello@example.com>',
  headers,
  html,
  params,
  replyTo,
  subject,
  tags,
  templateId,
  text,
  to,
}: EmailPayloadType) {
  try {
    const brevo = getBrevoClient();

    await brevo.transactionalEmails.sendTransacEmail({
      sender: parseMailboxAddress(from),
      to: [parseMailboxAddress(to)],
      ...(replyTo ? { replyTo: parseMailboxAddress(replyTo) } : {}),
      ...(subject ? { subject } : {}),
      ...(html ? { htmlContent: html } : {}),
      ...(text ? { textContent: text } : {}),
      ...(tags?.length ? { tags } : {}),
      ...(headers ? { headers } : {}),
      ...(templateId ? { templateId } : {}),
      ...(params ? { params } : {}),
    });
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: getBrevoErrorMessage(cause),
      additionalData: { to, subject, templateId, tags },
      label: "Email",
      shouldBeCaptured: !(
        cause instanceof BrevoError && cause.statusCode === 429
      ),
    });
  }
}

export { parseMailboxAddress };
