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
  sendTeamTrialWelcomeEmail,
  welcomeToTrialEmailText,
} from "./welcome-to-trial";

describe("welcomeToTrialEmailText", () => {
  it("includes the recipient name when provided", () => {
    const text = welcomeToTrialEmailText({ firstName: "Alice" });
    expect(text).toContain("Bonjour Alice,");
  });

  it("includes the workspace creation CTA", () => {
    const text = welcomeToTrialEmailText({ firstName: null });
    expect(text).toContain("/account-details/workspace");
  });
});

describe("sendTeamTrialWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the team trial welcome email with Brevo tags", async () => {
    await sendTeamTrialWelcomeEmail({
      firstName: "Alice",
      email: "alice@example.com",
    });

    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@example.com",
        subject: "Votre essai Equipe Patrimoine360 est pret",
        tags: ["billing", "trial", "team", "welcome"],
      })
    );
  });
});
