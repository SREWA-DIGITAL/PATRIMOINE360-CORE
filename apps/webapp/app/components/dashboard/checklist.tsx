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
          <h4 className=" text-lg font-semibold">Restez organisé</h4>
          <p className="text-[14px] text-gray-600">
            Organiser vos biens améliore la visibilité et débloque tout le
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
                      Créez votre premier bien
                    </h6>
                    <p className=" text-gray-600">
                      Chaque bien reçoit son propre QR code chiffré.
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
                      Créez une catégorie personnalisée
                    </h6>
                    <p className=" text-gray-600">
                      Consultez, modifiez ou supprimez les catégories par
                      défaut, puis créez les vôtres.
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
                      Nouvelle catégorie
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
                    <h6 className="font-medium text-gray-700">Créez un tag</h6>
                    <p className=" text-gray-600">
                      Les tags sont de petites informations que vous pouvez
                      ajouter à vos biens.
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
            Équipe, affectations et réservations
          </h4>
          <p className="text-[14px] text-gray-600">
            Affectez les biens à vos collaborateurs. Passez à l'offre Équipe si
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
                      Ajoutez un membre d'équipe
                    </h6>
                    <p className=" text-gray-600">
                      Suivez qui détient un bien en ajoutant les membres de
                      votre équipe à Patrimoine360.
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
                      Affectez un bien à un responsable
                    </h6>
                    <p className=" text-gray-600">
                      Définissez clairement qui détient chaque bien pour garder
                      un suivi opérationnel fiable.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="link" to="/custody">
                      Ouvrir les affectations
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
            Personnalisez votre expérience
          </h4>
          <p className="text-[14px] text-gray-600">
            Adaptez votre façon de travailler avec Patrimoine360 selon vos
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
                      Créez un champ personnalisé
                    </h6>
                    <p className=" text-gray-600">
                      Enrichissez votre base de biens avec des champs
                      personnalisés.
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
                      Nouveau champ personnalisé
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
