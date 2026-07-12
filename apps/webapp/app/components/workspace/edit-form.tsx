import {
  type Organization,
  type Currency,
  OrganizationType,
  type QrIdDisplayPreference,
} from "@prisma/client";
import { useAtom, useAtomValue } from "jotai";
import { useFetcher, useLoaderData } from "react-router";
import { useZorm } from "react-zorm";
import { z } from "zod";
import { updateDynamicTitleAtom } from "~/atoms/dynamic-title-atom";
import { fileErrorAtom, defaultValidateFileAtom } from "~/atoms/file";
import { useAutoFocus } from "~/hooks/use-auto-focus";
import { useDisabled } from "~/hooks/use-disabled";
import { useUserRoleHelper } from "~/hooks/user-user-role-helper";
import type { loader } from "~/routes/_layout+/account-details.workspace.$workspaceId.edit";
import { ACCEPT_SUPPORTED_IMAGES } from "~/utils/constants";
import { tw } from "~/utils/tw";
import { zodFieldIsRequired } from "~/utils/zod";
import CurrencySelector from "./currency-selector";
import QrIdDisplayPreferenceSelector from "./qr-id-display-preference-selector";
import FormRow from "../forms/form-row";
import { InnerLabel } from "../forms/inner-label";
import Input from "../forms/input";
import { Switch } from "../forms/switch";
import { Button } from "../shared/button";
import { Card } from "../shared/card";
import { Spinner } from "../shared/spinner";

/** Pass props of the values to be used as default for the form fields */
interface Props {
  name?: Organization["name"];
  currency?: Organization["currency"];
  qrIdDisplayPreference?: Organization["qrIdDisplayPreference"];
  className?: string;
}

export const EditGeneralWorkspaceSettingsFormSchema = (
  personalOrg: boolean = false
) =>
  z.object({
    id: z.string(),
    name: personalOrg
      ? z.string().optional()
      : z.string().min(2, "Le nom est requis."),
    logo: z.any().optional(),
    currency: z.custom<Currency>(),
    qrIdDisplayPreference: z.custom<QrIdDisplayPreference>(),
    showShelfBranding: z
      .union([z.literal("on"), z.literal("off"), z.undefined()])
      .transform((value) => {
        if (value === undefined) return undefined;
        return value === "on";
      })
      .optional(),
  });

export const WorkspaceEditForms = ({
  name,
  currency,
  qrIdDisplayPreference,
  className,
}: Props) => (
  <div className={tw("flex flex-col gap-3", className)}>
    <WorkspaceGeneralEditForms
      name={name}
      currency={currency}
      qrIdDisplayPreference={qrIdDisplayPreference}
    />
    <WorkspacePermissionsEditForm />
    <WorkspaceSSOEditForm />
  </div>
);

const WorkspaceGeneralEditForms = ({
  name,
  currency,
  qrIdDisplayPreference,
  className,
}: Props) => {
  const { organization, isPersonalWorkspace, canHideShelfBranding } =
    useLoaderData<typeof loader>();

  // Focus the Name input on mount, but skip when the field is disabled
  // (personal workspaces don't allow renaming).
  const nameInputRef = useAutoFocus<HTMLInputElement>({
    when: !isPersonalWorkspace,
  });

  const schema = EditGeneralWorkspaceSettingsFormSchema(isPersonalWorkspace);
  const zo = useZorm("NewQuestionWizardScreen", schema);
  const fetcher = useFetcher({ key: "general" });
  const disabled = useDisabled(fetcher);
  const fileError = useAtomValue(fileErrorAtom);
  const [, validateFile] = useAtom(defaultValidateFileAtom);
  const [, updateTitle] = useAtom(updateDynamicTitleAtom);

  const fetcherError = (
    fetcher.data as
      | {
          error?: {
            message: string;
            additionalData?: { field?: string };
          };
        }
      | undefined
  )?.error;

  const imageError =
    (fetcherError?.additionalData?.field === "image"
      ? fetcherError.message
      : undefined) ?? fileError;

  return (
    <fetcher.Form
      ref={zo.ref}
      method="post"
      className="flex  flex-col gap-2"
      encType="multipart/form-data"
    >
      <Card className={tw("my-0", className)}>
        <div className="mb-6">
          <h3 className="text-text-lg font-semibold">Général</h3>
          <p className="text-sm text-gray-600">
            Gérez les paramètres généraux de l'organisation.
          </p>
        </div>
        <input type="hidden" value={organization.id} name="id" />

        <FormRow
          rowLabel={"Nom"}
          className="border-b-0 pb-[10px] pt-0"
          required={zodFieldIsRequired(schema.shape.name)}
        >
          <Input
            ref={nameInputRef}
            label="Nom"
            hideLabel
            name={zo.fields.name()}
            disabled={isPersonalWorkspace || disabled}
            error={zo.errors.name()?.message}
            onChange={updateTitle}
            className="w-full"
            defaultValue={name || undefined}
            placeholder=""
            required={!isPersonalWorkspace}
          />
        </FormRow>

        <FormRow rowLabel={"Image principale"} className="border-b-0">
          <div>
            <p className="hidden lg:block">
              Formats acceptés : PNG, JPG, JPEG ou WebP (4 Mo max.)
            </p>
            <Input
              // disabled={disabled}
              accept={ACCEPT_SUPPORTED_IMAGES}
              name="image"
              type="file"
              onChange={validateFile}
              label={"Image principale"}
              hideLabel
              error={imageError}
              className="mt-2"
              inputClassName="border-0 shadow-none p-0 rounded-none"
            />
            <p className="mt-2 lg:hidden">
              Formats acceptés : PNG, JPG, JPEG ou WebP (4 Mo max.)
            </p>
          </div>
        </FormRow>

        <div>
          <FormRow
            rowLabel={"Devise"}
            className={"border-b-0"}
            subHeading="Choisissez la devise de votre organisation. Toutes les devises ISO 4217 sont prises en charge."
          >
            <InnerLabel hideLg>Devise</InnerLabel>
            <CurrencySelector
              defaultValue={currency || "USD"}
              name={zo.fields.currency()}
            />
          </FormRow>
        </div>

        <div>
          <FormRow
            rowLabel={"Affichage du QR code"}
            className={"border-b-0"}
            subHeading={
              <p>
                Choisissez l'identifiant affiché sur les étiquettes QR : l'ID du
                QR code ou l'identifiant SAM du bien.
              </p>
            }
          >
            <InnerLabel hideLg>Affichage du QR code</InnerLabel>
            <QrIdDisplayPreferenceSelector
              name={zo.fields.qrIdDisplayPreference()}
              defaultValue={qrIdDisplayPreference || "QR_ID"}
            />
          </FormRow>
        </div>

        <FormRow
          rowLabel={"Attribution des étiquettes"}
          className={"border-b-0"}
          subHeading={
            canHideShelfBranding ? (
              <p>
                Choisissez si la mention de la plateforme apparaît sur les
                étiquettes QR et code-barres.
              </p>
            ) : (
              <p>
                Cette option est réservée à une offre premium.{" "}
                <Button
                  variant="link"
                  className="inline text-xs"
                  to="/account-details/subscription"
                >
                  Mettre à niveau
                </Button>{" "}
                pour masquer cette mention sur les étiquettes.
              </p>
            )
          }
        >
          <div className="flex items-center gap-3">
            <input
              type="hidden"
              name={zo.fields.showShelfBranding()}
              value="off"
            />
            <Switch
              id="showShelfBranding"
              name={zo.fields.showShelfBranding()}
              defaultChecked={organization.showShelfBranding ?? true}
              disabled={!canHideShelfBranding}
              aria-labelledby="showShelfBranding-label"
              aria-describedby="showShelfBranding-desc"
            />
            <div>
              <label
                id="showShelfBranding-label"
                htmlFor="showShelfBranding"
                className={tw(
                  "cursor-pointer text-[14px] font-medium",
                  canHideShelfBranding ? "text-gray-700" : "text-gray-400"
                )}
              >
                Afficher la mention de la plateforme sur les étiquettes
              </label>
              <p
                id="showShelfBranding-desc"
                className="text-[14px] text-gray-600"
              >
                Active ou masque la mention affichée sur les étiquettes QR et
                code-barres téléchargeables.
              </p>
            </div>
          </div>
        </FormRow>

        <div className="text-right">
          <Button
            type="submit"
            disabled={disabled}
            value="general"
            name="intent"
          >
            {disabled ? <Spinner /> : "Enregistrer"}
          </Button>
        </div>
      </Card>
    </fetcher.Form>
  );
};

export const EditWorkspacePermissionsSettingsFormSchema = () =>
  z.object({
    id: z.string(),
    selfServiceCanSeeCustody: z
      .string()
      .transform((val) => val === "on")
      .default("false"),
    selfServiceCanSeeBookings: z
      .string()
      .transform((value) => value === "on")
      .default("false"),
    baseUserCanSeeCustody: z
      .string()
      .transform((value) => value === "on")
      .default("false"),
    baseUserCanSeeBookings: z
      .string()
      .transform((value) => value === "on")
      .default("false"),
  });

const WorkspacePermissionsEditForm = ({ className }: Props) => {
  const { organization } = useLoaderData<typeof loader>();
  const fetcher = useFetcher({ key: "permissions" });
  const schema = EditWorkspacePermissionsSettingsFormSchema();
  const zo = useZorm("NewQuestionWizardScreen", schema);
  const disabled = useDisabled(fetcher);

  return organization.type === OrganizationType.TEAM ? (
    <fetcher.Form ref={zo.ref} method="post" className="flex flex-col gap-2">
      <Card className={tw("my-0 w-full", className)}>
        <div className="border-b pb-5">
          <h3 className="text-text-lg font-semibold">Permissions</h3>
          <p className="text-sm text-gray-600">
            Ajustez certaines permissions pour les profils <b>Self Service</b>{" "}
            et <b>Base</b>.
          </p>
        </div>
        <input type="hidden" value={organization.id} name="id" />

        <h4 className="mt-5 text-text-md">Utilisateurs self service</h4>
        <FormRow
          rowLabel={`Voir les affectations`}
          subHeading={
            <div>
              Autorise les utilisateurs <b>self service</b> à voir les
              affectations des biens et lots qui ne leur sont pas liés. Par
              défaut, ils ne voient que les biens dont ils sont responsables.
            </div>
          }
          className="border-b-0 pb-[10px]"
          required
        >
          <div className="flex flex-col items-center gap-2">
            <Switch
              name={zo.fields.selfServiceCanSeeCustody()}
              id="selfServiceCustody"
              disabled={disabled}
              defaultChecked={organization.selfServiceCanSeeCustody}
            />
            <label
              htmlFor={`selfServiceCustody`}
              className=" hidden text-gray-500"
            >
              Autoriser
            </label>
          </div>
        </FormRow>

        <FormRow
          rowLabel={`Voir les réservations`}
          subHeading={
            <div>
              Autorise les utilisateurs <b>self service</b> à voir les
              réservations qui ne leur sont pas liées. Par défaut, ils ne voient
              que celles dont ils sont responsables.
            </div>
          }
          className="border-b-0 pb-[10px]"
          required
        >
          <div className="flex flex-col items-center gap-2">
            <Switch
              name={zo.fields.selfServiceCanSeeBookings()}
              id="selfServiceBookings"
              disabled={disabled}
              defaultChecked={organization.selfServiceCanSeeBookings}
            />
            <label
              htmlFor={`selfServiceBookings`}
              className=" hidden text-gray-500"
            >
              Autoriser
            </label>
          </div>
        </FormRow>

        <h4 className="border-t pt-5 text-text-md">Utilisateurs base</h4>
        <FormRow
          rowLabel={`Voir les affectations`}
          subHeading={
            <div>
              Autorise les utilisateurs <b>base</b> à voir les affectations des
              biens et lots qui ne leur sont pas liés. Par défaut, ils ne voient
              que les biens dont ils sont responsables.
            </div>
          }
          className="border-b-0 pb-[10px]"
          required
        >
          <div className="flex flex-col items-center gap-2">
            <Switch
              name={zo.fields.baseUserCanSeeCustody()}
              id="baseUserCustody"
              disabled={disabled}
              defaultChecked={organization.baseUserCanSeeCustody}
            />
            <label
              htmlFor={`baseUserCustody`}
              className=" hidden text-gray-500"
            >
              Autoriser
            </label>
          </div>
        </FormRow>

        <FormRow
          rowLabel={`Voir les réservations`}
          subHeading={
            <div>
              Autorise les utilisateurs <b>base</b> à voir les réservations qui
              ne leur sont pas liées. Par défaut, ils ne voient que celles dont
              ils sont responsables.
            </div>
          }
          className="border-b-0 pb-[10px]"
          required
        >
          <div className="flex flex-col items-center gap-2">
            <Switch
              name={zo.fields.baseUserCanSeeBookings()}
              id="baseUserBookings"
              disabled={disabled}
              defaultChecked={organization.baseUserCanSeeBookings}
            />
            <label
              htmlFor={`baseUserBookings`}
              className=" hidden text-gray-500"
            >
              Autoriser
            </label>
          </div>
        </FormRow>

        <div className="text-right">
          <Button
            type="submit"
            disabled={disabled}
            name="intent"
            value="permissions"
          >
            {disabled ? <Spinner /> : "Enregistrer"}
          </Button>
        </div>
      </Card>
    </fetcher.Form>
  ) : null;
};

export const EditWorkspaceSSOSettingsFormSchema = (sso: boolean = false) =>
  z.object({
    id: z.string(),
    selfServiceGroupId: sso
      ? z.string().min(1, "L'identifiant du groupe Self service est requis.")
      : z.string().optional(),
    baseUserGroupId: sso
      ? z.string().min(1, "L'identifiant du groupe Base est requis.")
      : z.string().optional(),
    adminGroupId: sso
      ? z.string().min(1, "L'identifiant du groupe Administrateur est requis.")
      : z.string().optional(),
  });

const WorkspaceSSOEditForm = ({ className }: Props) => {
  const { organization } = useLoaderData<typeof loader>();
  const { isOwner } = useUserRoleHelper();
  const fetcher = useFetcher({ key: "sso" });
  const schema = EditWorkspaceSSOSettingsFormSchema(organization.enabledSso);
  const zo = useZorm("NewQuestionWizardScreen", schema);
  const disabled = useDisabled(fetcher);

  return isOwner && organization.enabledSso && organization.ssoDetails ? (
    <fetcher.Form ref={zo.ref} method="post" className="flex flex-col gap-2">
      <Card className={tw("my-0 ", className)}>
        <div className=" border-b pb-5">
          <h2 className=" text-[18px] font-semibold">Paramètres SSO</h2>
          <p>
            Cette organisation a le SSO activé ; vous pouvez consulter ses
            paramètres SSO.
          </p>
        </div>
        <input type="hidden" value={organization.id} name="id" />

        <FormRow
          rowLabel={"Domaine SSO"}
          className="border-b-0 pb-[10px]"
          subHeading={
            "Domaine associé à cette organisation. Si vous devez le modifier, contactez le support."
          }
          required
        >
          <Input
            label="Domaine SSO"
            hideLabel
            disabled={true}
            className="disabled w-full"
            defaultValue={organization.ssoDetails.domain}
            required
          />
        </FormRow>

        <FormRow
          rowLabel={`Identifiant du groupe Administrateur`}
          subHeading={
            <div>
              Indiquez l'identifiant du groupe a associer au role{" "}
              <b>Administrateur</b>.
            </div>
          }
          className="border-b-0 pb-[10px]"
          required
        >
          <Input
            label={"Identifiant du groupe Administrateur"}
            hideLabel
            className="w-full"
            name={zo.fields.adminGroupId()}
            error={zo.errors.adminGroupId()?.message}
            defaultValue={organization.ssoDetails.adminGroupId || undefined}
            required
          />
        </FormRow>

        <FormRow
          rowLabel={`Identifiant du groupe Self service`}
          subHeading={
            <div>
              Indiquez l'identifiant du groupe a associer au role{" "}
              <b>Self service</b>.
            </div>
          }
          className="border-b-0 pb-[10px]"
          required
        >
          <Input
            label={"Identifiant du groupe Self service"}
            hideLabel
            name={zo.fields.selfServiceGroupId()}
            error={zo.errors.selfServiceGroupId()?.message}
            defaultValue={
              organization.ssoDetails.selfServiceGroupId || undefined
            }
            className="w-full"
            required
          />
        </FormRow>
        <FormRow
          rowLabel={`Identifiant du groupe Base`}
          subHeading={
            <div>
              Indiquez l'identifiant du groupe a associer au role <b>Base</b>.
            </div>
          }
          className="border-b-0 pb-[10px]"
          required
        >
          <Input
            label={"Identifiant du groupe Base"}
            hideLabel
            name={zo.fields.baseUserGroupId()}
            error={zo.errors.baseUserGroupId()?.message}
            defaultValue={organization.ssoDetails.baseUserGroupId || undefined}
            className="w-full"
            required
          />
        </FormRow>
        <div className="text-right">
          <Button type="submit" disabled={disabled} name="intent" value="sso">
            {disabled ? <Spinner /> : "Enregistrer"}
          </Button>
        </div>
      </Card>
    </fetcher.Form>
  ) : null;
};
