import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  MetaFunction,
} from "react-router";
import { redirect, data, useActionData, useNavigation } from "react-router";

import { useZorm } from "react-zorm";
import { z } from "zod";
import { Form } from "~/components/custom-form";

import Input from "~/components/forms/input";
import PasswordInput from "~/components/forms/password-input";
import { Button } from "~/components/shared/button";
import { config } from "~/config/shelf.config";
import { useSearchParams } from "~/hooks/search-params";
import { useAutoFocus } from "~/hooks/use-auto-focus";
import { signUpWithBetterAuthEmailPass } from "~/modules/auth/service.server";
import { findUserByEmail } from "~/modules/user/service.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import {
  ShelfError,
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
} from "~/utils/http.server";
import { validEmail } from "~/utils/misc";
import { validateNonSSOSignup } from "~/utils/sso.server";

export function loader({ context }: LoaderFunctionArgs) {
  const title = "Créer un compte";
  const subHeading = "Commencez avec Patrimoine360";
  const { disableSignup } = config;

  try {
    if (disableSignup) {
      throw new ShelfError({
        cause: null,
        title: "Signup is disabled",
        message:
          "La création de compte est désactivée. Pour plus d'informations, contactez l'administrateur de votre espace de travail.",
        label: "User onboarding",
        status: 403,
        shouldBeCaptured: false,
      });
    }
    if (context.isAuthenticated) {
      return redirect("/assets");
    }

    return data(payload({ title, subHeading }));
  } catch (cause) {
    const reason = makeShelfError(cause);
    throw data(error(reason), { status: reason.status });
  }
}

const JoinFormSchema = z
  .object({
    email: z
      .string()
      .transform((email) => email.toLowerCase())
      .refine(validEmail, () => ({
        message: "Veuillez saisir une adresse e-mail valide",
      })),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    redirectTo: z.string().optional(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Les deux mots de passe doivent être identiques",
        path: ["confirmPassword"],
      });
    }
  });

export async function action({ request }: ActionFunctionArgs) {
  try {
    const method = getActionMethod(request);

    switch (getActionMethod(request)) {
      case "POST": {
        const { email, password, redirectTo } = parseData(
          await request.formData(),
          JoinFormSchema,
          { shouldBeCaptured: false }
        );
        // Block signup if domain uses SSO
        await validateNonSSOSignup(email);

        const existingUser = await findUserByEmail(email);

        if (existingUser) {
          throw new ShelfError({
            cause: null,
            message:
              "Un utilisateur avec cette adresse e-mail existe déjà. Connectez-vous à la place.",
            additionalData: {
              email,
            },
            label: "User onboarding",
            shouldBeCaptured: false,
            status: 409,
          });
        }

        // Sign up with the provided email and password
        await signUpWithBetterAuthEmailPass(email, password, redirectTo);

        const params = new URLSearchParams({
          email,
          email_sent: "true",
        });

        if (redirectTo) {
          params.set("redirectTo", redirectTo);
        }

        return redirect(`/login?${params.toString()}`);
      }
    }

    throw notAllowedMethod(method);
  } catch (cause) {
    const reason = makeShelfError(
      cause,
      undefined,
      isZodValidationError(cause)
    );
    return data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? appendToMetaTitle(data.title) : "" },
];

export default function Join() {
  const zo = useZorm("NewQuestionWizardScreen", JoinFormSchema);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const navigation = useNavigation();
  const disabled = isFormProcessing(navigation.state);
  const data = useActionData<typeof action>();

  /** Focus the email field on mount (intentional first-field focus on auth pages). */
  const emailInputRef = useAutoFocus<HTMLInputElement>();

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md">
        <Form ref={zo.ref} method="post" className="space-y-6" replace>
          <div>
            <Input
              ref={emailInputRef}
              data-test-id="email"
              label="Adresse e-mail"
              placeholder="zaans@huisje.com"
              required
              name={zo.fields.email()}
              type="email"
              autoComplete="email"
              disabled={disabled}
              inputClassName="w-full"
              error={zo.errors.email()?.message || data?.error.message}
            />
          </div>

          <PasswordInput
            label="Mot de passe"
            placeholder="**********"
            required
            data-test-id="password"
            name={zo.fields.password()}
            autoComplete="new-password"
            disabled={disabled}
            inputClassName="w-full"
            error={zo.errors.password()?.message}
          />
          <PasswordInput
            label="Confirmer le mot de passe"
            placeholder="**********"
            required
            data-test-id="confirmPassword"
            name={zo.fields.confirmPassword()}
            autoComplete="new-password"
            disabled={disabled}
            inputClassName="w-full"
            error={zo.errors.confirmPassword()?.message}
          />

          <input
            type="hidden"
            name={zo.fields.redirectTo()}
            value={redirectTo}
          />
          <Button
            className="text-center"
            type="submit"
            data-test-id="login"
            disabled={disabled}
            width="full"
          >
            Commencer
          </Button>
        </Form>
        <div className="flex items-center justify-center pt-5">
          <div className="text-center text-sm text-gray-500">
            {"Vous avez déjà un compte ? "}
            <Button
              variant="link"
              to={{
                pathname: "/",
                search: searchParams.toString(),
              }}
            >
              Se connecter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
