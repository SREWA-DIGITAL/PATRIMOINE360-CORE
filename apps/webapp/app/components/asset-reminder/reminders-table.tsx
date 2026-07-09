import { useState } from "react";
import type { Prisma } from "@prisma/client";
import { useParams } from "react-router";
import colors from "tailwindcss/colors";
import type { ASSET_REMINDER_INCLUDE_FIELDS } from "~/modules/asset-reminder/fields";
import { List } from "../list";
import ReminderTeamMembers from "./reminder-team-members";
import SetOrEditReminderDialog from "./set-or-edit-reminder-dialog";
import { ListContentWrapper } from "../list/content-wrapper";
import { Filters } from "../list/filters";
import { SortBy } from "../list/filters/sort-by";
import { Badge } from "../shared/badge";
import { Button } from "../shared/button";
import { DateS } from "../shared/date";
import { Td, Th } from "../table";
import ActionsDropdown from "./actions-dropdown";
import When from "../when/when";

type RemindersTableProps = {
  isAssetReminderPage?: boolean;
};

export const REMINDERS_SORTING_OPTIONS = {
  name: "Nom",
  alertDateTime: "Heure d'alerte",
  createdAt: "Date de création",
  updatedAt: "Date de mise à jour",
} as const;

export default function RemindersTable({
  isAssetReminderPage,
}: RemindersTableProps) {
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const { assetId } = useParams<{ assetId: string }>();

  const emptyStateTitle = isAssetReminderPage
    ? "Aucun rappel pour ce bien"
    : "Aucun rappel créé pour le moment.";

  return (
    <ListContentWrapper className="mb-4">
      <Filters
        slots={{
          "right-of-search": (
            <SortBy
              sortingOptions={REMINDERS_SORTING_OPTIONS}
              defaultSortingBy="alertDateTime"
            />
          ),
        }}
      />

      <List
        className="overflow-x-hidden"
        ItemComponent={ListContent}
        customEmptyStateContent={{
          title: emptyStateTitle,
          text: (
            <p>
              Créez votre premier{" "}
              {isAssetReminderPage ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsReminderDialogOpen(true);
                  }}
                >
                  rappel
                </Button>
              ) : (
                "rappel"
              )}
              .
            </p>
          ),
        }}
        headerChildren={
          <>
            <Th>Message</Th>
            <When truthy={!isAssetReminderPage}>
              <Td>Bien</Td>
            </When>
            <Th>Date d'alerte</Th>
            <Th>Statut</Th>
            <Th>Utilisateurs</Th>
          </>
        }
        extraItemComponentProps={{ isAssetReminderPage }}
      />

      <SetOrEditReminderDialog
        action={isAssetReminderPage ? `/assets/${assetId}` : undefined}
        open={isReminderDialogOpen}
        onClose={() => {
          setIsReminderDialogOpen(false);
        }}
      />
    </ListContentWrapper>
  );
}

function ListContent({
  item,
  extraProps,
}: {
  item: Prisma.AssetReminderGetPayload<{
    include: typeof ASSET_REMINDER_INCLUDE_FIELDS;
  }>;
  extraProps: { isAssetReminderPage: boolean };
}) {
  const now = new Date();
  const status =
    now < new Date(item.alertDateTime) ? "À venir" : "Rappel envoyé";

  return (
    <>
      <Td className="md:min-w-60">{item.name}</Td>
      <Td className="max-w-62 md:max-w-96">{item.message}</Td>
      <When truthy={!extraProps.isAssetReminderPage}>
        <Td>
          <Button
            className="hover:underline"
            to={`/assets/${item.asset.id}/overview`}
            target="_blank"
            variant={"link-gray"}
          >
            {item.asset.title}
          </Button>
        </Td>
      </When>
      <Td>
        <DateS date={item.alertDateTime} includeTime />
      </Td>
      <Td>
        <Badge
          color={
            status === "À venir" ? colors.yellow["500"] : colors.green["500"]
          }
        >
          {status}
        </Badge>
      </Td>
      <Td>
        <ReminderTeamMembers
          teamMembers={item.teamMembers}
          isAlreadySent={status === "Rappel envoyé"}
        />
      </Td>
      <Td>
        <ActionsDropdown reminder={item} />
      </Td>
    </>
  );
}
