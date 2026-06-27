import { OrganizationRoles, Roles } from "@prisma/client";

export const PATRIMOINE360_PRD_ROLE_LABELS = {
  SUPER_ADMIN: "Super Administrateur",
  ADMIN: "Administrateur",
  PILOTE_GRM: "Pilote GRM",
  EVALUATEUR_CIPM: "Évaluateur CIPM",
  RESPONSABLE_SITE: "Responsable de site",
  LECTEUR: "Lecteur",
} as const;

export type Patrimoine360PrdRole = keyof typeof PATRIMOINE360_PRD_ROLE_LABELS;

export type Patrimoine360RoleSupportStatus =
  | "supported"
  | "partial"
  | "enterprise";

export type Patrimoine360RoleSupportProfile = {
  role: Patrimoine360PrdRole;
  label: string;
  status: Patrimoine360RoleSupportStatus;
  currentPlatformRoles: readonly Roles[];
  currentOrganizationRoles: readonly OrganizationRoles[];
  notes: readonly string[];
};

export const patrimoine360PrdRoleSupport: Record<
  Patrimoine360PrdRole,
  Patrimoine360RoleSupportProfile
> = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    label: PATRIMOINE360_PRD_ROLE_LABELS.SUPER_ADMIN,
    status: "supported",
    currentPlatformRoles: [Roles.ADMIN],
    currentOrganizationRoles: [],
    notes: ["Le Core supporte déjà un rôle plateforme global via Roles.ADMIN."],
  },
  ADMIN: {
    role: "ADMIN",
    label: PATRIMOINE360_PRD_ROLE_LABELS.ADMIN,
    status: "supported",
    currentPlatformRoles: [],
    currentOrganizationRoles: [
      OrganizationRoles.OWNER,
      OrganizationRoles.ADMIN,
    ],
    notes: [
      "Le rôle Administrateur Core correspond aux porteurs OWNER et ADMIN de l'organisation.",
    ],
  },
  PILOTE_GRM: {
    role: "PILOTE_GRM",
    label: PATRIMOINE360_PRD_ROLE_LABELS.PILOTE_GRM,
    status: "enterprise",
    currentPlatformRoles: [],
    currentOrganizationRoles: [],
    notes: ["Dépend des modules Enterprise et de l'accès géographique avancé."],
  },
  EVALUATEUR_CIPM: {
    role: "EVALUATEUR_CIPM",
    label: PATRIMOINE360_PRD_ROLE_LABELS.EVALUATEUR_CIPM,
    status: "enterprise",
    currentPlatformRoles: [],
    currentOrganizationRoles: [],
    notes: ["Dépend des modules Enterprise et de l'accès géographique avancé."],
  },
  RESPONSABLE_SITE: {
    role: "RESPONSABLE_SITE",
    label: PATRIMOINE360_PRD_ROLE_LABELS.RESPONSABLE_SITE,
    status: "partial",
    currentPlatformRoles: [],
    currentOrganizationRoles: [OrganizationRoles.SELF_SERVICE],
    notes: [
      "SELF_SERVICE peut servir d'approximation opérationnelle dans le Core.",
      "Le filtrage par site ou zone n'est pas encore disponible en Core.",
    ],
  },
  LECTEUR: {
    role: "LECTEUR",
    label: PATRIMOINE360_PRD_ROLE_LABELS.LECTEUR,
    status: "partial",
    currentPlatformRoles: [],
    currentOrganizationRoles: [OrganizationRoles.BASE],
    notes: [
      "BASE reste un rôle de consultation partielle et pas encore un lecteur PRD complet.",
    ],
  },
};

const ORGANIZATION_ROLE_PRIORITY: Record<OrganizationRoles, number> = {
  [OrganizationRoles.OWNER]: 4,
  [OrganizationRoles.ADMIN]: 3,
  [OrganizationRoles.SELF_SERVICE]: 2,
  [OrganizationRoles.BASE]: 1,
};

export function getHighestOrganizationRole(
  roles?: readonly OrganizationRoles[] | null
): OrganizationRoles | null {
  if (!roles?.length) {
    return null;
  }

  return [...roles].sort(
    (left, right) =>
      ORGANIZATION_ROLE_PRIORITY[right] - ORGANIZATION_ROLE_PRIORITY[left]
  )[0];
}

export function getPatrimoine360ProjectedRole({
  platformRoles = [],
  organizationRoles = [],
}: {
  platformRoles?: readonly Roles[];
  organizationRoles?: readonly OrganizationRoles[];
}): Patrimoine360RoleSupportProfile | null {
  if (platformRoles.includes(Roles.ADMIN)) {
    return patrimoine360PrdRoleSupport.SUPER_ADMIN;
  }

  const highestOrganizationRole = getHighestOrganizationRole(organizationRoles);

  switch (highestOrganizationRole) {
    case OrganizationRoles.OWNER:
    case OrganizationRoles.ADMIN:
      return patrimoine360PrdRoleSupport.ADMIN;
    case OrganizationRoles.SELF_SERVICE:
      return patrimoine360PrdRoleSupport.RESPONSABLE_SITE;
    case OrganizationRoles.BASE:
      return patrimoine360PrdRoleSupport.LECTEUR;
    default:
      return null;
  }
}
