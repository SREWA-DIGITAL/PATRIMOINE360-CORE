// @vitest-environment node
import { AssetIndexMode, OrganizationRoles, Roles } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authSession } from "@mocks/handlers";
import {
  ORGANIZATION_ID,
  USER_EMAIL,
  USER_ID,
  USER_PASSWORD,
} from "@mocks/user";
import { db } from "~/database/db.server";
import { USER_WITH_SSO_DETAILS_SELECT } from "./fields";
import {
  createUserAccountForTesting,
  createUserOrAttachOrg,
  defaultUserCategories,
} from "./service.server";
import { defaultFields } from "../asset-index-settings/helpers";

const mocks = vi.hoisted(() => ({
  deleteAuthAccount: vi.fn().mockResolvedValue(undefined),
  ensureBetterAuthCredentialIdentity: vi.fn(),
  ensureAssetIndexModeForRole: vi.fn().mockResolvedValue(undefined),
  signInWithEmail: vi.fn(),
}));

vi.mock("~/utils/id/id.server", () => ({
  id: vi.fn(() => USER_ID),
}));

vi.mock("~/database/db.server", () => ({
  db: {
    $transaction: vi.fn().mockImplementation((callback) => callback(db)),
    $queryRaw: vi.fn().mockResolvedValue([]),
    user: {
      create: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      findFirst: vi.fn(),
    },
    organization: {
      findFirst: vi.fn().mockResolvedValue({ id: ORGANIZATION_ID }),
    },
    userOrganization: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("~/modules/auth/service.server", () => ({
  deleteAuthAccount: mocks.deleteAuthAccount,
  setAuthUserEmail: vi.fn(),
  signInWithEmail: mocks.signInWithEmail,
  softDeleteAuthUser: vi.fn(),
  updateAccountPassword: vi.fn(),
}));

vi.mock("~/modules/auth/better-auth-identity.server", () => ({
  ensureBetterAuthCredentialIdentity: mocks.ensureBetterAuthCredentialIdentity,
}));

vi.mock("~/modules/asset-index-settings/service.server", () => ({
  ensureAssetIndexModeForRole: mocks.ensureAssetIndexModeForRole,
}));

const username = `test-user-${USER_ID}`;

const newUserMock = {
  id: USER_ID,
  email: USER_EMAIL,
  organizations: [{ id: ORGANIZATION_ID }],
  sso: false,
} as any;

describe(createUserAccountForTesting.name, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.user.create).mockResolvedValue({
      id: USER_ID,
      email: USER_EMAIL,
      username,
      organizations: [{ id: "org-id" }],
    } as any);
    mocks.ensureBetterAuthCredentialIdentity.mockResolvedValue({ id: USER_ID });
    mocks.signInWithEmail.mockResolvedValue({ ...authSession });
  });

  it("returns null and cleans up the user if Better Auth identity creation fails", async () => {
    mocks.ensureBetterAuthCredentialIdentity.mockResolvedValueOnce(null);

    const result = await createUserAccountForTesting(
      USER_EMAIL,
      USER_PASSWORD,
      username
    );

    expect(result).toBeNull();
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
  });

  it("returns null and deletes the auth account if sign-in fails", async () => {
    mocks.signInWithEmail.mockResolvedValueOnce(null);

    const result = await createUserAccountForTesting(
      USER_EMAIL,
      USER_PASSWORD,
      username
    );

    expect(result).toBeNull();
    expect(mocks.deleteAuthAccount).toHaveBeenCalledWith(USER_ID);
  });

  it("creates the user, Better Auth identity and session", async () => {
    const result = await createUserAccountForTesting(
      USER_EMAIL,
      USER_PASSWORD,
      username
    );

    expect(db.user.create).toBeCalledWith({
      data: {
        email: USER_EMAIL,
        id: USER_ID,
        username,
        firstName: undefined,
        lastName: undefined,
        createdWithInvite: undefined,
        organizations: {
          create: [
            {
              name: "Personal",
              hasSequentialIdsMigrated: true,
              categories: {
                create: defaultUserCategories.map((c) => ({
                  ...c,
                  userId: USER_ID,
                })),
              },
              members: {
                create: {
                  name: "(Owner)",
                  user: { connect: { id: USER_ID } },
                },
              },
              assetIndexSettings: {
                create: {
                  mode: AssetIndexMode.ADVANCED,
                  columns: defaultFields,
                  user: {
                    connect: {
                      id: USER_ID,
                    },
                  },
                },
              },
            },
          ],
        },
        roles: {
          connect: {
            name: Roles["USER"],
          },
        },
      },
      select: {
        organizations: {
          select: { id: true },
        },
        ...USER_WITH_SSO_DETAILS_SELECT,
      },
    });
    expect(mocks.ensureBetterAuthCredentialIdentity).toHaveBeenCalledWith({
      email: USER_EMAIL,
      emailVerified: true,
      name: "hello",
      password: USER_PASSWORD,
      userId: USER_ID,
    });
    expect(result).toEqual(authSession);
  });
});

describe(createUserOrAttachOrg.name, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.user.findFirst).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue(newUserMock);
    vi.mocked(db.$transaction).mockImplementation((callback: any) =>
      callback(db)
    );
    mocks.ensureBetterAuthCredentialIdentity.mockResolvedValue({ id: USER_ID });
  });

  it("creates a new user and Better Auth identity for invite acceptance", async () => {
    const result = await createUserOrAttachOrg({
      email: USER_EMAIL,
      organizationId: ORGANIZATION_ID,
      roles: [OrganizationRoles.BASE],
      password: USER_PASSWORD,
      firstName: "Test",
      createdWithInvite: true,
    });

    expect(result.id).toBe(USER_ID);
    expect(db.user.create).toHaveBeenCalled();
    expect(mocks.ensureBetterAuthCredentialIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        email: USER_EMAIL,
        emailVerified: true,
        password: USER_PASSWORD,
        userId: USER_ID,
      })
    );
  });

  it("attaches the organization to an existing non-SSO user and refreshes the invited credential", async () => {
    vi.mocked(db.user.findFirst).mockResolvedValueOnce({
      id: USER_ID,
      email: USER_EMAIL,
      firstName: "Existing",
      lastName: "User",
      sso: false,
      userOrganizations: [],
    } as any);

    const result = await createUserOrAttachOrg({
      email: USER_EMAIL,
      organizationId: ORGANIZATION_ID,
      roles: [OrganizationRoles.BASE],
      password: USER_PASSWORD,
      firstName: "Existing",
      createdWithInvite: true,
    });

    expect(result.id).toBe(USER_ID);
    expect(db.userOrganization.upsert).toHaveBeenCalled();
    expect(db.user.create).not.toHaveBeenCalled();
    expect(mocks.ensureBetterAuthCredentialIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER_ID,
      })
    );
  });

  it("attaches the organization to an existing SSO user without creating an email credential", async () => {
    vi.mocked(db.user.findFirst).mockResolvedValueOnce({
      id: USER_ID,
      email: USER_EMAIL,
      firstName: "Existing",
      lastName: "User",
      sso: true,
      userOrganizations: [],
    } as any);

    const result = await createUserOrAttachOrg({
      email: USER_EMAIL,
      organizationId: ORGANIZATION_ID,
      roles: [OrganizationRoles.BASE],
      password: USER_PASSWORD,
      firstName: "Existing",
      createdWithInvite: true,
    });

    expect(result.id).toBe(USER_ID);
    expect(db.userOrganization.upsert).toHaveBeenCalled();
    expect(mocks.ensureBetterAuthCredentialIdentity).not.toHaveBeenCalled();
  });
});
