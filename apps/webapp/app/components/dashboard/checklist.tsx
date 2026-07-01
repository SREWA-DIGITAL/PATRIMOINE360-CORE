import { Link, useFetcher, useLoaderData } from "react-router";
import type { loader } from "~/routes/_layout+/home";
import { tw } from "~/utils/tw";
import {
  AddUserIcon,
  AssetsIcon,
  CategoriesIcon,
  CheckmarkIcon,
  CustomFiedIcon,
  TagsIcon,
  UserIcon,
} from "../icons/library";
import { Button } from "../shared/button";
import Heading from "../shared/heading";
import SubHeading from "../shared/sub-heading";

export default function OnboardingChecklist() {
  const fetcher = useFetcher();
  const { checklistOptions } = useLoaderData<typeof loader>();

  return (
    <div className="mt-6 rounded border bg-white px-4 py-5 lg:px-20 lg:py-16">
      <div className="mb-8">
        <Heading
          as="h2"
          className="break-all text-display-xs font-semibold md:text-display-sm"
        >
          Bienvenue
        </Heading>
        <SubHeading>
          Terminez ces actions pour activer votre tableau de bord.
        </SubHeading>
      </div>
      <div className="mb-8">
        <div className="mb-4">
          <h4 className=" text-lg font-semibold">Restez organise</h4>
          <p className="text-[14px] text-gray-600">
            Organiser vos biens ameliore la visibilite et debloque tout le
            potentiel des filtres et de la recherche.
          </p>
        </div>
        <ul className="onboarding-checklist -mx-1 xl:flex xl:flex-wrap">
          <li
            className={tw(
              " mx-1 mb-2 xl:w-[49%]",
              checklistOptions.hasAssets && "completed"
            )}
          >
            <div className="flex h-full items-start justify-between gap-1 rounded border p-4">
              <div className="flex items-start">
                <div className="mr-3 inline-flex items-center justify-center rounded-full border-[5px] border-solid border-primary-50 bg-primary-100 p-1.5 text-primary">
                  <AssetsIcon />
                </div>
                <div className="text-[14px]">
                  <div className="mb-3">
                    <h6 className="font-medium text-gray-700">
                      Creez votre premier bien
                    </h6>
                    <p className=" text-gray-600">
                      Chaque bien recoit son propre QR code chiffre.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to="https://www.shelf.nu/knowledge-base/adding-new-assets"
                      target="_blank"
                      className=" font-semibold text-gray-600"
                    >
                      En savoir plus
                    </Link>
                    <Button variant="link" to="/assets/new">
                      Nouveau bien
                    </Button>
                  </div>
                </div>
              </div>
              <i className="hidden text-primary">
                <CheckmarkIcon />
              </i>
            </div>
          </li>
          <li
            className={tw(
              " mx-1 mb-2 xl:w-[49%]",
              checklistOptions.hasCategories && "completed"
            )}
          >
            <div className="flex h-full items-start justify-between gap-1 rounded border p-4">
              <div className="flex items-start">
                <div className="mr-3 inline-flex items-center justify-center rounded-full border-[5px] border-solid border-primary-50 bg-primary-100 p-1.5 text-primary">
                  <CategoriesIcon />
                </div>
                <div className="text-[14px]">
                  <div className="mb-3">
                    <h6 className="font-medium text-gray-700">
                      Creez une categorie personnalisee
                    </h6>
                    <p className=" text-gray-600">
                      Consultez, modifiez ou supprimez les categories par
                      defaut, puis creez les votres.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to="https://www.shelf.nu/knowledge-base/using-categories-to-organize-your-asset-inventory"
                      target="_blank"
                      className=" font-semibold text-gray-600"
                    >
                      En savoir plus
                    </Link>
                    <Button variant="link" to="/categories/new">
                      Nouvelle categorie
                    </Button>
                  </div>
                </div>
              </div>
              <i className="hidden text-primary">
                <CheckmarkIcon />
              </i>
            </div>
          </li>
          <li
            className={tw(
              " mx-1 mb-2 xl:w-[49%]",
              checklistOptions.hasTags && "completed"
            )}
          >
            <div className="flex h-full items-start justify-between gap-1 rounded border p-4">
              <div className="flex items-start">
                <div className="mr-3 inline-flex items-center justify-center rounded-full border-[5px] border-solid border-primary-50 bg-primary-100 p-1.5 text-primary">
                  <TagsIcon />
                </div>
                <div className="text-[14px]">
                  <div className="mb-3">
                    <h6 className="font-medium text-gray-700">Creez un tag</h6>
                    <p className=" text-gray-600">
                      Les tags sont de petites informations que vous pouvez
                      ajouter a vos biens.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="link" to="/tags/new">
                      Nouveau tag
                    </Button>
                  </div>
                </div>
              </div>
              <i className="hidden text-primary">
                <CheckmarkIcon />
              </i>
            </div>
          </li>
        </ul>
      </div>
      <div className="mb-8">
        <div className="mb-4">
          <h4 className=" text-lg font-semibold">
            Equipe, affectations et reservations
          </h4>
          <p className="text-[14px] text-gray-600">
            Affectez les biens a vos collaborateurs. Passez a l'offre Equipe si
            vous souhaitez inviter d'autres utilisateurs dans votre espace.
          </p>
        </div>
        <ul className="onboarding-checklist -mx-1 xl:flex xl:flex-wrap">
          <li
            className={tw(
              " mx-1 mb-2 xl:w-[49%]",
              checklistOptions.hasTeamMembers && "completed"
            )}
          >
            <div className="flex h-full items-start justify-between gap-1 rounded border p-4">
              <div className="flex items-start">
                <div className="mr-3 inline-flex items-center justify-center rounded-full border-[5px] border-solid border-primary-50 bg-primary-100 p-1.5 text-primary">
                  <UserIcon />
                </div>
                <div className="text-[14px]">
                  <div className="mb-3">
                    <h6 className="font-medium text-gray-700">
                      Ajoutez un membre d'equipe
                    </h6>
                    <p className=" text-gray-600">
                      Suivez qui detient un bien en ajoutant les membres de
                      votre equipe a Patrimoine360.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to="https://www.shelf.nu/knowledge-base/onboarding-your-team-members"
                      target="_blank"
                      className=" font-semibold text-gray-600"
                    >
                      En savoir plus
                    </Link>
                    <Button variant="link" to="/settings/team">
                      Nouveau membre
                    </Button>
                  </div>
                </div>
              </div>
              <i className="hidden text-primary">
                <CheckmarkIcon />
              </i>
            </div>
          </li>
          <li
            className={tw(
              " mx-1 mb-2 xl:w-[49%]",
              checklistOptions.hasCustodies && "completed"
            )}
          >
            <div className="flex h-full items-start justify-between gap-1 rounded border p-4">
              <div className="flex items-start">
                <div className="mr-3 inline-flex items-center justify-center rounded-full border-[5px] border-solid border-primary-50 bg-primary-100 p-1.5 text-primary">
                  <AddUserIcon />
                </div>
                <div className="text-[14px]">
                  <div className="mb-3">
                    <h6 className="font-medium text-gray-700">
                      Affectez un bien a un responsable
                    </h6>
                    <p className=" text-gray-600">
                      Definissez clairement qui detient chaque bien pour garder
                      un suivi operationnel fiable.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to="https://www.shelf.nu/knowledge-base/custody-feature-for-long-term-equipment-lend-outs"
                      target="_blank"
                      className=" font-semibold text-gray-600"
                    >
                      En savoir plus
                    </Link>
                  </div>
                </div>
              </div>
              <i className="hidden text-primary">
                <CheckmarkIcon />
              </i>
            </div>
          </li>
        </ul>
      </div>
      <div className="mb-8">
        <div className="mb-4">
          <h4 className=" text-lg font-semibold">
            Personnalisez votre experience
          </h4>
          <p className="text-[14px] text-gray-600">
            Adaptez votre facon de travailler avec Patrimoine360 selon vos
            besoins et ceux de votre organisation.
          </p>
        </div>
        <ul className="onboarding-checklist -mx-1 xl:flex xl:flex-wrap">
          <li
            className={tw(
              " mx-1 mb-2 xl:w-[49%]",
              checklistOptions.hasCustomFields && "completed"
            )}
          >
            <div className="flex h-full items-start justify-between gap-1 rounded border p-4">
              <div className="flex items-start">
                <div className="mr-3 inline-flex items-center justify-center rounded-full border-[5px] border-solid border-primary-50 bg-primary-100 p-1.5 text-primary">
                  <CustomFiedIcon />
                </div>
                <div className="text-[14px]">
                  <div className="mb-3">
                    <h6 className="font-medium text-gray-700">
                      Creez un champ personnalise
                    </h6>
                    <p className=" text-gray-600">
                      Enrichissez votre base de biens avec des champs
                      personnalises.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to="https://www.shelf.nu/knowledge-base/adding-additional-fields-to-assets"
                      target="_blank"
                      className=" font-semibold text-gray-600"
                    >
                      En savoir plus
                    </Link>
                    <Button variant="link" to="/settings/custom-fields/new">
                      Nouveau champ personnalise
                    </Button>
                  </div>
                </div>
              </div>
              <i className="hidden text-primary">
                <CheckmarkIcon />
              </i>
            </div>
          </li>
        </ul>
      </div>
      <fetcher.Form
        method="post"
        action="/api/user/prefs/skip-onboarding-checklist"
      >
        <input type="hidden" name="skipOnboardingChecklist" value="skipped" />
        <Button variant="link" type="submit">
          Ignorer la visite et continuer vers le tableau de bord
        </Button>
      </fetcher.Form>
    </div>
  );
}
