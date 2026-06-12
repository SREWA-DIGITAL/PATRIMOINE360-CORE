import { ShelfError } from "./error";

export type LicenseType = "core" | "enterprise";

export function normalizeLicenseType(value?: string): LicenseType {
  return value?.toLowerCase() === "enterprise" ? "enterprise" : "core";
}

export function isEnterpriseLicenseType(licenseType: LicenseType) {
  return licenseType === "enterprise";
}

export function assertEnterpriseFeature(
  featureName: string,
  licenseType: LicenseType
) {
  if (isEnterpriseLicenseType(licenseType)) return;

  throw new ShelfError({
    cause: null,
    title: "Fonction Enterprise inactive",
    message: `${featureName} est reserve aux deploiements Enterprise Patrimoine360.`,
    label: "Permission",
    status: 403,
    shouldBeCaptured: false,
  });
}
