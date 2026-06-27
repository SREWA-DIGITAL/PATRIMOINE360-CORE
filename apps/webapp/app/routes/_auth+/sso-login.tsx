import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import {
  data,
  redirect,
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { useZorm } from "react-zorm";
import { z } from "zod";
import Input from "~/components/forms/input";
import { Button } from "~/components/shared/button";
import { useAutoFocus } from "~/hooks/use-auto-focus";
import { signInWithSSO } from "~/modules/auth/service.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { SUPPORT_EMAIL } from "~/utils/env";
import { makeShelfError, notAllowedMethod } from "~/utils/error";
import { isFormProcessing } from "~/utils/form";
import {
  payload,
  error,
  getActionMethod,
  parseData,
} from "~/utils/http.server";
import { isValidDomain } from "~/utils/misc";
import { assertSSOEnabled } from "~/utils/sso.server";

const SSOLoginFormSchema = z.object({
  domain: z
    .string()
    .transform((email) => email.toLowerCase())
    .refine(isValidDomain, () => ({
      message: "Please enter a valid domain name",
    })),
  redirectTo: z.string().optional(),
});

export function loader({ context, request }: LoaderFunctionArgs) {
  const title = "Connexion SSO";
  const subHeading =
    "Saisissez le domaine de votre organisation pour continuer.";
  const redirectTo =
    new URL(request.url).searchParams.get("redirectTo") ?? undefined;

  try {
    if (context.isAuthenticated) {
      return redirect("/assets");
    }

    assertSSOEnabled();

    return payload({ redirectTo, title, subHeading });
  } catch (cause) {
    const reason = makeShelfError(cause);
    throw data(error(reason), { status: reason.status });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    assertSSOEnabled();

    const method = getActionMethod(request);

    switch (method) {
      case "POST": {
        const { domain, redirectTo } = parseData(
          await request.formData(),
          SSOLoginFormSchema,
          { shouldBeCaptured: false }
        );
        const url = await signInWithSSO(domain, redirectTo);

        return redirect(url);
      }
    }

    throw notAllowedMethod(method);
  } catch (cause) {
    const reason = makeShelfError(cause);
    return data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? appendToMetaTitle(data.title) : "" },
];

export default function SSOLogin() {
  const { redirectTo } = useLoaderData<typeof loader>();
  const zo = useZorm("NewQuestionWizardScreen", SSOLoginFormSchema);
  const navigation = useNavigation();
  const disabled = isFormProcessing(navigation.state);
  const data = useActionData<typeof action>();

  /** Focus the domain field on mount (intentional first-field focus on auth pages). */
  const domainInputRef = useAutoFocus<HTMLInputElement>();

  return (
    <>
      <div className="flex flex-col gap-3">
        <Form method="post" ref={zo.ref}>
          <div className="flex flex-col gap-3">
            <Input
              ref={domainInputRef}
              data-test-id="domain"
              label="Domaine de l'organisation"
              placeholder="yourdomain.com"
              required
              name={zo.fields.domain()}
              type="text"
              autoComplete="domain"
              disabled={disabled}
              inputClassName="w-full"
              error={zo.errors.domain()?.message}
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
              Se connecter
            </Button>
          </div>
        </Form>
        {data?.error?.message && (
          <div className="text-sm text-error-500">{data.error.message}</div>
        )}
        {SUPPORT_EMAIL ? (
          <div>
            Vous souhaitez activer le SSO pour votre organisation ?{" "}
            <Button
              as="a"
              href={`mailto:${SUPPORT_EMAIL}?subject=SSO request`}
              variant="link"
            >
              Contacter le support
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}
