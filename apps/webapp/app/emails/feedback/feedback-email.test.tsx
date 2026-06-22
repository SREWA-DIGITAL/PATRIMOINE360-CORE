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
  SUPPORT_EMAIL: "support@shelf.nu",
  SERVER_URL: "https://app.shelf.nu",
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

import { feedbackEmailText, sendFeedbackEmail } from "./feedback-email";

describe("feedbackEmailText", () => {
  it("includes the organization and message body", () => {
    const text = feedbackEmailText({
      userName: "Alice",
      userEmail: "alice@example.com",
      organizationName: "Acme",
      type: "idea",
      message: "Please add a dashboard",
    });
    expect(text).toContain("Organization: Acme");
    expect(text).toContain("Please add a dashboard");
  });
});

describe("sendFeedbackEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the feedback email with support tags", async () => {
    await sendFeedbackEmail({
      userName: "Alice",
      userEmail: "alice@example.com",
      organizationName: "Acme",
      type: "issue",
      message: "The scanner is slow",
    });

    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@shelf.nu",
        replyTo: "alice@example.com",
        tags: ["feedback", "issue", "support"],
      })
    );
  });
});
