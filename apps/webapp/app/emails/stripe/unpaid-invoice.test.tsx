import { beforeEach, describe, expect, it, vi } from "vitest";

// why: sendEmail makes external network calls
const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
}));
vi.mock("~/emails/mail.server", () => ({
  sendEmail: mockSendEmail,
}));

// why: Logger makes external calls
const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));
vi.mock("~/utils/logger", () => ({
  Logger: { error: mockLoggerError },
}));

// why: env vars are read at import time; shelf.config.ts also imports from this module
vi.mock("~/utils/env", () => ({
  SERVER_URL: "https://app.shelf.nu",
  SUPPORT_EMAIL: "support@shelf.nu",
  SEND_ONBOARDING_EMAIL: false,
  ENABLE_PREMIUM_FEATURES: false,
  FREE_TRIAL_DAYS: "7",
  DISABLE_SIGNUP: false,
  DISABLE_SSO: false,
  SHOW_HOW_DID_YOU_FIND_US: false,
  COLLECT_BUSINESS_INTEL: false,
  GEOCODING_USER_AGENT: "",
  LICENSE_TYPE: "core",
}));

import {
  sendUnpaidInvoiceUserEmail,
  unpaidInvoiceUserText,
} from "./unpaid-invoice";

describe("unpaidInvoiceUserText", () => {
  it("includes the amount due", () => {
    const text = unpaidInvoiceUserText({
      customerEmail: "alice@example.com",
      customerName: "Alice",
      subscriptionName: "Team",
      amountDue: "$99",
      dueDate: "March 24, 2026",
    });
    expect(text).toContain("Montant : $99");
  });
});

describe("sendUnpaidInvoiceUserEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the unpaid invoice email with Brevo tags", async () => {
    await sendUnpaidInvoiceUserEmail({
      customerEmail: "alice@example.com",
      customerName: "Alice",
      subscriptionName: "Team",
      amountDue: "$99",
      dueDate: "March 24, 2026",
    });

    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject:
          "Action requise : probleme de paiement sur votre abonnement Patrimoine360",
        tags: ["billing", "invoice", "payment-failed"],
      })
    );
  });
});
