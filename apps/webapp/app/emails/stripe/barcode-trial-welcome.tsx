import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface BarcodeTrialWelcomeProps {
  email: string;
  firstName?: string | null;
  hasPaymentMethod: boolean;
}

type BarcodeTrialWelcomeContentProps = Omit<BarcodeTrialWelcomeProps, "email">;

export const sendBarcodeTrialWelcomeEmail = async ({
  email,
  firstName,
  hasPaymentMethod,
}: BarcodeTrialWelcomeProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.barcode-trial-welcome",
      data: {
        firstName,
        hasPaymentMethod,
      },
    });
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message:
          "Something went wrong while sending the barcode trial welcome email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const barcodeTrialWelcomeEmailText = ({
  firstName,
  hasPaymentMethod,
}: BarcodeTrialWelcomeContentProps) =>
  stripeTemplateText("billing.barcode-trial-welcome", {
    firstName,
    hasPaymentMethod,
  });

export const barcodeTrialWelcomeEmailHtml = ({
  firstName,
  hasPaymentMethod,
}: BarcodeTrialWelcomeContentProps) =>
  stripeTemplateHtml("billing.barcode-trial-welcome", {
    firstName,
    hasPaymentMethod,
  });
