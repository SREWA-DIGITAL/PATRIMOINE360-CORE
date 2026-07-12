import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface BarcodeTrialEndsTomorrowProps {
  email: string;
  firstName?: string | null;
  hasPaymentMethod: boolean;
  trialEndDate: Date;
}

type BarcodeTrialEndsTomorrowContentProps = Omit<
  BarcodeTrialEndsTomorrowProps,
  "email"
>;

export const sendBarcodeTrialEndsTomorrowEmail = async ({
  email,
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: BarcodeTrialEndsTomorrowProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.barcode-trial-ending-tomorrow",
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
          "Something went wrong while sending the barcode trial ends tomorrow email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const barcodeTrialEndsTomorrowEmailText = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: BarcodeTrialEndsTomorrowContentProps) =>
  stripeTemplateText("billing.barcode-trial-ending-tomorrow", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });

export const barcodeTrialEndsTomorrowEmailHtml = ({
  firstName,
  hasPaymentMethod,
  trialEndDate,
}: BarcodeTrialEndsTomorrowContentProps) =>
  stripeTemplateHtml("billing.barcode-trial-ending-tomorrow", {
    firstName,
    hasPaymentMethod,
    trialEndDate,
  });
