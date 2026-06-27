export const PATRIMOINE360_HIERARCHY_LEVEL_LABELS = {
  PAYS: "Pays",
  REGION: "Région",
  DIRECTION: "Direction",
  VILLE: "Ville",
  SITE: "Site",
  AGENCE: "Agence",
  BATIMENT: "Bâtiment",
  ETAGE: "Étage",
  SALLE: "Salle",
} as const;

export type Patrimoine360HierarchyLevel =
  keyof typeof PATRIMOINE360_HIERARCHY_LEVEL_LABELS;

export type Patrimoine360HierarchyProfile = {
  id: "core-default" | "cnps-core" | "nsia-country-core";
  label: string;
  organizationScope: string;
  locationLevels: readonly Patrimoine360HierarchyLevel[];
  notes: readonly string[];
};

/**
 * Why: Phase 8E formalizes the business hierarchy without forcing an immediate
 * Prisma rename. These profiles are documentation-in-code for future UI and
 * seed alignment.
 */
export const patrimoine360HierarchyProfiles: Record<
  Patrimoine360HierarchyProfile["id"],
  Patrimoine360HierarchyProfile
> = {
  "core-default": {
    id: "core-default",
    label: "Core Patrimoine360",
    organizationScope: "Une organisation = un périmètre de travail autonome",
    locationLevels: ["SITE", "BATIMENT", "ETAGE", "SALLE"],
    notes: [
      "Le Core garde Organization comme racine de sécurité et de données.",
      "Location porte l'arbre métier visible par l'utilisateur.",
    ],
  },
  "cnps-core": {
    id: "cnps-core",
    label: "CNPS Côte d'Ivoire",
    organizationScope: "Une organisation = CNPS Côte d'Ivoire",
    locationLevels: ["DIRECTION", "SITE", "BATIMENT", "ETAGE", "SALLE"],
    notes: [
      "Le siège social et les directions sont modélisés comme nœuds Location.",
      "La distinction Abidjan / Banlieue reste une convention métier Core.",
    ],
  },
  "nsia-country-core": {
    id: "nsia-country-core",
    label: "NSIA Banque par pays",
    organizationScope:
      "Une organisation = une entité pays, par exemple NSIA Banque Côte d'Ivoire",
    locationLevels: [
      "REGION",
      "DIRECTION",
      "AGENCE",
      "BATIMENT",
      "ETAGE",
      "SALLE",
    ],
    notes: [
      "Le niveau Groupe n'entre pas dans le Core transverse.",
      "La consolidation multi-pays et le RBAC géographique avancé restent Enterprise.",
    ],
  },
};

export function getPatrimoine360HierarchyProfile(
  profileId: Patrimoine360HierarchyProfile["id"]
) {
  return patrimoine360HierarchyProfiles[profileId];
}
