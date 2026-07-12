import type { ReactNode } from "react";
import type { Booking } from "@prisma/client";
import { BookingStatus, KitStatus } from "@prisma/client";
import { Link, useLoaderData } from "react-router";
import { hasAssetBookingConflicts } from "~/modules/booking/helpers";
import type { AssetWithBooking } from "~/routes/_layout+/bookings.$bookingId.overview.manage-assets";
import type { KitForBooking } from "~/routes/_layout+/bookings.$bookingId.overview.manage-kits";
import { SERVER_URL } from "~/utils/env";
import { tw } from "~/utils/tw";
import { Button } from "../shared/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../shared/tooltip";

/**
 * There are 4 reasons an asset can be unavailable:
 * 1. Its marked as not allowed for booking
 * 2. It is already in custody
 * 3. It is already booked for that period (within another booking)
 * 4. It is part of a kit and user is trying to add it individually
 * Each reason has its own tooltip and label
 */
export function AvailabilityLabel({
  asset,
  isCheckedOut,
  showKitStatus,
  isAddedThroughKit,
  isAlreadyAdded,
}: {
  asset: AssetWithBooking;
  isCheckedOut: boolean;
  showKitStatus?: boolean;
  isAddedThroughKit?: boolean;
  isAlreadyAdded?: boolean;
}) {
  const { booking } = useLoaderData<{ booking: Booking }>();
  const isPartOfKit = !!asset.kitId;

  /** User scanned the asset and it is already in booking */
  if (isAlreadyAdded) {
    return (
      <AvailabilityBadge
        badgeText="Déjà ajouté à cette réservation"
        tooltipTitle="Bien déjà présent"
        tooltipContent="Ce bien est déjà ajouté à la réservation en cours."
      />
    );
  }

  /**
   * Marked as not allowed for booking
   */

  if (!asset.availableToBook) {
    return (
      <AvailabilityBadge
        badgeText={"Indisponible"}
        tooltipTitle={"Bien indisponible à la réservation"}
        tooltipContent={
          "Ce bien est marqué comme indisponible pour les réservations par un administrateur."
        }
      />
    );
  }

  /**
   * Asset is part of a kit
   */
  if (isPartOfKit && showKitStatus) {
    return (
      <AvailabilityBadge
        badgeText="Inclus dans un lot"
        tooltipTitle="Bien inclus dans un lot"
        tooltipContent="Retirez ce bien du lot pour l'ajouter individuellement."
      />
    );
  }

  /**
   * Has custody
   */
  if (asset.custody) {
    return (
      <AvailabilityBadge
        badgeText={"Affecté"}
        tooltipTitle={"Bien déjà affecté"}
        tooltipContent={
          "Ce bien est déjà affecté à un responsable et n'est donc pas disponible pour une réservation."
        }
      />
    );
  }

  /**
   * Is booked for period - using client-side helper function
   */
  if (
    hasAssetBookingConflicts(asset, booking.id) &&
    !["ONGOING", "OVERDUE"].includes(booking.status)
  ) {
    const conflictingBooking = asset?.bookings
      ?.filter(
        (b) =>
          b.id !== booking.id &&
          (b.status === BookingStatus.ONGOING ||
            b.status === BookingStatus.OVERDUE ||
            b.status === BookingStatus.RESERVED)
      )
      .sort((a, b) => {
        // Sort by 'from' date descending to get the newest booking first
        const aDate = a.from ? new Date(a.from).getTime() : 0;
        const bDate = b.from ? new Date(b.from).getTime() : 0;
        return bDate - aDate;
      })[0];
    return (
      <AvailabilityBadge
        badgeText={"Déjà réservé"}
        tooltipTitle={"Bien déjà réservé"}
        tooltipContent={
          conflictingBooking ? (
            <span>
              Ce bien est déjà rattaché à la réservation (
              <Button
                to={`/bookings/${conflictingBooking.id}`}
                target="_blank"
                variant={"inherit"}
                className={"!underline"}
              >
                {conflictingBooking?.name}
              </Button>
              ) qui chevauche la période sélectionnée.
            </span>
          ) : (
            "Ce bien est déjà rattaché à une réservation qui chevauche la période sélectionnée."
          )
        }
      />
    );
  }

  /**
   * Is currently checked out
   */

  if (isCheckedOut) {
    /** We get the current active booking that the asset is checked out to so we can use its name in the tooltip contnet
     * NOTE: This will currently not work as we are returning only overlapping bookings with the query. I leave to code and we can solve it by modifying the DB queries: https://github.com/Shelf-nu/shelf.nu/pull/555#issuecomment-1877050925
     */
    const conflictingBooking = asset?.bookings
      ?.filter(
        (b) =>
          b.id !== booking.id &&
          (b.status === BookingStatus.ONGOING ||
            b.status === BookingStatus.OVERDUE)
      )
      .sort((a, b) => {
        // Sort by 'from' date descending to get the newest booking first
        const aDate = a.from ? new Date(a.from).getTime() : 0;
        const bDate = b.from ? new Date(b.from).getTime() : 0;
        return bDate - aDate;
      })[0];

    return (
      <AvailabilityBadge
        badgeText={"Sorti"}
        tooltipTitle={"Bien actuellement sorti"}
        tooltipContent={
          conflictingBooking ? (
            <span>
              Ce bien est actuellement sorti dans le cadre d'une autre
              réservation (
              <Link
                to={`${SERVER_URL}/bookings/
                ${conflictingBooking.id}`}
                target="_blank"
              >
                {conflictingBooking?.name}
              </Link>
              ) et devrait redevenir disponible sur la période sélectionnée
            </span>
          ) : (
            "Ce bien est actuellement sorti dans le cadre d'une autre réservation et devrait redevenir disponible sur la période sélectionnée."
          )
        }
      />
    );
  }

  /**
   * User is viewing all assets and the assets is added in a booking through kit
   */
  if (isAddedThroughKit) {
    return (
      <AvailabilityBadge
        badgeText="Ajouté via un lot"
        tooltipTitle="Bien ajouté via un lot"
        tooltipContent="Retirez ce bien du lot pour l'ajouter individuellement."
      />
    );
  }

  return null;
}

export function AvailabilityBadge({
  badgeText,
  tooltipTitle,
  tooltipContent,
  className,
}: {
  badgeText: string;
  tooltipTitle: string;
  tooltipContent: string | ReactNode;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={tw(
              "inline-block  bg-warning-50 px-[6px] py-[2px]",
              "rounded-md border border-warning-200",
              "text-xs text-warning-700",
              "availability-badge",
              className
            )}
          >
            {badgeText}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <div className="max-w-[260px] text-left sm:max-w-[320px]">
            <h6 className="mb-1 text-xs font-semibold text-gray-700">
              {tooltipTitle}
            </h6>
            <div className="whitespace-normal text-xs font-medium text-gray-500">
              {tooltipContent}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A kit is not available for the following reasons
 * 1. Kit has unavailable status
 * 2. Kit or some asset is in custody
 * 3. Some of the assets are in custody
 * 4. Some of the assets are already booked for that period (for that booking)
 * 5. If kit has no assets
 */
export function getKitAvailabilityStatus(
  kit: KitForBooking,
  currentBookingId: string
) {
  const bookings = kit.assets.flatMap((asset) =>
    asset?.bookings.length ? asset.bookings : []
  );

  /** Checks whether this is checked out in another not overlapping booking */
  const isCheckedOutInANonConflictingBooking =
    kit.status === KitStatus.CHECKED_OUT && bookings.length === 0;
  const isCheckedOut = kit.status === KitStatus.CHECKED_OUT;
  const isInCustody =
    kit.status === "IN_CUSTODY" || kit.assets.some((a) => Boolean(a.custody));

  const isKitWithoutAssets = kit.assets.length === 0;

  const someAssetMarkedUnavailable = kit.assets.some((a) => !a.availableToBook);

  // Apply same booking conflict logic as isCheckedOut
  const someAssetHasUnavailableBooking = kit.assets.some((asset) =>
    hasAssetBookingConflicts(asset, currentBookingId)
  );

  return {
    isCheckedOut,
    isCheckedOutInANonConflictingBooking,
    isInCustody,
    isKitWithoutAssets,
    someAssetMarkedUnavailable,
    someAssetHasUnavailableBooking,
    isKitUnavailable: [isInCustody, isKitWithoutAssets].some(Boolean),
  };
}

export function KitAvailabilityLabel({ kit }: { kit: KitForBooking }) {
  const { booking } = useLoaderData<{ booking: Booking }>();

  const {
    isCheckedOut,
    isCheckedOutInANonConflictingBooking,
    someAssetMarkedUnavailable,
    isInCustody,
    isKitWithoutAssets,
    someAssetHasUnavailableBooking,
  } = getKitAvailabilityStatus(kit, booking.id);

  // Check if kit is checked out in current booking - don't show availability label
  const isCheckedOutInCurrentBooking =
    isCheckedOut &&
    kit.assets.some((asset) =>
      asset.bookings.some(
        (b) => b.id === booking.id && ["ONGOING", "OVERDUE"].includes(b.status)
      )
    );

  // Case 1: Kit is checked out in current booking - don't show availability label
  // The KitStatusBadge with CHECKED_OUT should be shown instead in the Row component
  if (isCheckedOutInCurrentBooking) {
    return null;
  }

  if (isInCustody) {
    return (
      <AvailabilityBadge
        badgeText="Affecté"
        tooltipTitle="Lot déjà affecté"
        tooltipContent="Ce lot est affecté ou contient des biens déjà affectés."
      />
    );
  }

  if (isCheckedOut) {
    return (
      <AvailabilityBadge
        badgeText="Sorti"
        tooltipTitle="Lot actuellement sorti"
        tooltipContent={
          isCheckedOutInANonConflictingBooking
            ? "Ce lot est actuellement sorti dans le cadre d'une autre réservation et devrait redevenir disponible sur la période sélectionnée."
            : "Ce lot est actuellement sorti et n'est pas disponible sur la période sélectionnée."
        }
      />
    );
  }

  if (isKitWithoutAssets) {
    return (
      <AvailabilityBadge
        badgeText="Aucun bien"
        tooltipTitle="Lot vide"
        tooltipContent="Aucun bien n'a encore été ajouté à ce lot."
      />
    );
  }

  if (someAssetMarkedUnavailable) {
    return (
      <AvailabilityBadge
        badgeText="Contient des biens non réservables"
        tooltipTitle="Lot indisponible à la sortie"
        tooltipContent="Certains biens de ce lot sont marqués comme non réservables. Vous pouvez encore ajouter le lot à votre réservation, mais vous devez retirer ces biens avant la sortie."
      />
    );
  }

  if (someAssetHasUnavailableBooking) {
    return (
      <AvailabilityBadge
        badgeText="Déjà réservé"
        tooltipTitle="Lot déjà réservé"
        tooltipContent="Ce lot est déjà ajouté à une autre réservation."
      />
    );
  }

  return null;
}
