import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface AuditTrialEndsSoonProps {
  email: string;
  firstName?: string | null;
  hasPaymentMethod: boolean;
  trialEndDate: Date;
}

type AuditTrialEndsSoonContentProps = Omit<AuditTrialEndsSoonProps, "email">;

export const sendAuditTrialEndsSoonEmail = async ({
  email,
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: AuditTrialEndsSoonProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.audit-trial-ending-soon",
      data: {
        firstName,
        hasPaymentMethod,
        trialEndDate,
      },
    });
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message:
          "Something went wrong while sending the audit trial ending email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const auditTrialEndsSoonEmailText = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: AuditTrialEndsSoonContentProps) =>
  stripeTemplateText("billing.audit-trial-ending-soon", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });

export const auditTrialEndsSoonEmailHtml = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: AuditTrialEndsSoonContentProps) =>
  stripeTemplateHtml("billing.audit-trial-ending-soon", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });
