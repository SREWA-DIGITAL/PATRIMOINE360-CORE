import { InviteStatuses } from "@prisma/client";
import type { LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  Form,
  useActionData,
  useLoaderData,
} from "react-router";
import { z } from "zod";
import { Button } from "~/components/shared/button";
import { db } from "~/database/db.server";
import { useSearchParams } from "~/hooks/search-params";
import { useDisabled } from "~/hooks/use-disabled";
import { signInWithEmail } from "~/modules/auth/service.server";
import { generateRandomCode } from "~/modules/invite/helpers";
import {
  checkUserAndInviteMatch,
  updateInviteStatus,
} from "~/modules/invite/service.server";
import { setSelectedOrganizationIdCookie } from "~/modules/organization/context.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { setCookie } from "~/utils/cookies.server";
import { INVITE_TOKEN_SECRET, SUPPORT_EMAIL } from "~/utils/env";
import { ShelfError, makeShelfError } from "~/utils/error";
import {
  payload,
  error,
  getParams,
  parseData,
  safeRedirect,
} from "~/utils/http.server";
import jwt from "~/utils/jsonwebtoken.server";
import { resolveUserDisplayName } from "~/utils/user";

export async function loader({ context, params }: LoaderFunctionArgs) {
  const { inviteId } = getParams(params, z.object({ inviteId: z.string() }), {
    additionalData: { inviteId: params.inviteId },
  });
  try {
    /** We get the invite based on the id of the params */
    const invite = await db.invite
      .findFirstOrThrow({
        where: {
          id: inviteId,
        },
        include: {
          organization: {
            select: {
              name: true,
            },
          },
          inviter: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      })
      .catch((cause) => {
        throw new ShelfError({
          cause,
          title: "Invitation introuvable",
          message:
            "L'invitation que vous essayez d'accepter est introuvable ou a expiré.",
          label: "Invite",
        });
      });

    /** Here we have to do a check based on the session of the current user
     * If the user is already signed in, we have to make sure the invite sent, is for the same user
     */
    if (context.isAuthenticated) {
      await checkUserAndInviteMatch({
        context,
        invite,
      });
    }

    return payload({
      inviter: resolveUserDisplayName(invite.inviter),
      workspace: `${invite.organization.name}`,
    });
  } catch (cause) {
    const reason = makeShelfError(cause);
    throw data(
      error({
        ...reason,
        title: reason.title || "Accepter une invitation d'équipe",
      }),
      {
        status: reason.status,
      }
    );
  }
}

export const meta = () => [
  { title: appendToMetaTitle("Accepter une invitation d'équipe") },
];

export async function action({ context, request }: LoaderFunctionArgs) {
  try {
    const { token } = parseData(
      await request.formData(),
      z.object({ token: z.string() }),
      {
        message:
          "Le lien d'invitation ne contient pas de jeton. Veuillez recliquer sur le lien reçu par e-mail ou demander une nouvelle invitation. Si le problème persiste, contactez le support.",
      }
    );

    const decodedInvite = jwt.verify(token, INVITE_TOKEN_SECRET) as {
      id: string;
    };
    const password = generateRandomCode(10);
    const updatedInvite = await updateInviteStatus({
      id: decodedInvite.id,
      status: InviteStatuses.ACCEPTED,
      password,
    });

    if (updatedInvite.status !== InviteStatuses.ACCEPTED) {
      throw new ShelfError({
        cause: null,
        message:
          "Une erreur est survenue lors de la mise à jour de votre invitation. Veuillez réessayer.",
        label: "Invite",
      });
    }

    /** If the user is already signed in, we jus redirect them to assets index and set */
    if (context.isAuthenticated) {
      return redirect(safeRedirect(`/assets`), {
        headers: [
          setCookie(
            await setSelectedOrganizationIdCookie(updatedInvite.organizationId)
          ),
        ],
      });
    }

    /** Sign in the user */
    const authSession = await signInWithEmail(
      updatedInvite.inviteeEmail,
      password
    ).catch(
      // We don't care about the error here, let the user login if he's already registered
      () => null
    );

    /**
     * User could already be registered and hence login in with our password failed,
     * redirect to home and let user login or go to home */
    if (!authSession) {
      return redirect("/login?acceptedInvite=yes");
    }

    // Commit the session
    context.setSession(authSession);

    return redirect(
      safeRedirect(
        `/onboarding?organizationId=${updatedInvite.organizationId}`
      ),
      {
        headers: [
          setCookie(
            await setSelectedOrganizationIdCookie(updatedInvite.organizationId)
          ),
        ],
      }
    );
  } catch (cause) {
    const reason = makeShelfError(cause);
    let titleOverride = null;
    if (cause instanceof Error && cause.name === "JsonWebTokenError") {
      titleOverride = "Jeton d'invitation invalide";
      reason.message =
        "Le lien d'invitation est invalide. Veuillez recliquer sur le lien reçu par e-mail ou demander une nouvelle invitation. Si le problème persiste, contactez le support.";
    }

    return data(
      error({
        ...reason,
        title:
          titleOverride ?? (reason.title || "Accepter une invitation d'équipe"),
      }),
      {
        status: reason.status,
      }
    );
  }
}

/**
 * Splits a multi-line error message into objects with stable, position-based
 * ids so the rendered list has unique keys that don't depend on the array
 * index expression (satisfies react-doctor/no-array-index-as-key).
 */
function splitIntoStableLines(message: string) {
  let offset = 0;
  return message.split("\n").map((content) => {
    const id = `line-${offset}`;
    offset += content.length + 1;
    return { id, content };
  });
}

export default function AcceptInvite() {
  const { inviter, workspace } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const disabled = useDisabled();
  const actionData = useActionData<typeof action>();
  const error = actionData?.error;
  return (
    <>
      <div className=" flex flex-col items-center text-center">
        {error ? (
          <div>
            <h2>{error.title}</h2>
            {/*
             * Render the error message as text (not HTML) to avoid any XSS
             * surface. Newlines are preserved via <br/> so multi-line error
             * copy keeps its visual structure.
             */}
            <p className="mx-4 mb-3 mt-2 md:mx-[-200px]">
              {splitIntoStableLines(error.message).map((line, i) => (
                <span key={line.id}>
                  {i > 0 && <br />}
                  {line.content}
                </span>
              ))}
            </p>
            <Button to="/" variant={"secondary"}>
              Retour à la connexion
            </Button>
          </div>
        ) : (
          <div>
            <h2>Accepter l'invitation</h2>
            <p className="mt-2">
              <strong>{inviter}</strong> vous invite à rejoindre Patrimoine360
              comme membre de l'espace <strong>{workspace}</strong>.
            </p>
            <Form method="post" className="my-3">
              <input
                type="hidden"
                name="token"
                value={searchParams.get("token") || ""}
              />

              <Button type="submit" disabled={disabled || error}>
                {disabled
                  ? "Validation de l'invitation..."
                  : "Accepter l'invitation"}
              </Button>
            </Form>
          </div>
        )}
      </div>
      <div className=" mx-4 mt-20 flex flex-col items-center text-center text-gray-600 md:mx-[-200px]">
        <p>
          Si vous avez des questions ou besoin d'aide, contactez notre équipe
          support à l'adresse{" "}
          <Button variant={"link-gray"} to={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </Button>
          .
        </p>
      </div>
    </>
  );
}
