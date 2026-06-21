// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { triggerEmail } from "./email.worker.server";

// why: avoid actual provider calls during tests
vi.mock("~/emails/email-provider.server", () => ({
  deliverEmail: vi.fn().mockResolvedValue(undefined),
}));

// why: scheduler is not needed for triggerEmail unit tests
vi.mock("~/utils/scheduler.server", () => ({
  QueueNames: { emailQueue: "email" },
  scheduler: { work: vi.fn() },
}));

const { deliverEmail } = await import("~/emails/email-provider.server");

const basePayload = {
  subject: "Test Subject",
  text: "Test body",
  html: "<p>Test</p>",
};

describe("triggerEmail", () => {
  it("skips sending email to soft-deleted users", async () => {
    await triggerEmail({
      ...basePayload,
      to: "deleted+abc123@deleted.shelf.nu",
    });

    expect(deliverEmail).not.toHaveBeenCalled();
  });

  it("sends email to normal addresses", async () => {
    await triggerEmail({
      ...basePayload,
      to: "user@example.com",
    });

    expect(deliverEmail).toHaveBeenCalledOnce();
    expect(deliverEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" })
    );
  });
});
