import { loader } from "~/routes/api+/mobile+/me";
import { createLoaderArgs } from "@mocks/remix";

// @vitest-environment node

const createDataMock = vitest.hoisted(() => {
  return () =>
    vitest.fn((body: unknown, init?: ResponseInit) => {
      return new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });
    });
});

vitest.mock("react-router", async () => {
  const actual = await vitest.importActual("react-router");
  return {
    ...actual,
    data: createDataMock(),
  };
});

vitest.mock("~/modules/api/mobile-auth.server", () => ({
  getUserOrganizations: vitest.fn(),
  requireMobileAuth: vitest.fn(),
}));

vitest.mock("~/utils/error", () => ({
  makeShelfError: vitest.fn((cause: any) => ({
    message: cause?.message || "Unexpected error",
    status: cause?.status || 500,
  })),
}));

import {
  getUserOrganizations,
  requireMobileAuth,
} from "~/modules/api/mobile-auth.server";

const mockUser = {
  id: "user-1",
  email: "mobile@example.com",
  firstName: "Mobile",
  lastName: "User",
  profilePicture: null,
  onboarded: true,
};

function createMeRequest(headers?: HeadersInit) {
  return new Request("http://localhost:3000/api/mobile/me", {
    headers,
  });
}

describe("GET /api/mobile/me", () => {
  beforeEach(() => {
    vitest.clearAllMocks();

    (requireMobileAuth as any).mockResolvedValue({
      user: mockUser,
      authUser: {
        id: "better-auth-user-1",
        email: mockUser.email,
      },
    });
    (getUserOrganizations as any).mockResolvedValue([
      {
        id: "org-1",
        name: "Organisation",
        type: "TEAM",
        imageId: null,
        barcodesEnabled: true,
        auditsEnabled: true,
        roles: ["OWNER"],
      },
    ]);
  });

  it("returns the mobile profile for a valid Better Auth bearer token", async () => {
    const result = await loader(
      createLoaderArgs({
        request: createMeRequest({
          Authorization: "Bearer better-auth-token",
        }),
      })
    );

    expect(requireMobileAuth).toHaveBeenCalledWith(expect.any(Request));
    expect(getUserOrganizations).toHaveBeenCalledWith("user-1");

    expect(result instanceof Response).toBe(true);
    expect((result as unknown as Response).status).toBe(200);

    const body = await (result as unknown as Response).json();
    expect(body.user.email).toBe("mobile@example.com");
    expect(body.organizations).toHaveLength(1);
  });

  it("returns 401 when the bearer token is missing or expired", async () => {
    const authError = new Error("Invalid or expired token");
    (authError as any).status = 401;
    (requireMobileAuth as any).mockRejectedValue(authError);

    const result = await loader(
      createLoaderArgs({
        request: createMeRequest(),
      })
    );

    expect(result instanceof Response).toBe(true);
    expect((result as unknown as Response).status).toBe(401);

    const body = await (result as unknown as Response).json();
    expect(body.error.message).toBe("Invalid or expired token");
  });
});
