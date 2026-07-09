import { pathToFileURL } from "node:url";
import { PrismaClient, Roles, TierId } from "@prisma/client";

const prisma = new PrismaClient();

const roleNames = [Roles.USER, Roles.ADMIN] as const;

const tierSeed = [
  {
    id: TierId.free,
    name: "Free",
    tierLimit: {
      canExportAssets: false,
      canHideShelfBranding: false,
      canImportAssets: false,
      canImportNRM: false,
      maxCustomFields: 3,
      maxOrganizations: 1,
    },
  },
  {
    id: TierId.tier_1,
    name: "Plus",
    tierLimit: {
      canExportAssets: true,
      canHideShelfBranding: true,
      canImportAssets: true,
      canImportNRM: true,
      maxCustomFields: 100,
      maxOrganizations: 1,
    },
  },
  {
    id: TierId.tier_2,
    name: "Team",
    tierLimit: {
      canExportAssets: true,
      canHideShelfBranding: true,
      canImportAssets: true,
      canImportNRM: true,
      maxCustomFields: 100,
      maxOrganizations: 2,
    },
  },
  {
    id: TierId.custom,
    name: "Custom",
    tierLimit: null,
  },
] as const;

async function seedRoles() {
  for (const roleName of roleNames) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }
}

async function seedTiers() {
  for (const tier of tierSeed) {
    if (tier.tierLimit) {
      await prisma.tierLimit.upsert({
        where: { id: tier.id },
        update: tier.tierLimit,
        create: {
          id: tier.id,
          ...tier.tierLimit,
        },
      });
    }

    await prisma.tier.upsert({
      where: { id: tier.id },
      update: {
        name: tier.name,
        tierLimitId: tier.tierLimit ? tier.id : null,
      },
      create: {
        id: tier.id,
        name: tier.name,
        ...(tier.tierLimit ? { tierLimitId: tier.id } : {}),
      },
    });
  }
}

export async function main() {
  await seedRoles();
  await seedTiers();

  console.log(
    `Core seed complete: ${roleNames.length} roles, ${tierSeed.length} tiers`
  );
}

const isDirectExecution =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main()
    .catch((error) => {
      console.error("Core seed failed");
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
