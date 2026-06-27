// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendOTP: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("~/modules/auth/service.server", () => ({
  sendOTP: mocks.sendOTP,
}));

const { action } = await import("./send-otp");

describe("send-otp route action", () => {
  it("redirects login requests to the otp screen", async () => {
    const response = await action({
      request: new Request("http://localhost/send-otp", {
        method: "POST",
        body: new URLSearchParams({
          email: "USER@example.com",
          mode: "login",
        }),
      }),
    } as never);

    expect(mocks.sendOTP).toHaveBeenCalledWith("user@example.com", "login");
    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/otp?email=user%40example.com&mode=login"
    );
  });

  it("defaults missing mode values to login", async () => {
    const response = await action({
      request: new Request("http://localhost/send-otp", {
        method: "POST",
        body: new URLSearchParams({
          email: "USER@example.com",
        }),
      }),
    } as never);

    expect(mocks.sendOTP).toHaveBeenCalledWith("user@example.com", "login");
    expect(response).toBeInstanceOf(Response);

    if (!(response instanceof Response)) {
      throw new Error("Expected a redirect Response");
    }

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/otp?email=user%40example.com&mode=login"
    );
  });
});
