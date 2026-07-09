import type { ComponentProps, ReactNode } from "react";
import { useLoaderData } from "react-router";

import { useSearchParams } from "~/hooks/search-params";
import type { SearchableIndexResponse } from "~/modules/types";
import { NON_FILTER_PARAMS } from "~/utils/filter-params";
import { tw } from "~/utils/tw";
import { Button } from "../shared/button";

export interface CustomEmptyState {
  className?: string;
  customContent?: {
    title: string;
    text: ReactNode;
    newButtonRoute?: string;
    newButtonContent?: string;
    buttonProps?: Partial<ComponentProps<typeof Button>>;
  };
  modelName?: {
    singular: string;
    plural: string;
  };
}

export const EmptyState = ({
  className,
  customContent,
  modelName,
}: CustomEmptyState) => {
  const {
    search,
    modelName: modelNameData,
    hasActiveFilters,
  } = useLoaderData<SearchableIndexResponse>();
  const [, setSearchParams] = useSearchParams();
  const singular = modelName?.singular || modelNameData.singular;
  const plural = modelName?.plural || modelNameData.plural;

  const hasSearch = !!search;
  const isFiltered = hasSearch || !!hasActiveFilters;

  const filteredTexts = hasSearch
    ? {
        title: `Aucun résultat pour ${plural}`,
        p: `Votre recherche "${search}" ne correspond à aucun ${plural}.`,
      }
    : {
        title: `Aucun résultat pour ${plural}`,
        p: `Aucun ${plural} ne correspond aux filtres appliqués. Ajustez ou réinitialisez vos filtres.`,
      };

  const zeroDataTexts = {
    title: `Aucun ${plural}`,
    p: `Créez votre premier ${singular} pour commencer.`,
  };

  const clearButton = (() => {
    if (!isFiltered) return null;

    if (hasSearch && hasActiveFilters) {
      return (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSearchParams(() => new URLSearchParams());
          }}
        >
          Réinitialiser
        </Button>
      );
    }

    if (hasSearch) {
      return (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete("s");
              return next;
            });
          }}
        >
          Effacer la recherche
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setSearchParams((prev) => {
            const next = new URLSearchParams();
            prev.forEach((value, key) => {
              if (NON_FILTER_PARAMS.has(key)) {
                next.append(key, value);
              }
            });
            return next;
          });
        }}
      >
        Effacer les filtres
      </Button>
    );
  })();

  return (
    <div
      className={tw(
        "flex h-full flex-col justify-center gap-[32px] px-4 py-[100px] text-center",
        className
      )}
    >
      <div className="flex flex-col items-center">
        <img
          src="/static/images/empty-state.svg"
          alt=""
          aria-hidden="true"
          className="h-auto w-[172px]"
        />
        {isFiltered ? (
          <div>
            <div className="text-text-lg font-semibold text-gray-900">
              {filteredTexts.title}
            </div>
            <p className="text-gray-600">{filteredTexts.p}</p>
          </div>
        ) : customContent ? (
          <div>
            <div className="text-text-lg font-semibold text-gray-900">
              {customContent.title}
            </div>
            <div className="text-gray-600">{customContent.text}</div>
          </div>
        ) : (
          <div>
            <div className="text-text-lg font-semibold text-gray-900">
              {zeroDataTexts.title}
            </div>
            <p className="text-gray-600">{zeroDataTexts.p}</p>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-3">
        {isFiltered
          ? clearButton
          : customContent?.newButtonRoute && (
              <Button
                to={customContent.newButtonRoute}
                aria-label={`new ${singular}`}
                {...(customContent?.buttonProps || undefined)}
              >
                {customContent?.newButtonContent
                  ? customContent.newButtonContent
                  : `Nouveau ${singular}`}
              </Button>
            )}
      </div>
    </div>
  );
};
