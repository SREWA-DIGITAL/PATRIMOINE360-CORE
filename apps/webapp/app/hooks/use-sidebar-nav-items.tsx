import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  AlarmClockIcon,
  BellIcon,
  BoxesIcon,
  CalendarRangeIcon,
  ChartLineIcon,
  ClipboardCheckIcon,
  FileBarChartIcon,
  HomeIcon,
  MapPinIcon,
  MessageCircleIcon,
  Package,
  PackageOpenIcon,
  QrCodeIcon,
  ScanBarcodeIcon,
  SettingsIcon,
  TagsIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { useLoaderData } from "react-router";
import { UpgradeMessage } from "~/components/marketing/upgrade-message";
import When from "~/components/when/when";
import type { loader } from "~/routes/_layout+/_layout";
import { isPersonalOrg } from "~/utils/organization";
import { useCurrentOrganization } from "./use-current-organization";
import { useUserRoleHelper } from "./user-user-role-helper";

type BaseNavItem = {
  title: string;
  hidden?: boolean;
  Icon: LucideIcon;
  disabled?: boolean | { reason: ReactNode };
  badge?: {
    show: boolean;
    variant?: "unread";
  };
};

export type ChildNavItem = BaseNavItem & {
  type: "child";
  to: string;
  target?: string;
};

export type ParentNavItem = BaseNavItem & {
  type: "parent";
  children: Omit<ChildNavItem, "type" | "Icon">[];
};

type LabelNavItem = Omit<BaseNavItem, "Icon"> & {
  type: "label";
};

type ButtonNavItem = BaseNavItem & {
  type: "button";
  onClick: () => void;
};

export type NavItem =
  | ChildNavItem
  | ParentNavItem
  | LabelNavItem
  | ButtonNavItem;

export function useSidebarNavItems() {
  const { isAdmin, canUseBookings, subscription, unreadUpdatesCount } =
    useLoaderData<typeof loader>();
  const { isBaseOrSelfService } = useUserRoleHelper();
  const currentOrganization = useCurrentOrganization();
  const isPersonalOrganization = isPersonalOrg(currentOrganization);

  const bookingDisabled = useMemo(() => {
    if (canUseBookings) {
      return false;
    }

    return {
      reason: (
        <div>
          <h5>Indisponible</h5>
          <p>
            Les réservations sont disponibles uniquement pour les espaces
            d'équipe compatibles.
          </p>

          <When truthy={!!subscription} fallback={<UpgradeMessage />}>
            <p>Changez d'espace pour accéder à cette fonctionnalité.</p>
          </When>
        </div>
      ),
    };
  }, [canUseBookings, subscription]);

  const topMenuItems: NavItem[] = [
    {
      type: "child",
      title: "Administration",
      to: "/admin-dashboard/users",
      Icon: ChartLineIcon,
      hidden: !isAdmin,
    },
    {
      type: "label",
      title: "Gestion du patrimoine",
    },
    {
      type: "child",
      title: "Accueil",
      to: "/home",
      Icon: HomeIcon,
      hidden: isBaseOrSelfService,
    },
    {
      type: "child",
      title: "Biens",
      to: "/assets",
      Icon: PackageOpenIcon,
    },
    {
      type: "child",
      title: "Lots",
      to: "/kits",
      Icon: Package,
    },
    {
      type: "child",
      title: "Catégories",
      to: "/categories",
      Icon: BoxesIcon,
      hidden: isBaseOrSelfService,
    },

    {
      type: "child",
      title: "Étiquettes",
      to: "/tags",
      Icon: TagsIcon,
      hidden: isBaseOrSelfService,
    },
    {
      type: "child",
      title: "Sites",
      to: "/locations",
      Icon: MapPinIcon,
      hidden: isBaseOrSelfService,
    },
    {
      type: "child",
      title: "Audits",
      to: "/audits",
      Icon: ClipboardCheckIcon,
    },
    {
      type: "parent",
      title: "Réservations",
      Icon: CalendarRangeIcon,
      disabled: bookingDisabled,
      children: [
        {
          title: "Voir les réservations",
          to: "/bookings",
          disabled: bookingDisabled,
        },
        {
          title: "Calendrier",
          to: "/calendar",
          disabled: bookingDisabled,
        },
      ],
    },
    {
      type: "child",
      title: "Rappels",
      Icon: AlarmClockIcon,
      hidden: isBaseOrSelfService,
      to: "/reminders",
    },
    {
      type: "child",
      title: "Rapports",
      Icon: FileBarChartIcon,
      hidden: isBaseOrSelfService,
      to: "/reports",
    },
    {
      type: "label",
      title: "Organisation",
      hidden: isBaseOrSelfService,
    },
    {
      type: "parent",
      title: "Équipe",
      Icon: UsersRoundIcon,
      hidden: isBaseOrSelfService,
      children: [
        {
          title: "Utilisateurs",
          to: "/settings/team/users",
          hidden: isPersonalOrganization,
        },
        {
          title: "Invitations en attente",
          to: "/settings/team/invites",
          hidden: isPersonalOrganization,
        },
        {
          title: "Responsables sans compte",
          to: "/settings/team/nrm",
        },
      ],
    },
    {
      type: "parent",
      title: "Paramètres de l'espace",
      Icon: SettingsIcon,
      hidden: isBaseOrSelfService,
      children: [
        {
          title: "Général",
          to: "/settings/general",
        },
        {
          title: "Réservations",
          to: "/settings/bookings",
          hidden: isPersonalOrganization,
        },
        {
          title: "Champs personnalisés",
          to: "/settings/custom-fields",
        },
      ],
    },
  ];

  const bottomMenuItems: NavItem[] = [
    {
      type: "child",
      title: "Étiquettes QR",
      to: `https://store.shelf.nu/?ref=shelf_webapp_sidebar`,
      Icon: QrCodeIcon,
      target: "_blank",
    },
    {
      type: "child",
      title: "Scanner QR",
      to: "/scanner",
      Icon: ScanBarcodeIcon,
    },
    {
      type: "button",
      title: "Nouveautés",
      Icon: BellIcon,
      badge: {
        show: (unreadUpdatesCount || 0) > 0,
        variant: "unread" as const,
      },
      onClick: () => {
        // This will be handled by the sidebar component with popover
      },
    },
    {
      type: "button",
      title: "Questions / retour",
      Icon: MessageCircleIcon,
      onClick: () => {
        // Handled by FeedbackNavItem in sidebar-nav.tsx
      },
    },
  ];

  return {
    topMenuItems: removeHiddenNavItems(topMenuItems),
    bottomMenuItems: removeHiddenNavItems(bottomMenuItems),
  };
}

function removeHiddenNavItems(navItems: NavItem[]) {
  return navItems
    .filter((item) => !item.hidden)
    .map((item) => {
      if (item.type === "parent") {
        return {
          ...item,
          children: item.children.filter((child) => !child.hidden),
        };
      }

      return item;
    });
}
