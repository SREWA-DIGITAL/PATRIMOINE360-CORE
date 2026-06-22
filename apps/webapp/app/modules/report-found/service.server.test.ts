// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

vi.mock("~/emails/mail.server", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("~/database/db.server", () => ({
  db: {
    reportFound: {
      create: vi.fn(),
    },
  },
}));

const { sendReportEmails } = await import("./service.server");

describe("sendReportEmails", () => {
  beforeEach(() => {
    mocks.sendEmail.mockClear();
  });

  it("tags owner and reporter emails for asset reports", () => {
    sendReportEmails({
      ownerEmail: "owner@example.com",
      reporterEmail: "reporter@example.com",
      message: "Found near reception",
      qr: {
        id: "qr-1",
        assetId: "asset-1",
        kitId: null,
        asset: {
          id: "asset-1",
          title: "Camera A",
        },
        kit: null,
      } as never,
    });

    expect(mocks.sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "owner@example.com",
        tags: ["report-found", "owner-notification", "asset"],
      })
    );
    expect(mocks.sendEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "reporter@example.com",
        tags: ["report-found", "reporter-confirmation", "asset"],
      })
    );
  });
});
