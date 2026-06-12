/**
 * Reports Registry
 *
 * Single source of truth for all available reports. Each report is defined
 * with its metadata, supported filters, and capabilities. The registry is
 * consumed by:
 * - Reports index page (to render the grid of available reports)
 * - Report runner (to validate reportId and load configuration)
 * - Export endpoint (to validate export requests)
 *
 * @see {@link file://./types.ts}
 * @see {@link file://../../routes/_layout+/reports._index.tsx}
 */

import type { ReportDefinition } from "./types";

/**
 * All available reports. Order determines display order in the reports index.
 *
 * Reports are grouped by category:
 * - overview: Cross-cutting reports (inventory snapshots, distributions)
 * - bookings: Booking lifecycle and compliance
 * - assets: Asset-specific activity and utilization
 * - custody: Custody tracking and history
 * - audits: Audit completion and compliance
 */
export const REPORTS: ReportDefinition[] = [
  // -------------------------------------------------------------------------
  // Booking Reports
  // -------------------------------------------------------------------------
  {
    id: "booking-compliance",
    title: "Suivi des réservations",
    description:
      "Suivez les sorties, les retours en retard et les biens en dépassement.",
    category: "bookings",
    icon: "ClipboardCheck",
    enabled: true, // R2 — the first report we're building
    filters: [
      { type: "status", label: "Statut", multi: true },
      { type: "team_member", label: "Responsable", multi: false },
      { type: "location", label: "Site", multi: false },
    ],
    hasChart: true,
    exportable: true,
  },
  {
    id: "top-booked-assets",
    title: "Biens les plus réservés",
    description:
      "Identifiez les biens les plus réservés et leurs tendances d'utilisation.",
    category: "bookings",
    icon: "TrendingUp",
    enabled: true, // R3
    filters: [
      { type: "category", label: "Catégorie", multi: true },
      { type: "location", label: "Site", multi: false },
    ],
    hasChart: true,
    exportable: true,
  },
  {
    id: "monthly-booking-trends",
    title: "Tendances mensuelles des réservations",
    description:
      "Visualisez l'évolution du volume de réservations mois par mois.",
    category: "bookings",
    icon: "BarChart3",
    enabled: true, // R9
    filters: [
      { type: "category", label: "Catégorie", multi: true },
      { type: "location", label: "Site", multi: false },
    ],
    hasChart: true,
    exportable: true, // Monthly breakdown table can be exported
  },
  {
    id: "overdue-items",
    title: "Retards en cours",
    description:
      "Consultez les réservations en retard qui nécessitent une action.",
    category: "bookings",
    icon: "AlertTriangle",
    enabled: true, // R6
    filters: [
      { type: "team_member", label: "Responsable", multi: false },
      { type: "location", label: "Site", multi: false },
    ],
    hasChart: false,
    exportable: true,
  },

  // -------------------------------------------------------------------------
  // Asset Reports
  // -------------------------------------------------------------------------
  {
    id: "asset-inventory",
    title: "Inventaire des biens",
    description:
      "Consultez l'inventaire complet des biens avec filtres et export.",
    category: "assets",
    icon: "Package",
    enabled: true, // R1
    filters: [
      { type: "category", label: "Catégorie", multi: true },
      { type: "location", label: "Site", multi: true },
      { type: "status", label: "Statut", multi: true },
    ],
    hasChart: false,
    exportable: true,
  },
  {
    id: "asset-activity",
    title: "Activité des biens",
    description:
      "Analysez l'activité des biens : modifications, affectations et réservations.",
    category: "assets",
    icon: "Activity",
    enabled: true, // R7
    filters: [
      { type: "asset", label: "Bien", multi: false },
      { type: "category", label: "Catégorie", multi: true },
    ],
    hasChart: true,
    exportable: true,
  },
  {
    id: "asset-utilization",
    title: "Utilisation des biens",
    description:
      "Mesurez l'utilisation des biens à partir des réservations et affectations.",
    category: "assets",
    icon: "PieChart",
    enabled: true, // R8
    filters: [
      { type: "category", label: "Catégorie", multi: true },
      { type: "location", label: "Site", multi: false },
    ],
    hasChart: true,
    exportable: true,
  },
  {
    id: "idle-assets",
    title: "Biens inactifs",
    description:
      "Repérez les biens qui n'ont pas été réservés ou sortis récemment.",
    category: "assets",
    icon: "Clock",
    enabled: true, // R4
    filters: [
      { type: "category", label: "Catégorie", multi: true },
      { type: "location", label: "Site", multi: false },
    ],
    hasChart: false,
    exportable: true,
  },
  {
    id: "distribution",
    title: "Répartition des biens",
    description:
      "Analysez les biens par catégorie, site et statut.",
    category: "assets",
    icon: "LayoutGrid",
    enabled: true, // R10
    filters: [],
    hasChart: true,
    exportable: true,
  },

  // -------------------------------------------------------------------------
  // Custody Reports
  // -------------------------------------------------------------------------
  {
    id: "custody-snapshot",
    title: "Affectations en cours",
    description:
      "Consultez les biens actuellement affectés et leurs responsables.",
    category: "custody",
    icon: "Users",
    enabled: true, // R5
    filters: [
      { type: "team_member", label: "Responsable", multi: false },
      { type: "location", label: "Site", multi: false },
    ],
    hasChart: false,
    exportable: true,
  },
];

/**
 * Get a report definition by ID.
 *
 * @param reportId - The report's unique identifier
 * @returns The report definition, or undefined if not found
 */
export function getReportById(reportId: string): ReportDefinition | undefined {
  return REPORTS.find((r) => r.id === reportId);
}

/**
 * Get all enabled reports.
 *
 * @returns Array of reports that are currently enabled
 */
export function getEnabledReports(): ReportDefinition[] {
  return REPORTS.filter((r) => r.enabled);
}

/**
 * Get reports grouped by category.
 *
 * @returns Object with category keys and arrays of reports
 */
export function getReportsByCategory(): Record<string, ReportDefinition[]> {
  return REPORTS.reduce(
    (acc, report) => {
      const category = report.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(report);
      return acc;
    },
    {} as Record<string, ReportDefinition[]>
  );
}

/** Category metadata for display */
export const REPORT_CATEGORIES: Record<
  ReportDefinition["category"],
  { label: string; description: string }
> = {
  overview: {
    label: "Vue d'ensemble",
    description: "Synthèses et répartitions globales",
  },
  bookings: {
    label: "Réservations",
    description: "Cycle de vie et suivi des réservations",
  },
  assets: {
    label: "Biens",
    description: "Inventaire, activité et utilisation des biens",
  },
  custody: {
    label: "Affectations",
    description: "Responsabilités et affectations en cours",
  },
  audits: {
    label: "Audits",
    description: "Contrôle et conformité des inventaires",
  },
};
