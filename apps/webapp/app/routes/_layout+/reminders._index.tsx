import { data } from "react-router";
import type {
  MetaFunction,
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "react-router";
import RemindersTable from "~/components/asset-reminder/reminders-table";
import Header from "~/components/layout/header";
import type { HeaderData } from "~/components/layout/header/types";
import { getPaginatedAndFilterableReminders } from "~/modules/asset-reminder/service.server";
import { resolveRemindersActions } from "~/modules/asset-reminder/utils.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { makeShelfError } from "~/utils/error";
import { payload, error } from "~/utils/http.server";
import {
  PermissionAction,
  PermissionEntity,
} from "~/utils/permissions/permission.data";
import { requirePermission } from "~/utils/roles.server";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    const { organizationId } = await requirePermission({
      userId,
      request,
      entity: PermissionEntity.assetReminders,
      action: PermissionAction.read,
    });

    const { page, perPage, reminders, totalPages, totalReminders, search } =
      await getPaginatedAndFilterableReminders({
        organizationId,
        request,
      });

    const header: HeaderData = { title: "Rappels" };
    const modelName = {
      singular: "rappel",
      plural: "rappels",
    };

    return payload({
      header,
      modelName,
      items: reminders,
      totalItems: totalReminders,
      page,
      perPage,
      totalPages,
      searchFieldLabel: "Rechercher des rappels",
      searchFieldTooltip: {
        title: "Rechercher des rappels",
        text: "Recherchez par nom de rappel, message, bien ou responsable. Séparez vos mots-clés par une virgule pour appliquer une condition OU.",
      },
      search,
    });
  } catch (cause) {
    const reason = makeShelfError(cause, { userId });
    throw data(error(reason), { status: reason.status });
  }
}

export async function action({ context, request }: ActionFunctionArgs) {
  const authSession = context.getSession();
  const userId = authSession.userId;

  try {
    const { organizationId } = await requirePermission({
      userId,
      request,
      entity: PermissionEntity.assetReminders,
      action: PermissionAction.update,
    });

    return await resolveRemindersActions({
      request,
      organizationId,
      userId,
    });
  } catch (cause) {
    const reason = makeShelfError(cause, { userId });
    return data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: appendToMetaTitle(data?.header.title) },
];

export default function Reminders() {
  return (
    <>
      <Header
        subHeading={
          <>
            Pour créer un rappel, ouvrez le bien concerné puis utilisez{" "}
            <b>{"Actions > Définir un rappel"}</b>.
          </>
        }
      />
      <RemindersTable />
    </>
  );
}
