import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import {
  sendStripeTemplatedEmail,
  stripeTemplateHtml,
  stripeTemplateText,
} from "./templated";

type InvoiceVariant = "overdue" | "payment-failed";

type AdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
};

type UserEmailProps = {
  amountDue: string;
  customerEmail: string;
  customerName?: string | null;
  dueDate?: string | null;
  subscriptionName: string;
  variant?: InvoiceVariant;
};

function getUserTemplate(variant: InvoiceVariant) {
  return variant === "overdue"
    ? "billing.invoice-overdue"
    : "billing.invoice-payment-failed";
}

export const unpaidInvoiceAdminText = ({
  user,
  eventType,
  invoiceId,
}: {
  eventType: string;
  invoiceId: string;
  user: AdminUser;
}) => [
  `Notification de facturation pour ${user.email}`,
  `Type d'evenement Stripe : ${eventType}`,
  `Facture : ${invoiceId}`,
].join("\n");

export const sendUnpaidInvoiceUserEmail = async ({
  amountDue,
  customerEmail,
  customerName,
  dueDate,
  subscriptionName,
  variant = "payment-failed",
}: UserEmailProps) => {
  try {
    await sendStripeTemplatedEmail({
      to: customerEmail,
      template: getUserTemplate(variant),
      data: {
        amountDue,
        customerEmail,
        customerName,
        dueDate,
        subscriptionName,
      },
    });
  } catch (cause) {
    Logger.error(
      new ShelfError({
        cause,
        message: "Something went wrong while sending the invoice email",
        additionalData: { customerEmail, subscriptionName, variant },
        label: "User",
      })
    );
  }
};

export const unpaidInvoiceUserText = ({
  amountDue,
  customerEmail,
  customerName,
  dueDate,
  subscriptionName,
  variant = "payment-failed",
}: UserEmailProps) =>
  stripeTemplateText(getUserTemplate(variant), {
    amountDue,
    customerEmail,
    customerName,
    dueDate,
    subscriptionName,
  });

export const unpaidInvoiceUserHtml = ({
  amountDue,
  customerEmail,
  customerName,
  dueDate,
  subscriptionName,
  variant = "payment-failed",
}: UserEmailProps) =>
  stripeTemplateHtml(getUserTemplate(variant), {
    amountDue,
    customerEmail,
    customerName,
    dueDate,
    subscriptionName,
  });
