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
import { isEnterpriseLicenseType, normalizeLicenseType } from "~/utils/license";
import type { Config } from "./types";

const licenseType = normalizeLicenseType(LICENSE_TYPE);
const isEnterpriseLicense = isEnterpriseLicenseType(licenseType);

export const config: Config = {
  brand: {
    name: "Patrimoine360",
    shortName: "P360",
    description: "Gestion des sites, biens, affectations et rappels.",
    sourceAttribution: "",
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
  logoPath: {
    fullLogo: "/static/images/brand/patrimoine360-wordmark.png",
    symbol: "/static/images/brand/patrimoine360-icon-512.png",
  },
  faviconPath: "/static/images/brand/patrimoine360-icon-192.png",
  emailPrimaryColor: "#08233B",
  showHowDidYouFindUs: SHOW_HOW_DID_YOU_FIND_US || false,
  collectBusinessIntel:
    COLLECT_BUSINESS_INTEL || SHOW_HOW_DID_YOU_FIND_US || false,
  geocoding: {
    userAgent: GEOCODING_USER_AGENT || "Patrimoine360 Core",
  },
};
