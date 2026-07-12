import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface BarcodeTrialEndsSoonProps {
  email: string;
  firstName?: string | null;
  hasPaymentMethod: boolean;
  trialEndDate: Date;
}

type BarcodeTrialEndsSoonContentProps = Omit<
  BarcodeTrialEndsSoonProps,
  "email"
>;

export const sendBarcodeTrialEndsSoonEmail = async ({
  email,
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: BarcodeTrialEndsSoonProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.barcode-trial-ending-soon",
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
          "Something went wrong while sending the barcode trial ending email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const barcodeTrialEndsSoonEmailText = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: BarcodeTrialEndsSoonContentProps) =>
  stripeTemplateText("billing.barcode-trial-ending-soon", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });

export const barcodeTrialEndsSoonEmailHtml = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: BarcodeTrialEndsSoonContentProps) =>
  stripeTemplateHtml("billing.barcode-trial-ending-soon", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });
