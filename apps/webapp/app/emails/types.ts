import type { Prisma } from "@prisma/client";
import type { BOOKING_INCLUDE_FOR_EMAIL } from "~/modules/booking/constants";

export type BookingForEmail = Prisma.BookingGetPayload<{
  include: typeof BOOKING_INCLUDE_FOR_EMAIL;
}>;

export type EmailPayloadType = {
  /** Email address of recipient */
  to: string;

  /** Subject of email */
  subject: string;

  /** Text content of email */
  text: string;

  /** HTML content of email */
  html?: string;

  /** Override the default sender */
  from?: string;

  /** Override the default reply to email address */
  replyTo?: string;

  /** Optional provider tags for delivery analytics */
  tags?: string[];

  /** Optional provider-specific headers */
  headers?: Record<string, string>;

  /** Optional provider template identifier */
  templateId?: number;

  /** Optional provider template parameters */
  params?: Record<string, unknown>;
};
