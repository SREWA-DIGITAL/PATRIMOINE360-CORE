import {
  COLLECT_BUSINESS_INTEL,
  DISABLE_SIGNUP,
  DISABLE_SSO,
  ENABLE_PREMIUM_FEATURES,
  FREE_TRIAL_DAYS,
  GEOCODING_USER_AGENT,
  LICENSE_TYPE,
  SEND_ONBOARDING_EMAIL,
  SHOW_HOW_DID_YOU_FIND_US,
} from "~/utils/env";
import {
  isEnterpriseLicenseType,
  normalizeLicenseType,
} from "~/utils/license";
import type { Config } from "./types";

const licenseType = normalizeLicenseType(LICENSE_TYPE);
const isEnterpriseLicense = isEnterpriseLicenseType(licenseType);

export const config: Config = {
  brand: {
    name: "Patrimoine360",
    shortName: "P360",
    description: "Gestion des sites, biens, affectations et rappels.",
    sourceAttribution: "Adapté de Shelf.nu, sous licence AGPL-3.0.",
  },
  license: {
    type: licenseType,
    isEnterprise: isEnterpriseLicense,
  },
  sendOnboardingEmail: SEND_ONBOARDING_EMAIL || false,
  enablePremiumFeatures: isEnterpriseLicense && ENABLE_PREMIUM_FEATURES,
  freeTrialDays: Number(FREE_TRIAL_DAYS || 7),
  disableSignup: DISABLE_SIGNUP || false,
  disableSSO: !isEnterpriseLicense || DISABLE_SSO || false,
  faviconPath: "/static/favicon.ico",
  emailPrimaryColor: "#0F766E",
  showHowDidYouFindUs: SHOW_HOW_DID_YOU_FIND_US || false,
  collectBusinessIntel:
    COLLECT_BUSINESS_INTEL || SHOW_HOW_DID_YOU_FIND_US || false,
  geocoding: {
    userAgent: GEOCODING_USER_AGENT || "Patrimoine360 Core",
  },
};
