import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

interface TeamTrialWelcomeProps {
  firstName?: string | null;
  email: string;
}

export const sendTeamTrialWelcomeEmail = async ({
  firstName,
  email,
}: TeamTrialWelcomeProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: email,
      template: "billing.team-trial-welcome",
      data: { firstName },
    });
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message: "Something went wrong while sending the welcome email",
        additionalData: { email },
        label: "User",
      })
    );
  }
};

export const welcomeToTrialEmailText = ({
  firstName,
}: {
  firstName?: string | null;
}) =>
  stripeTemplateText("billing.team-trial-welcome", {
    firstName,
  });

export const welcomeToTrialEmailHtml = ({
  firstName,
}: {
  firstName?: string | null;
}) =>
  stripeTemplateHtml("billing.team-trial-welcome", {
    firstName,
  });
