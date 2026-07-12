import type { useLoaderData } from "react-router";
import DynamicSelect from "~/components/dynamic-select/dynamic-select";
import FormRow from "~/components/forms/form-row";
import type { ModelFilterItem } from "~/hooks/use-model-filters";
import type { NewBookingLoaderReturnType } from "~/routes/_layout+/bookings.new";
import { resolveTeamMemberName } from "~/utils/user";

// Extract the team member type from the loader return type
export type TeamMemberType = ReturnType<
  typeof useLoaderData<NewBookingLoaderReturnType>
>["teamMembers"][number];

export function CustodianField({
  defaultTeamMember,
  disabled,
  userCanSeeCustodian,
  isNewBooking,
  error,
}: {
  defaultTeamMember: TeamMemberType | undefined;
  disabled: boolean;
  userCanSeeCustodian: boolean;
  isNewBooking?: boolean;
  error?: string;
}) {
  return (
    <FormRow
      rowLabel="Description"
      className="mobile-styling-only border-b-0 p-0"
    >
      <label
        className="mb-2.5 block font-medium text-gray-700"
        htmlFor="custodian"
      >
        <span className="required-input-label">Responsable</span>
      </label>
      <DynamicSelect
        defaultValue={
          defaultTeamMember
            ? JSON.stringify({
                id: defaultTeamMember?.id,
                name: resolveTeamMemberName(defaultTeamMember),
                userId: defaultTeamMember?.userId,
              })
            : undefined
        }
        disabled={disabled}
        model={{
          name: "teamMember",
          queryKey: "name",
          deletedAt: null,
        }}
        fieldName="custodian"
        contentLabel="Responsables"
        initialDataKey="teamMembersForForm"
        countKey="totalTeamMembers"
        placeholder="Sélectionner un responsable"
        allowClear
        closeOnSelect
        transformItem={(item: ModelFilterItem & { userId?: string }) => ({
          ...item,
          id: JSON.stringify({
            id: item.id,
            //If there is a user, we use its name, otherwise we use the name of the team member
            name: resolveTeamMemberName(item),
            userId: item?.userId,
          }),
        })}
        renderItem={(item) =>
          userCanSeeCustodian || isNewBooking
            ? resolveTeamMemberName(item, true)
            : "Private"
        }
      />

      {error ? <div className="text-sm text-error-500">{error}</div> : null}
      <p className="mt-2 text-[14px] text-gray-600">
        La personne responsable des biens pendant toute la durée de la
        réservation.
      </p>
    </FormRow>
  );
}
