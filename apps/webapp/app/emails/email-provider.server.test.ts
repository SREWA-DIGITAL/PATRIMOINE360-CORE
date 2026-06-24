// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendEmailWithBrevo: vi.fn().mockResolvedValue(undefined),
  sendEmailWithSmtp: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./brevo-email-provider.server", () => ({
  sendEmailWithBrevo: mocks.sendEmailWithBrevo,
}));

vi.mock("./smtp-email-provider.server", () => ({
  sendEmailWithSmtp: mocks.sendEmailWithSmtp,
}));

vi.mock("~/utils/env", () => ({
  EMAIL_PROVIDER: "brevo",
  SMTP_FROM: '"Legacy SMTP" <hello@example.com>',
  BREVO_SENDER_EMAIL: "ceofa@srewadigital.co",
  BREVO_SENDER_NAME: "Patrimoine360",
  SUPPORT_EMAIL: "support@example.com",
  EMAIL_REPLY_TO: "reply@example.com",
  EMAIL_REPLY_TO_NAME: "Support Patrimoine360",
}));

const { deliverEmail, resolveEmailProvider } = await import(
  "./email-provider.server"
);

describe("email-provider", () => {
  beforeEach(() => {
    mocks.sendEmailWithBrevo.mockClear();
    mocks.sendEmailWithSmtp.mockClear();
  });

  it("resolves the configured provider", () => {
    expect(resolveEmailProvider()).toBe("brevo");
  });

  it("applies default sender metadata before sending with Brevo", async () => {
    await deliverEmail({
      subject: "Welcome",
      text: "Hello",
      to: "user@example.com",
    });

    expect(mocks.sendEmailWithBrevo).toHaveBeenCalledWith({
      from: '"Patrimoine360" <ceofa@srewadigital.co>',
      replyTo: '"Support Patrimoine360" <reply@example.com>',
      subject: "Welcome",
      text: "Hello",
      to: "user@example.com",
    });
    expect(mocks.sendEmailWithSmtp).not.toHaveBeenCalled();
  });

  it("does not fall back to SMTP sender metadata in Brevo mode", async () => {
    await deliverEmail({
      subject: "Verify your email",
      text: "Hello",
      to: "user@example.com",
    });

    expect(mocks.sendEmailWithBrevo).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Patrimoine360" <ceofa@srewadigital.co>',
      })
    );
    expect(mocks.sendEmailWithBrevo).not.toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Legacy SMTP" <hello@example.com>',
      })
    );
  });

  it("preserves explicit reply-to overrides", async () => {
    await deliverEmail({
      replyTo: "owner@example.com",
      subject: "Welcome",
      text: "Hello",
      to: "user@example.com",
    });

    expect(mocks.sendEmailWithBrevo).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: "owner@example.com",
      })
    );
  });
});
