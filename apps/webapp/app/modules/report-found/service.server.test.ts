// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendTemplatedEmail: vi.fn(),
}));

vi.mock("~/emails/template-registry.server", () => ({
  sendTemplatedEmail: mocks.sendTemplatedEmail,
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
    mocks.sendTemplatedEmail.mockClear();
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

    expect(mocks.sendTemplatedEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "owner@example.com",
        template: "report-found.owner",
        data: expect.objectContaining({
          itemLabel: "Camera A",
          reportType: "asset",
        }),
      })
    );
    expect(mocks.sendTemplatedEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "reporter@example.com",
        template: "report-found.reporter",
        data: expect.objectContaining({
          itemLabel: "Camera A",
          reportType: "asset",
        }),
      })
    );
  });
});
