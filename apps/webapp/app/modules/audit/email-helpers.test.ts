import { sendEmail } from "~/emails/mail.server";
import { sendAuditAssignedEmail, sendAuditOverdueEmail } from "./email-helpers";

// @vitest-environment node

vitest.mock("~/emails/audit-updates-template", () => ({
  auditUpdatesTemplateString: vitest.fn().mockResolvedValue("<html></html>"),
}));

vitest.mock("~/emails/mail.server", () => ({
  sendEmail: vitest.fn(),
}));

describe("audit email tags", () => {
  const audit = {
    id: "audit-1",
    name: "Quarterly audit",
    description: "Verify assets",
    dueDate: new Date("2025-02-10T12:00:00.000Z"),
    organizationId: "org-1",
    _count: {
      assets: 3,
    },
    createdBy: {
      firstName: "Jane",
      lastName: "Doe",
      displayName: "Jane Doe",
    },
    organization: {
      customEmailFooter: null,
    },
  };

  beforeEach(() => {
    vitest.clearAllMocks();
  });

  it("adds Brevo tags to audit assignment emails", async () => {
    await sendAuditAssignedEmail({
      audit: audit as never,
      assigneeEmail: "assignee@example.com",
      assigneeName: "Alex Martin",
      hints: { timeZone: "UTC", locale: "en-US" },
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "assignee@example.com",
        tags: ["audit", "assigned", "notification", "assignee"],
      })
    );
  });

  it("adds Brevo tags to overdue audit emails", async () => {
    sendAuditOverdueEmail({
      audit: audit as never,
      recipients: [
        {
          email: "owner@example.com",
          firstName: "Owner",
          lastName: "User",
        },
      ],
      hints: { timeZone: "UTC", locale: "en-US" },
    });

    await Promise.resolve();

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        tags: ["audit", "overdue", "notification", "recipient"],
      })
    );
  });
});
