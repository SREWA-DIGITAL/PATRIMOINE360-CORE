import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { useZorm } from "react-zorm";
import { z } from "zod";
import { Form } from "~/components/custom-form";

import Input from "~/components/forms/input";
import PasswordInput from "~/components/forms/password-input";
import { Button } from "~/components/shared/button";
import { config } from "~/config/shelf.config";
import { useSearchParams } from "~/hooks/search-params";
import { useAutoFocus } from "~/hooks/use-auto-focus";
import { ContinueWithEmailForm } from "~/modules/auth/components/continue-with-email-form";
import { signInWithEmail } from "~/modules/auth/service.server";

import {
  getSelectedOrganization,
  setSelectedOrganizationIdCookie,
} from "~/modules/organization/context.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { setCookie } from "~/utils/cookies.server";
import {
  ShelfError,
  isLikeShelfError,
  isZodValidationError,
  makeShelfError,
  notAllowedMethod,
} from "~/utils/error";
import { isFormProcessing } from "~/utils/form";
import {
  payload,
  error,
  getActionMethod,
  parseData,
  safeRedirect,
} from "~/utils/http.server";
import { validEmail } from "~/utils/misc";

export function loader({ context }: LoaderFunctionArgs) {
  const title = "Connexion";
  const subHeading =
    "Bienvenue. Renseignez vos informations pour accéder à votre espace.";
  const { disableSignup, disableSSO } = config;

  if (context.isAuthenticated) {
    return redirect("/assets");
  }

  return data(payload({ title, subHeading, disableSignup, disableSSO }));
}

const LoginFormSchema = z.object({
  email: z
    .string()
    .transform((email) => email.toLowerCase())
    .refine(validEmail, () => ({
      message: "Veuillez saisir une adresse e-mail valide",
    })),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  redirectTo: z.string().optional(),
});

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    const method = getActionMethod(request);

    switch (method) {
      case "POST": {
        // Guard against bots sending non-form content types
        const contentType = request.headers.get("content-type") || "";
        if (
          !contentType.includes("application/x-www-form-urlencoded") &&
          !contentType.includes("multipart/form-data")
        ) {
          return data(
            error(
              new ShelfError({
                cause: null,
                message: "Invalid request",
                label: "Request validation",
                shouldBeCaptured: false,
                status: 400,
              }),
              false
            ),
            { status: 400 }
          );
        }

        let formData: FormData;
        try {
          formData = await request.formData();
        } catch (cause) {
          return data(
            error(
              new ShelfError({
                cause,
                message: "Invalid request body",
                label: "Request validation",
                shouldBeCaptured: false,
                status: 400,
              }),
              false
            ),
            { status: 400 }
          );
        }

        const { email, password, redirectTo } = parseData(
          formData,
          LoginFormSchema,
          { shouldBeCaptured: false }
        );

        const authSession = await signInWithEmail(email, password, redirectTo);

        if (!authSession) {
          return redirect(`/otp?email=${encodeURIComponent(email)}&mode=login`);
        }
        const { userId } = authSession;

        /**
         * The only reason we need to do this is because of the initial login
         * Theoretically, the user should always have a selected organization cookie as soon as they login for the first time
         * However we do this check to make sure they are still part of that organization
         */
        const { organizationId } = await getSelectedOrganization({
          userId,
          request,
        });

        // Set the auth session and redirect to the assets page
        context.setSession(authSession);

        return redirect(safeRedirect(redirectTo || "/assets"), {
          headers: [
            setCookie(await setSelectedOrganizationIdCookie(organizationId)),
          ],
        });
      }
    }

    throw notAllowedMethod(method);
  } catch (cause) {
    if (
      isLikeShelfError(cause) &&
      cause.additionalData?.authState === "email-not-verified" &&
      typeof cause.additionalData.email === "string"
    ) {
      const params = new URLSearchParams({
        email: cause.additionalData.email,
        email_sent: "true",
      });

      if (typeof cause.additionalData.redirectTo === "string") {
        params.set("redirectTo", cause.additionalData.redirectTo);
      }

      return redirect(`/login?${params.toString()}`);
    }

    const reason = makeShelfError(
      cause,
      undefined,
      isLikeShelfError(cause)
        ? cause.shouldBeCaptured
        : !isZodValidationError(cause)
    );
    return data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? appendToMetaTitle(data.title) : "" },
];

export default function IndexLoginForm() {
  const { disableSignup, disableSSO } = useLoaderData<typeof loader>();
  const zo = useZorm("NewQuestionWizardScreen", LoginFormSchema);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const acceptedInvite = searchParams.get("acceptedInvite");
  const emailSent = searchParams.get("email_sent");
  const emailVerified = searchParams.get("email_verified");
  const passwordReset = searchParams.get("password_reset");
  const data = useActionData<typeof action>();

  const navigation = useNavigation();
  const disabled = isFormProcessing(navigation.state);

  /** Focus the email field on mount (intentional first-field focus on auth pages). */
  const emailInputRef = useAutoFocus<HTMLInputElement>();

  return (
    <div className="w-full max-w-md">
      {acceptedInvite ? (
        <div className="mb-8 text-center text-success-600">
          Invitation à l'espace de travail acceptée. Connectez-vous pour accéder
          à votre nouvel espace.
        </div>
      ) : null}

      {passwordReset ? (
        <div className="mb-8 text-center text-success-600">
          Votre mot de passe a bien été réinitialisé. Vous pouvez maintenant
          vous connecter.
        </div>
      ) : null}
      {emailSent ? (
        <div className="mb-8 text-center text-success-600">
          Consultez votre boîte de réception puis cliquez sur le lien de
          vérification avant de vous connecter.
        </div>
      ) : null}
      {emailVerified ? (
        <div className="mb-8 text-center text-success-600">
          Votre adresse e-mail a été vérifiée. Vous pouvez maintenant vous
          connecter.
        </div>
      ) : null}
      <Form ref={zo.ref} method="post" replace className="flex flex-col gap-5">
        <div>
          <Input
            ref={emailInputRef}
            data-test-id="email"
            label="Adresse e-mail"
            placeholder="zaans@huisje.com"
            required
            name={zo.fields.email()}
            type="email"
            autoComplete="username"
            disabled={disabled}
            inputClassName="w-full"
            error={zo.errors.email()?.message || data?.error.message}
          />
        </div>
        <PasswordInput
          label="Mot de passe"
          placeholder="**********"
          data-test-id="password"
          name={zo.fields.password()}
          autoComplete="current-password"
          disabled={disabled}
          inputClassName="w-full"
          error={zo.errors.password()?.message || data?.error.message}
        />
        <input type="hidden" name={zo.fields.redirectTo()} value={redirectTo} />
        <Button
          className="text-center"
          type="submit"
          data-test-id="login"
          disabled={disabled}
        >
          Se connecter
        </Button>
        <div className="flex flex-col items-center justify-center">
          <div className="text-center text-sm text-gray-500">
            Mot de passe oublié ?{" "}
            <Button
              variant="link"
              to={{
                pathname: "/forgot-password",
                search: searchParams.toString(),
              }}
            >
              Réinitialiser le mot de passe
            </Button>
          </div>
        </div>
      </Form>
      {!disableSSO && (
        <div className="mt-6 text-center">
          <Button
            variant="link"
            to={{
              pathname: "/sso-login",
              search: searchParams.toString(),
            }}
          >
            Se connecter avec SSO
          </Button>
        </div>
      )}

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              Ou utilisez un{" "}
              <strong title="Le code à usage unique (OTP) est le moyen le plus sûr de vous connecter. Nous vous enverrons un code par e-mail.">
                code à usage unique
              </strong>
            </span>
          </div>
        </div>
        <div className="mt-6">
          <ContinueWithEmailForm mode="login" />
        </div>
        {disableSignup ? null : (
          <div className="mt-6 text-center text-sm text-gray-500">
            Vous n'avez pas de compte ?{" "}
            <Button
              variant="link"
              data-test-id="signupButton"
              to={{
                pathname: "/join",
                search: searchParams.toString(),
              }}
            >
              Créer un compte
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
