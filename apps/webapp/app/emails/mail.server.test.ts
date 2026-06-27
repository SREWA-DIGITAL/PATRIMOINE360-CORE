// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  Logger: {
    error: vi.fn(),
  },
  scheduler: {
    send: vi.fn().mockResolvedValue(undefined),
  },
  triggerEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/utils/logger", () => ({
  Logger: mocks.Logger,
}));

vi.mock("~/utils/scheduler.server", () => ({
  QueueNames: {
    emailQueue: "email-queue",
  },
  scheduler: mocks.scheduler,
}));

vi.mock("./email.worker.server", () => ({
  triggerEmail: mocks.triggerEmail,
}));

const { sendEmail } = await import("./mail.server");

describe("mail.server", () => {
  beforeEach(() => {
    mocks.Logger.error.mockClear();
    mocks.scheduler.send.mockClear();
    mocks.triggerEmail.mockClear();
  });

  it("queues the payload when direct delivery fails", async () => {
    mocks.triggerEmail.mockRejectedValueOnce(new Error("brevo down"));

    sendEmail({
      subject: "Verify your email",
      text: "Hello",
      to: "user@example.com",
    });

    await vi.waitFor(() => {
      expect(mocks.scheduler.send).toHaveBeenCalledWith(
        "email-queue",
        {
          subject: "Verify your email",
          text: "Hello",
          to: "user@example.com",
        },
        {
          retryLimit: 15,
          retryDelay: 60,
          expireInHours: 24,
        }
      );
    });

    expect(mocks.Logger.error).toHaveBeenCalled();
  });
});
