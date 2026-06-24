import { useMemo } from "react";
import type { Prisma, TeamMember } from "@prisma/client";
import { useNavigation } from "react-router";
import { Button } from "~/components/shared/button";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/shared/modal";

import { isFormProcessing } from "~/utils/form";
import { tw } from "~/utils/tw";
import { Form } from "../custom-form";
import { TrashIcon, XIcon } from "../icons/library";

export const DeleteMember = ({
  teamMember,
}: {
  teamMember: Prisma.TeamMemberGetPayload<{
    include: {
      _count: {
        select: {
          custodies: true;
        };
      };
    };
  }>;
}) => {
  const hasCustodies = useMemo(
    () => teamMember?._count.custodies > 0,
    [teamMember]
  );
  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="link"
            data-test-id="deleteTeamMemberButton"
            className="justify-start rounded-sm  p-3 text-sm font-semibold text-gray-700 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-100 hover:text-gray-700"
            width="full"
          >
            <span className="flex items-center gap-2">
              <TrashIcon />
              Delete
            </span>
          </Button>
        </AlertDialogTrigger>

        {hasCustodies ? (
          <UnableToDeleteMemberContent
            custodiesCount={teamMember?._count.custodies}
          />
        ) : (
          <DeleteMemberContent id={teamMember.id} />
        )}
      </AlertDialog>
    </>
  );
};

const DeleteMemberContent = ({ id }: { id: TeamMember["id"] }) => {
  const navigation = useNavigation();
  const disabled = isFormProcessing(navigation.state);

  return (
    <AlertDialogContent className="relative">
      <AlertDialogHeader className="mb-8">
        <AlertDialogTitle>Supprimer le responsable</AlertDialogTitle>
        <AlertDialogDescription>
          Après suppression de ce responsable, vous ne pourrez plus lui
          attribuer de bien.
        </AlertDialogDescription>
        <AlertDialogCancel
          asChild
          className="absolute right-5 top-5 cursor-pointer"
        >
          <XIcon />
        </AlertDialogCancel>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <Form method="post" className="w-full">
          <input type="hidden" name="teamMemberId" value={id} />
          <Button
            className={tw(
              "border-error-600 bg-error-600 hover:border-error-800 hover:bg-error-800",
              disabled ? "pointer-events-none opacity-50" : ""
            )}
            type="submit"
            width="full"
            data-test-id="confirmdeleteAssetButton"
            disabled={disabled}
            name="intent"
            value="delete"
          >
            Supprimer le responsable
          </Button>
        </Form>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

const UnableToDeleteMemberContent = ({
  custodiesCount,
}: {
  custodiesCount: number;
}) => (
  <AlertDialogContent className="relative">
    <AlertDialogHeader className="mb-8">
      <AlertDialogTitle>Suppression impossible</AlertDialogTitle>
      <AlertDialogDescription>
        Le responsable que vous tentez de supprimer possède encore{" "}
        {custodiesCount} affectations actives. Libérez ces affectations ou
        retournez les biens concernés avant de supprimer cet utilisateur.
      </AlertDialogDescription>
      <AlertDialogCancel
        asChild
        className="absolute right-5 top-5 cursor-pointer"
      >
        <XIcon />
      </AlertDialogCancel>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel asChild>
        <Button type="button" variant="secondary" width="full">
          Close
        </Button>
      </AlertDialogCancel>
    </AlertDialogFooter>
  </AlertDialogContent>
);
