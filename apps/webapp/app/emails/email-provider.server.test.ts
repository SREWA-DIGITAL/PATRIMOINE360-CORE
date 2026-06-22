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
  SMTP_FROM: '"Shelf" <hello@example.com>',
  SUPPORT_EMAIL: "support@example.com",
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
      from: '"Shelf" <hello@example.com>',
      replyTo: "support@example.com",
      subject: "Welcome",
      text: "Hello",
      to: "user@example.com",
    });
    expect(mocks.sendEmailWithSmtp).not.toHaveBeenCalled();
  });
});
