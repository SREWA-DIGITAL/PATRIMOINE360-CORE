// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const sendTransacEmail = vi.fn().mockResolvedValue({ id: "message-id" });

  class MockBrevoError extends Error {
    statusCode?: number;
    body?: unknown;
  }

  const BrevoClient = vi.fn(() => ({
    transactionalEmails: {
      sendTransacEmail,
    },
  }));

  return {
    BrevoClient,
    MockBrevoError,
    sendTransacEmail,
  };
});

vi.mock("@getbrevo/brevo", () => ({
  BrevoClient: mocks.BrevoClient,
  BrevoError: mocks.MockBrevoError,
}));

vi.mock("~/utils/env", () => ({
  BREVO_API_KEY: "xkeysib-test",
  BREVO_TIMEOUT_SECONDS: "45",
}));

const { parseMailboxAddress, sendEmailWithBrevo } = await import(
  "./brevo-email-provider.server"
);

describe("brevo-email-provider", () => {
  beforeEach(() => {
    mocks.sendTransacEmail.mockClear();
    mocks.BrevoClient.mockClear();
    global.__brevoClient__ = undefined;
  });

  it("parses mailbox strings with display names", () => {
    expect(parseMailboxAddress('"Support Team" <support@example.com>')).toEqual(
      {
        email: "support@example.com",
        name: "Support Team",
      }
    );
  });

  it("sends Brevo transactional emails with mapped payload fields", async () => {
    await sendEmailWithBrevo({
      from: '"Support Team" <support@example.com>',
      headers: {
        "X-Test": "true",
      },
      html: "<p>Hello</p>",
      params: {
        FIRSTNAME: "Ada",
      },
      replyTo: "reply@example.com",
      subject: "Welcome",
      tags: ["welcome", "core"],
      templateId: 42,
      text: "Hello",
      to: '"Ada Lovelace" <ada@example.com>',
    });

    expect(mocks.BrevoClient).toHaveBeenCalledWith({
      apiKey: "xkeysib-test",
      maxRetries: 3,
      timeoutInSeconds: 45,
    });
    expect(mocks.sendTransacEmail).toHaveBeenCalledWith({
      sender: {
        email: "support@example.com",
        name: "Support Team",
      },
      headers: {
        "X-Test": "true",
      },
      htmlContent: "<p>Hello</p>",
      params: {
        FIRSTNAME: "Ada",
      },
      replyTo: {
        email: "reply@example.com",
      },
      subject: "Welcome",
      tags: ["welcome", "core"],
      templateId: 42,
      textContent: "Hello",
      to: [
        {
          email: "ada@example.com",
          name: "Ada Lovelace",
        },
      ],
    });
  });

  it("wraps provider failures with a clear Brevo message", async () => {
    const error = new mocks.MockBrevoError("Invalid sender");
    mocks.sendTransacEmail.mockRejectedValueOnce(error);

    await expect(
      sendEmailWithBrevo({
        from: '"Support Team" <support@example.com>',
        subject: "Welcome",
        text: "Hello",
        to: "ada@example.com",
      })
    ).rejects.toMatchObject({
      label: "Email",
      message: "Brevo email delivery failed: Invalid sender",
    });
  });
});
