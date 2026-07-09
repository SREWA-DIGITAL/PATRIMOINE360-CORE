import {
  emailTemplateCatalog,
  sendTemplatedEmail,
  type EmailTemplateKey,
  type EmailTemplatePayloads,
} from "../template-registry.server";

type StripeTemplateKey =
  | "billing.audit-trial-ending-soon"
  | "billing.audit-trial-ending-tomorrow"
  | "billing.audit-trial-welcome"
  | "billing.barcode-trial-ending-soon"
  | "billing.barcode-trial-ending-tomorrow"
  | "billing.barcode-trial-welcome"
  | "billing.invoice-overdue"
  | "billing.invoice-payment-failed"
  | "billing.plan-trial-ending-soon"
  | "billing.subscription-activated"
  | "billing.team-trial-welcome";

function getTemplate<K extends StripeTemplateKey>(template: K) {
  return emailTemplateCatalog[template];
}

export function stripeTemplateText<K extends StripeTemplateKey>(
  template: K,
  data: EmailTemplatePayloads[K]
) {
  return getTemplate(template).text(data);
}

export async function stripeTemplateHtml<K extends StripeTemplateKey>(
  template: K,
  data: EmailTemplatePayloads[K]
) {
  return getTemplate(template).html(data);
}

export function stripeTemplateSubject<K extends StripeTemplateKey>(
  template: K,
  data: EmailTemplatePayloads[K]
) {
  return getTemplate(template).subject(data);
}

export async function sendStripeTemplatedEmail<K extends StripeTemplateKey>({
  data,
  to,
  template,
}: {
  data: EmailTemplatePayloads[K];
  template: K;
  to: string;
}) {
  return sendTemplatedEmail({
    to,
    template: template as EmailTemplateKey,
    data,
  });
}
