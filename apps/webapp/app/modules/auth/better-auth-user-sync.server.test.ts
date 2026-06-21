// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const userFindUnique = vi.fn();
  const userUpdate = vi.fn();
  const createUser = vi.fn();
  const generateUniqueUsername = vi.fn();

  return {
    createUser,
    generateUniqueUsername,
    userFindUnique,
    userUpdate,
  };
});

vi.mock("~/database/db.server", () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

vi.mock("~/modules/user/service.server", () => ({
  createUser: mocks.createUser,
}));

vi.mock("~/modules/user/utils.server", () => ({
  generateUniqueUsername: mocks.generateUniqueUsername,
}));

const {
  ensureDomainUserForBetterAuthUser,
  syncDomainUserProfileFromBetterAuthUser,
} = await import("./better-auth-user-sync.server");

describe("better auth domain user sync", () => {
  beforeEach(() => {
    mocks.userFindUnique.mockReset();
    mocks.userUpdate.mockReset();
    mocks.createUser.mockReset();
    mocks.generateUniqueUsername.mockReset();
    mocks.userUpdate.mockResolvedValue(null);
  });

  it("reuses an existing domain user found by email", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "legacy-user-1",
        email: "owner@example.com",
        firstName: null,
        lastName: null,
        displayName: null,
        profilePicture: null,
      })
      .mockResolvedValueOnce({
        id: "legacy-user-1",
        email: "owner@example.com",
        firstName: null,
        lastName: null,
        displayName: null,
        profilePicture: null,
      });

    const result = await ensureDomainUserForBetterAuthUser({
      id: "better-auth-user-1",
      email: "OWNER@example.com",
      name: "Owner Example",
      image: "https://cdn.example.com/avatar.png",
    });

    expect(result).toEqual({
      id: "legacy-user-1",
      email: "owner@example.com",
      image: "https://cdn.example.com/avatar.png",
      name: "Owner Example",
    });
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "legacy-user-1" },
      })
    );
  });

  it("creates a full domain user when better auth signs up a new person", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "better-auth-user-2",
        email: "new.user@example.com",
        firstName: "New",
        lastName: "User",
        displayName: null,
        profilePicture: null,
      });
    mocks.generateUniqueUsername.mockResolvedValue("newuser123");
    mocks.createUser.mockResolvedValue({
      id: "better-auth-user-2",
    });

    const result = await ensureDomainUserForBetterAuthUser({
      id: "better-auth-user-2",
      email: "new.user@example.com",
      name: "New User",
      image: null,
    });

    expect(mocks.generateUniqueUsername).toHaveBeenCalledWith(
      "new.user@example.com"
    );
    expect(mocks.createUser).toHaveBeenCalledWith({
      userId: "better-auth-user-2",
      email: "new.user@example.com",
      username: "newuser123",
      firstName: "New",
      lastName: "User",
    });
    expect(result.id).toBe("better-auth-user-2");
  });

  it("syncs profile fields onto an existing domain user by id", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "better-auth-user-3",
      email: "member@example.com",
      firstName: null,
      lastName: null,
      displayName: null,
      profilePicture: null,
    });

    await syncDomainUserProfileFromBetterAuthUser({
      id: "better-auth-user-3",
      email: "member@example.com",
      name: "Member Name",
      image: "https://cdn.example.com/member.png",
    });

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "better-auth-user-3" },
      data: {
        email: "member@example.com",
        displayName: "Member Name",
        profilePicture: "https://cdn.example.com/member.png",
        firstName: "Member",
        lastName: "Name",
        teamMembers: {
          updateMany: {
            where: { userId: "better-auth-user-3" },
            data: {
              name: "Member Name",
            },
          },
        },
      },
    });
  });
});
