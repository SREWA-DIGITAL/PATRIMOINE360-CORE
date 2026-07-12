import { emailTemplateCatalog } from "./template-registry.server";

/**
 * This is the text version of the onboarding email.
 */
export const onboardingEmailText = ({ firstName }: { firstName: string }) =>
  emailTemplateCatalog["onboarding.welcome"].text({ firstName });
