import { db } from "~/database/db.server";
import { createUser } from "~/modules/user/service.server";
import { generateUniqueUsername } from "~/modules/user/utils.server";
import { ShelfError } from "~/utils/error";

const label = "Auth";

type BetterAuthManagedUser = {
  appMetadata?: Record<string, unknown> | null;
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeDisplayName(name: string, email: string) {
  const trimmedName = name.trim();

  if (trimmedName.length > 0) {
    return trimmedName;
  }

  return normalizeEmail(email).split("@")[0] ?? email;
}

function splitDisplayName(displayName: string) {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return {
      firstName: undefined,
      lastName: undefined,
    };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  const lastName = rest.join(" ").trim() || undefined;

  return {
    firstName: firstName || undefined,
    lastName,
  };
}

function buildTeamMemberName({
  displayName,
  firstName,
  lastName,
}: {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const trimmedDisplayName = displayName?.trim();

  if (trimmedDisplayName) {
    return trimmedDisplayName;
  }

  return `${firstName ?? ""} ${lastName ?? ""}`.trim();
}

async function getDomainUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      profilePicture: true,
      sso: true,
    },
  });
}

async function getDomainUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      profilePicture: true,
      sso: true,
    },
  });
}

function isSsoManagedBetterAuthUser(user: BetterAuthManagedUser) {
  return user.appMetadata?.provider === "sso";
}

export async function syncDomainUserProfileFromBetterAuthUser(
  user: BetterAuthManagedUser
) {
  const email = normalizeEmail(user.email);
  const displayName = normalizeDisplayName(user.name, email);
  const { firstName, lastName } = splitDisplayName(displayName);
  const existingUser = await getDomainUserById(user.id);

  if (!existingUser) {
    throw new ShelfError({
      cause: null,
      message: "Unable to synchronize Better Auth profile to domain user",
      additionalData: { betterAuthUserId: user.id, email },
      label,
      shouldBeCaptured: false,
      status: 404,
    });
  }

  const teamMemberName = buildTeamMemberName({
    displayName,
    firstName: existingUser.firstName ?? firstName,
    lastName: existingUser.lastName ?? lastName,
  });

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      email,
      displayName,
      profilePicture: user.image ?? null,
      ...(existingUser.firstName ? {} : { firstName }),
      ...(existingUser.lastName ? {} : { lastName }),
      ...(teamMemberName
        ? {
            teamMembers: {
              updateMany: {
                where: { userId: existingUser.id },
                data: {
                  name: teamMemberName,
                },
              },
            },
          }
        : {}),
    },
  });
}

export async function ensureDomainUserForBetterAuthUser(
  user: BetterAuthManagedUser
) {
  const email = normalizeEmail(user.email);
  const displayName = normalizeDisplayName(user.name, email);
  const normalizedUser = {
    ...user,
    email,
    name: displayName,
  };

  const existingUserById = await getDomainUserById(user.id);

  if (existingUserById) {
    await syncDomainUserProfileFromBetterAuthUser(normalizedUser);
    return normalizedUser;
  }

  const existingUserByEmail = await getDomainUserByEmail(email);

  if (existingUserByEmail) {
    if (
      isSsoManagedBetterAuthUser(normalizedUser) &&
      !existingUserByEmail.sso
    ) {
      throw new ShelfError({
        cause: null,
        message:
          "It looks like the email you're using is linked to a personal account in Shelf. Please contact our support team to update your personal workspace to a different email account.",
        additionalData: { email },
        label,
        shouldBeCaptured: false,
        status: 409,
      });
    }

    const linkedUser = {
      ...normalizedUser,
      id: existingUserByEmail.id,
    };

    await syncDomainUserProfileFromBetterAuthUser(linkedUser);
    return linkedUser;
  }

  const username = await generateUniqueUsername(email);
  const { firstName, lastName } = splitDisplayName(displayName);

  let userId = normalizedUser.id;

  try {
    await createUser({
      userId,
      email,
      username,
      firstName,
      lastName,
      isSSO: isSsoManagedBetterAuthUser(normalizedUser),
    });
  } catch (cause) {
    const racedUser = await getDomainUserByEmail(email);

    if (!racedUser) {
      throw cause;
    }

    userId = racedUser.id;
  }

  const linkedUser = {
    ...normalizedUser,
    id: userId,
  };

  await syncDomainUserProfileFromBetterAuthUser(linkedUser);

  return linkedUser;
}
