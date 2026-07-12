// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/emails/mail.server", () => ({
  sendEmail: mocks.sendEmail,
}));

const { resolveTemplatedEmail, sendTemplatedEmail } = await import(
  "./template-registry.server"
);

describe("template registry", () => {
  beforeEach(() => {
    mocks.sendEmail.mockClear();
  });

  it("renders auth OTP copy in French without legacy Shelf branding", async () => {
    const template = await resolveTemplatedEmail("auth.login-otp", {
      email: "user@example.com",
      otp: "123456",
    });

    expect(template.subject).toBe("Code de connexion Patrimoine360 : 123456");
    expect(template.tags).toEqual(["auth", "otp", "login"]);
    expect(template.text).toContain("Patrimoine360");
    expect(template.text).not.toMatch(/Shelf|shelf\.nu/i);
    expect(template.html).toContain("Code de connexion");
    expect(template.html).not.toMatch(/Shelf|shelf\.nu/i);
  });

  it("sends invite templates through the centralized helper", async () => {
    await sendTemplatedEmail({
      to: "guest@example.com",
      template: "invite.workspace",
      data: {
        invite: {
          id: "invite-1",
          inviteeEmail: "guest@example.com",
          inviter: {
            firstName: "Ada",
            lastName: "Lovelace",
            displayName: null,
          },
          organization: {
            name: "Direction Patrimoine",
            customEmailFooter: "Footer metier",
          },
        } as never,
        token: "token-123",
        extraMessage: "Bienvenue a bord.",
      },
    });

    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.com",
        subject:
          "Invitation a rejoindre Direction Patrimoine sur Patrimoine360",
        tags: expect.arrayContaining([
          "invite",
          "organization",
          "transactional",
        ]),
      })
    );
  });
});
