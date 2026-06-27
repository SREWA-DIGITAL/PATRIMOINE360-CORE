import { useMemo } from "react";

import type {
  ActionFunctionArgs,
  AppLoadContext,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { data, redirect, useLoaderData } from "react-router";
import { z } from "zod";
import type { AuthSession } from "@server/session";
import { Button } from "~/components/shared/button";
import { Spinner } from "~/components/shared/spinner";
import { db } from "~/database/db.server";
import {
  getBetterAuthSessionFromHeaders,
  mapBetterAuthSession,
} from "~/modules/auth/better-auth-session.server";
import { refreshAccessToken } from "~/modules/auth/service.server";
import { setSelectedOrganizationIdCookie } from "~/modules/organization/context.server";
import { getUserOrganizations } from "~/modules/organization/service.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { setCookie } from "~/utils/cookies.server";
import { ShelfError, makeShelfError, notAllowedMethod } from "~/utils/error";
import {
  error,
  getActionMethod,
  parseData,
  payload,
  safeRedirect,
} from "~/utils/http.server";
import {
  assertSSOEnabled,
  resolveUserAndOrgForSsoCallback,
} from "~/utils/sso.server";

/**
 * Schema for handling OAuth callback data with improved groups handling
 * Ensures groups are always an array or empty array, regardless of input format
 */
const CallbackSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  // Transform groups to either parse JSON string array or return empty array
  groups: z
    .union([
      z.string().transform((str) => {
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }),
      z.array(z.string()),
    ])
    .default([]),
  refreshToken: z.string().min(1),
  redirectTo: z.string().optional(),
  // Contact information fields
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

type SsoCallbackInput = {
  authSession: AuthSession;
  contactInfo: {
    phone?: string;
    street?: string;
    city?: string;
    stateProvince?: string;
    zipPostalCode?: string;
    countryRegion?: string;
  };
  firstName: string;
  groups: string[];
  lastName: string;
  redirectTo?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecordValue(
  record: Record<string, unknown> | null,
  key: string
): Record<string, unknown> | null {
  const value = record?.[key];

  return isRecord(value) ? value : null;
}

function getStringValue(
  record: Record<string, unknown> | null,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getStringArrayValue(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

function splitDisplayName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const [firstName, ...rest] = trimmedName.split(/\s+/);

  return {
    firstName: firstName ?? "",
    lastName: rest.join(" ").trim(),
  };
}

function getRedirectTo(request: Request) {
  return new URL(request.url).searchParams.get("redirectTo") ?? undefined;
}

async function finalizeSsoAuthentication(
  context: AppLoadContext,
  input: SsoCallbackInput
) {
  const { authSession, contactInfo, firstName, groups, lastName, redirectTo } =
    input;

  /**
   * This resolves the correct org we should redirect the user to
   * Also it handles:
   * - Creating a new user if the user doesn't exist
   * - Throwing an error if the user is already connected to an email account
   * - Linking the user to the correct org if SCIM is configured
   */
  const { org } = await resolveUserAndOrgForSsoCallback({
    authSession,
    firstName,
    lastName,
    groups,
    contactInfo,
  });

  context.setSession(authSession);

  if (org?.id) {
    return redirect(safeRedirect(redirectTo || "/assets"), {
      headers: [setCookie(await setSelectedOrganizationIdCookie(org.id))],
    });
  }

  const userOrgs = await getUserOrganizations({
    userId: authSession.userId,
  });
  const isSSO = userOrgs[0]?.user?.sso === true;
  const hasTeamOrgs = userOrgs.some(
    (uo) => uo.organization.type !== "PERSONAL"
  );

  if (isSSO && !hasTeamOrgs) {
    return redirect("/sso-pending-assignment");
  }

  return redirect(safeRedirect(redirectTo || "/assets"));
}

async function getBetterAuthSsoInput(
  request: Request
): Promise<SsoCallbackInput | null> {
  const betterAuthSession = await getBetterAuthSessionFromHeaders(
    request.headers
  );

  if (!betterAuthSession) {
    return null;
  }

  const authSession = mapBetterAuthSession(betterAuthSession);
  const betterAuthUser = await db.betterAuthUser.findUnique({
    where: {
      id: authSession.userId,
    },
    select: {
      name: true,
      userMetadata: true,
    },
  });

  if (!betterAuthUser) {
    throw new ShelfError({
      cause: null,
      message: "Better Auth session user could not be found in the database",
      additionalData: {
        userId: authSession.userId,
      },
      label: "Auth",
    });
  }

  const userMetadata = isRecord(betterAuthUser.userMetadata)
    ? betterAuthUser.userMetadata
    : null;
  const customClaims = getRecordValue(userMetadata, "custom_claims");
  const fallbackName = splitDisplayName(
    betterAuthUser.name || authSession.email.split("@")[0] || "User"
  );

  return {
    authSession,
    contactInfo: {
      city: getStringValue(customClaims, ["city"]),
      countryRegion: getStringValue(customClaims, ["country"]),
      phone: getStringValue(customClaims, ["mobilephone", "phone"]),
      stateProvince: getStringValue(customClaims, ["stateProvince", "state"]),
      street: getStringValue(customClaims, ["streetAddress", "street"]),
      zipPostalCode: getStringValue(customClaims, ["postalCode"]),
    },
    firstName:
      getStringValue(customClaims, ["firstname", "firstName"]) ||
      fallbackName.firstName ||
      authSession.email.split("@")[0] ||
      "User",
    groups: getStringArrayValue(customClaims?.groups),
    lastName:
      getStringValue(customClaims, ["lastname", "lastName"]) ||
      fallbackName.lastName,
    redirectTo: getRedirectTo(request),
  };
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    /**
     * Currently the only reason to use oauth/callback is for SSO reasons.
     * Once we start adding social login providers, this will need to be adjusted
     */
    assertSSOEnabled();

    const method = getActionMethod(request);

    switch (method) {
      case "POST": {
        const {
          refreshToken,
          redirectTo,
          firstName,
          lastName,
          groups,
          phone,
          streetAddress,
          city,
          stateProvince,
          postalCode,
          country,
        } = parseData(await request.formData(), CallbackSchema);

        // We should not trust what is sent from the client
        // https://github.com/rphlmr/supa-fly-stack/issues/45
        const authSession = await refreshAccessToken(refreshToken);

        return await finalizeSsoAuthentication(context, {
          authSession,
          contactInfo: {
            phone,
            street: streetAddress,
            city,
            stateProvince,
            zipPostalCode: postalCode,
            countryRegion: country,
          },
          firstName,
          lastName,
          groups,
          redirectTo,
        });
      }
    }

    throw notAllowedMethod(method);
  } catch (cause) {
    const reason = makeShelfError(cause);
    return data(error(reason), { status: reason.status });
  }
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  const title = "Connexion via SSO";
  const subHeading = "Veuillez patienter pendant la connexion de votre compte";

  if (context.isAuthenticated) {
    return redirect("/assets");
  }

  try {
    assertSSOEnabled();

    const betterAuthInput = await getBetterAuthSsoInput(request);

    if (betterAuthInput) {
      return await finalizeSsoAuthentication(context, betterAuthInput);
    }

    return data(
      payload({
        error: {
          message:
            "Impossible de finaliser la connexion SSO avec Better Auth. Veuillez réessayer depuis la page de connexion.",
        },
        title,
        subHeading,
      }),
      { status: 400 }
    );
  } catch (cause) {
    const reason = makeShelfError(cause);

    return data(payload({ error: error(reason), title, subHeading }), {
      status: reason.status,
    });
  }
}

export const meta: MetaFunction = ({ data }) => [
  { title: data ? appendToMetaTitle((data as LoaderDataShape).title) : "" },
];

type LoaderDataShape = {
  error: {
    additionalData?: {
      validationErrors?: Record<string, { message: string }>;
    };
    message: string;
  } | null;
  subHeading: string;
  title: string;
};

export default function LoginCallback() {
  const loaderData = useLoaderData() as LoaderDataShape;
  const callbackError = loaderData.error;
  const validationErrors = useMemo(
    () => loaderData.error?.additionalData?.validationErrors,
    [loaderData.error]
  );

  return (
    <div className="flex justify-center text-center">
      {callbackError ? (
        <div>
          {validationErrors ? (
            Object.values(validationErrors).map((validationError) => (
              <div
                className="text-sm text-error-500"
                key={validationError.message}
              >
                {validationError.message}
              </div>
            ))
          ) : (
            <div className="text-sm text-error-500">
              {callbackError.message}
            </div>
          )}
          <Button to="/" className="mt-4">
            Retour à la connexion
          </Button>
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
