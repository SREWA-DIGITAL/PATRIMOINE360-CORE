import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface AuditTrialWelcomeProps {
  displayName?: string | null;
  email: string;
  firstName?: string | null;
  hasPaymentMethod: boolean;
}

type AuditTrialWelcomeContentProps = Omit<AuditTrialWelcomeProps, "email">;

export const sendAuditTrialWelcomeEmail = async ({
  email,
  firstName,
  hasPaymentMethod,
}: AuditTrialWelcomeProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.audit-trial-welcome",
      data: {
        firstName,
        hasPaymentMethod,
      },
    });
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message: "Something went wrong while sending the audit trial welcome email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const auditTrialWelcomeEmailText = ({
  firstName,
  hasPaymentMethod,
}: AuditTrialWelcomeContentProps) =>
  stripeTemplateText("billing.audit-trial-welcome", {
    firstName,
    hasPaymentMethod,
  });

export const auditTrialWelcomeEmailHtml = ({
  firstName,
  hasPaymentMethod,
}: AuditTrialWelcomeContentProps) =>
  stripeTemplateHtml("billing.audit-trial-welcome", {
    firstName,
    hasPaymentMethod,
  });
