import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { data, redirect, useActionData } from "react-router";
import { useZorm } from "react-zorm";
import { z } from "zod";
import { Form } from "~/components/custom-form";
import Input from "~/components/forms/input";
import { ShelfOTP } from "~/components/forms/otp-input";
import PasswordInput from "~/components/forms/password-input";
import { Button } from "~/components/shared/button";
import { db } from "~/database/db.server";
import { useSearchParams } from "~/hooks/search-params";
import { useDisabled } from "~/hooks/use-disabled";

import {
  resetPasswordWithOtp,
  sendResetPasswordLink,
} from "~/modules/auth/service.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { makeShelfError, ShelfError } from "~/utils/error";
import {
  payload,
  error,
  getCurrentSearchParams,
  parseData,
  readFormData,
} from "~/utils/http.server";
import { validEmail } from "~/utils/misc";

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .transform((email) => email.toLowerCase())
    .refine(validEmail, () => ({
      message: "Veuillez saisir une adresse e-mail valide",
    })),
});

const OtpSchema = z
  .object({
    otp: z.string().min(6, "Le code OTP est requis."),
    email: z.string().transform((email) => email.toLowerCase()),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  })
  .superRefine(({ password, confirmPassword, otp, email }, ctx) => {
    if (password !== confirmPassword) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Les deux mots de passe doivent être identiques",
        path: ["confirmPassword"],
      });
    }

    return { password, confirmPassword, otp, email };
  });

export function loader({ context, request }: LoaderFunctionArgs) {
  const searchParams = getCurrentSearchParams(request);

  const title = "Mot de passe oublié ?";
  const subHeading =
    searchParams.has("email") && searchParams.get("email") !== ""
      ? "Étape 2 sur 2 : saisissez le code et votre nouveau mot de passe"
      : "Étape 1 sur 2 : saisissez votre adresse e-mail";

  if (context.isAuthenticated) {
    return redirect("/assets");
  }

  return data(payload({ title, subHeading }));
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const { intent } = parseData(
      await readFormData(request.clone()),
      z.object({ intent: z.enum(["request-otp", "confirm-otp"]) }),
      {
        message:
          "Requête invalide. Veuillez réessayer. Si le problème persiste, contactez le support.",
        shouldBeCaptured: false,
      }
    );

    switch (intent) {
      case "request-otp": {
        const { email } = parseData(
          await readFormData(request),
          ForgotPasswordSchema,
          { shouldBeCaptured: false }
        );

        /** We are going to get the user to make sure it exists and is confirmed
         * this will not allow the user to use the forgot password before they have confirmed their email
         */
        const user = await db.user.findFirst({
          where: { email },
          select: {
            id: true,
            sso: true,
          },
        });

        if (!user) {
          throw new ShelfError({
            cause: null,
            message:
              "Aucun compte confirmé n'est associé à cette adresse e-mail. Veuillez d'abord confirmer votre compte avant de continuer.",
            additionalData: { email },
            shouldBeCaptured: false,
            label: "Auth",
          });
        }

        if (user.sso) {
          throw new ShelfError({
            cause: null,
            message:
              "Ce compte utilise le SSO et ne peut pas réinitialiser son mot de passe par e-mail.",
            additionalData: { email },
            shouldBeCaptured: false,
            label: "Auth",
          });
        }

        await sendResetPasswordLink(email);

        return redirect("/forgot-password?email=" + email);
      }
      case "confirm-otp": {
        const { email, otp, password } = parseData(
          await readFormData(request.clone()),
          OtpSchema,
          { shouldBeCaptured: false }
        );

        await resetPasswordWithOtp(email, otp, password);

        context.destroySession();
        return redirect("/login?password_reset=true");
      }
    }
  } catch (cause) {
    const reason = makeShelfError(cause);
    return data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? appendToMetaTitle(data.title) : "" },
];

export default function ForgotPassword() {
  const zo = useZorm("ForgotPasswordForm", ForgotPasswordSchema);
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const emailError =
    zo.errors.email()?.message || actionData?.error?.message || "";
  const disabled = useDisabled();

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full">
        {actionData?.error || !email || email === "" ? (
          <div>
            <p className="mb-4 text-center">
              Saisissez votre adresse e-mail et nous vous enverrons un code à
              usage unique pour réinitialiser votre mot de passe.
            </p>
            <Form ref={zo.ref} method="post" className="space-y-2" replace>
              <input type="hidden" name="intent" value="request-otp" />
              <div>
                <Input
                  label="Adresse e-mail"
                  data-test-id="email"
                  name={zo.fields.email()}
                  type="email"
                  autoComplete="email"
                  inputClassName="w-full"
                  placeholder="zaans@huisje.com"
                  disabled={disabled}
                  error={emailError}
                />
              </div>

              <Button
                data-test-id="send-password-reset-link"
                width="full"
                type="submit"
                disabled={disabled}
              >
                {!disabled
                  ? "Réinitialiser le mot de passe"
                  : "Envoi du code..."}
              </Button>
            </Form>
            <p className="mt-2 text-center text-gray-500">
              Conseil : vérifiez vos courriers indésirables si vous ne voyez pas
              l'e-mail dans les prochaines minutes.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2">
              Nous avons envoyé un code à 6 chiffres à{" "}
              <span className="font-semibold">{email}</span>.
            </p>
            <ol className="mb-4 list-inside list-decimal">
              <li>Saisissez le code reçu par e-mail</li>
              <li>Saisissez votre nouveau mot de passe</li>
              <li>Confirmez votre nouveau mot de passe</li>
            </ol>
            <PasswordResetForm email={email} />
          </>
        )}
        <div className="pt-4 text-center">
          {email ? (
            <Button variant="link" to={"/forgot-password"}>
              Demander un nouveau code
            </Button>
          ) : (
            <Button variant="link" to={"/login"}>
              Retour à la connexion
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordResetForm({ email }: { email: string }) {
  const zoReset = useZorm("ResetPasswordForm", OtpSchema);
  const disabled = useDisabled();
  const actionData = useActionData<typeof action>();
  return !email || email === "" || actionData?.error ? (
    <div>Une erreur est survenue. Actualisez la page puis réessayez.</div>
  ) : (
    <Form method="post" ref={zoReset.ref} className="space-y-2">
      <ShelfOTP error={zoReset.errors.otp()?.message} />

      <PasswordInput
        label="Nouveau mot de passe"
        data-test-id="password"
        name={zoReset.fields.password()}
        type="password"
        autoComplete="new-password"
        disabled={disabled}
        error={zoReset.errors.password()?.message}
        placeholder="********"
        required
      />
      <PasswordInput
        label="Confirmer le nouveau mot de passe"
        data-test-id="confirmPassword"
        name={zoReset.fields.confirmPassword()}
        type="password"
        autoComplete="new-password"
        disabled={disabled}
        error={zoReset.errors.confirmPassword()?.message}
        placeholder="********"
        required
      />

      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="intent" value="confirm-otp" />

      <Button
        data-test-id="create-account"
        type="submit"
        className="w-full "
        disabled={disabled}
      >
        Confirmer la réinitialisation
      </Button>
    </Form>
  );
}
