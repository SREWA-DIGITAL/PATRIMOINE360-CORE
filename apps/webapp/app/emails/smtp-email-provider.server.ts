import { transporter } from "~/emails/transporter.server";
import type { EmailPayloadType } from "./types";

export async function sendEmailWithSmtp({
  from,
  headers,
  html,
  replyTo,
  subject,
  text,
  to,
}: EmailPayloadType) {
  await transporter.sendMail({
    from,
    headers,
    html: html || "",
    replyTo,
    subject,
    text,
    to,
  });
}
