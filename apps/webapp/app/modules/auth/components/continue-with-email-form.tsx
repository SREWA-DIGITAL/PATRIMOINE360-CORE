import { useFetcher } from "react-router";
import { useZorm } from "react-zorm";
import { z } from "zod";
import Input from "~/components/forms/input";
import { Button } from "~/components/shared/button";

import type { action } from "~/routes/_auth+/send-otp";
import { validEmail } from "~/utils/misc";
import { tw } from "~/utils/tw";
export const SendOtpSchema = z.object({
  /**
   * .email() has an issue with validating email
   * addresses where the there is a subdomain and a dash included:
   * https://github.com/colinhacks/zod/pull/2157
   * So we use the custom validation
   *  */
  email: z
    .string()
    .transform((email) => email.toLowerCase())
    .refine(validEmail, () => ({
      message: "Veuillez saisir une adresse e-mail valide",
    })),
  mode: z.enum(["login"]).optional(),
});

export function ContinueWithEmailForm({ mode }: { mode: "login" }) {
  const sendOTP = useFetcher<typeof action>();
  const { data, state } = sendOTP;
  const zo = useZorm("NewQuestionWizardScreen", SendOtpSchema);

  const isLoading = state === "submitting" || state === "loading";
  const buttontext = "Continuer avec un code OTP";
  const buttonLabel = isLoading
    ? "Envoi d'un code à usage unique..."
    : buttontext;

  return (
    <sendOTP.Form method="post" action="/send-otp" ref={zo.ref}>
      <input type="hidden" name="mode" value={mode} />
      <Input
        label="Email"
        hideLabel={true}
        type="email"
        name="email"
        id="email"
        inputClassName="w-full"
        placeholder="utilisateur@organisation.ci"
        disabled={isLoading}
        error={zo.errors.email()?.message || ""}
      />
      {data?.error.message ? (
        <div className={tw(` text-red-600`)}>{data.error.message}</div>
      ) : null}
      <Button
        type="submit"
        disabled={isLoading}
        width="full"
        variant="secondary"
        className="mt-3"
        data-test-id="continueWithOtpButton"
        title="Le code à usage unique (OTP) est le moyen le plus sûr de vous connecter. Nous vous enverrons un code par e-mail."
      >
        {buttonLabel}
      </Button>
    </sendOTP.Form>
  );
}
