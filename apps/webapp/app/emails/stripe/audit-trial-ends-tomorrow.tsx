import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface AuditTrialEndsTomorrowProps {
  email: string;
  firstName?: string | null;
  hasPaymentMethod: boolean;
  trialEndDate: Date;
}

type AuditTrialEndsTomorrowContentProps = Omit<
  AuditTrialEndsTomorrowProps,
  "email"
>;

export const sendAuditTrialEndsTomorrowEmail = async ({
  email,
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: AuditTrialEndsTomorrowProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.audit-trial-ending-tomorrow",
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
          "Something went wrong while sending the audit trial ends tomorrow email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const auditTrialEndsTomorrowEmailText = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: AuditTrialEndsTomorrowContentProps) =>
  stripeTemplateText("billing.audit-trial-ending-tomorrow", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });

export const auditTrialEndsTomorrowEmailHtml = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: AuditTrialEndsTomorrowContentProps) =>
  stripeTemplateHtml("billing.audit-trial-ending-tomorrow", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });
