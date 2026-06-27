// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendOTP: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/modules/auth/service.server", () => ({
  sendOTP: mocks.sendOTP,
}));

const { action } = await import("./resend-otp");

describe("resend-otp route action", () => {
  it("resends OTPs through the shared auth service", async () => {
    const result = await action({
      request: new Request("http://localhost/resend-otp", {
        method: "POST",
        body: new URLSearchParams({
          email: "USER@example.com",
          mode: "login",
        }),
      }),
    } as never);

    expect(mocks.sendOTP).toHaveBeenCalledWith("user@example.com", "login");
    expect(result).toEqual({
      error: null,
      success: true,
    });
  });
});
