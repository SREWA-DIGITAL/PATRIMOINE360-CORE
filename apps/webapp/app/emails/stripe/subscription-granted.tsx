import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface SubscriptionGrantedEmailProps {
  customerName?: string | null;
  subscriptionName: string;
}

interface SendSubscriptionGrantedEmailProps
  extends SubscriptionGrantedEmailProps {
  email: string;
}

export const sendSubscriptionGrantedEmail = async ({
  customerName,
  subscriptionName,
  email,
}: SendSubscriptionGrantedEmailProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.subscription-activated",
      data: { customerName, subscriptionName },
    });
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message:
          "Something went wrong while sending the subscription granted email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const subscriptionGrantedText = ({
  customerName,
  subscriptionName,
}: SubscriptionGrantedEmailProps) =>
  stripeTemplateText("billing.subscription-activated", {
    customerName,
    subscriptionName,
  });

export const subscriptionGrantedHtml = ({
  customerName,
  subscriptionName,
}: SubscriptionGrantedEmailProps) =>
  stripeTemplateHtml("billing.subscription-activated", {
    customerName,
    subscriptionName,
  });
