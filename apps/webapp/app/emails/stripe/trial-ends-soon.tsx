import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface TrialEndsSoonProps {
  firstName?: string | null;
  email: string;
  hasPaymentMethod: boolean;
  planName: string;
  trialEndDate: Date;
}

type TrialEndsSoonContentProps = Omit<TrialEndsSoonProps, "email">;

export const sendTrialEndsSoonEmail = async ({
  firstName,
  email,
  hasPaymentMethod,
  planName,
  trialEndDate,
}: TrialEndsSoonProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.plan-trial-ending-soon",
      data: {
        firstName,
        hasPaymentMethod,
        planName,
        trialEndDate,
      },
    });
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message: "Something went wrong while sending the trial ending email",
        additionalData: { email, planName },
        label: "User",
      })
    );
  }
};

export const trialEndsSoonEmailText = ({
  firstName,
  hasPaymentMethod,
  planName,
  trialEndDate,
}: TrialEndsSoonContentProps) =>
  stripeTemplateText("billing.plan-trial-ending-soon", {
    firstName,
    hasPaymentMethod,
    planName,
    trialEndDate,
  });

export const trialEndsSoonEmailHtml = ({
  firstName,
  hasPaymentMethod,
  planName,
  trialEndDate,
}: TrialEndsSoonContentProps) =>
  stripeTemplateHtml("billing.plan-trial-ending-soon", {
    firstName,
    hasPaymentMethod,
    planName,
    trialEndDate,
  });
