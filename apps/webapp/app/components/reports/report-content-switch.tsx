/**
 * @file Report content dispatcher.
 *
 * Routes the loader's payload to the right per-report Content component
 * based on `reportId`. Also owns the empty-state branch so the route
 * page doesn't have to know about it.
 *
 * This is the seam where the route-loaded payload (loosely typed via
 * `ReportPayload<any>` upstream) gets cast to the per-report row type
 * each Content component expects. The casts mirror what the original
 * inline switch in the route did before the extraction.
 *
 * @see {@link file://./../../routes/_layout+/reports.$reportId.tsx}
 */

import type {
  AssetActivityRow,
  AssetInventoryRow,
  AssetUtilizationRow,
  BookingComplianceRow,
  ChartSeries,
  ComplianceData,
  CustodySnapshotRow,
  DistributionBreakdown,
  IdleAssetRow,
  MonthlyBookingTrendRow,
  OverdueItemRow,
  ReportKpi,
  ResolvedTimeframe,
  TopBookedAssetRow,
} from "~/modules/reports/types";

import { AssetActivityContent } from "./asset-activity-content";
import { AssetDistributionContent } from "./asset-distribution-content";
import { AssetInventoryContent } from "./asset-inventory-content";
import { AssetUtilizationContent } from "./asset-utilization-content";
import { BookingComplianceContent } from "./booking-compliance-content";
import { CustodySnapshotContent } from "./custody-snapshot-content";
import { IdleAssetsContent } from "./idle-assets-content";
import { MonthlyBookingTrendsContent } from "./monthly-booking-trends-content";
import { OverdueItemsContent } from "./overdue-items-content";
import { ReportEmptyState } from "./report-empty-state";
import { TopBookedAssetsContent } from "./top-booked-assets-content";
import type { ReportRowHandlers } from "./use-report-row-handlers";

/** Props for {@link ReportContentSwitch}. */
type Props = {
  /** Active report id; drives which Content component renders. */
  reportId: string;
  /** Page slice of rows for this report (typed loosely; cast per
   *  branch to the report's row type). */
  rows: unknown[];
  /** KPI cards aggregated for the page. */
  kpis: ReportKpi[];
  /** Total row count across all pages (display in tables). */
  totalRows: number;
  /** Resolved timeframe — used by some Content components for the
   *  hero label. */
  timeframe: ResolvedTimeframe;
  /** Booking-compliance-only payload extra. */
  complianceData?: ComplianceData;
  /** Top-booked-assets-only payload extra (the singular #1 asset). */
  topBookedAsset?: TopBookedAssetRow | null;
  /** Distribution-only payload extra. */
  distributionBreakdown?: DistributionBreakdown;
  /** Monthly-booking-trends-only payload extra. */
  chartSeries?: ChartSeries[];
  /** Stable row-click handlers from `useReportRowHandlers`. */
  handlers: ReportRowHandlers;
};

/**
 * Renders the right Content component for `reportId`, or an empty
 * state when there are no rows.
 */
export function ReportContentSwitch({
  reportId,
  rows,
  kpis,
  totalRows,
  timeframe,
  complianceData,
  topBookedAsset,
  distributionBreakdown,
  chartSeries,
  handlers,
}: Props) {
  // Distribution is the one report with no row table — it's purely
  // donut-driven, so `hasData` is meaningless there. Always render it
  // and let `AssetDistributionContent` handle its own empty state.
  if (reportId === "distribution") {
    return (
      <AssetDistributionContent
        kpis={kpis}
        distributionBreakdown={distributionBreakdown}
      />
    );
  }

  // Every other report falls back to a shared empty state when no
  // rows came back.
  if (rows.length === 0) {
    return (
      <div className="rounded border border-gray-200 bg-white">
        <ReportEmptyState
          reason="no_data"
          title={getEmptyStateTitle(reportId)}
          description={getEmptyStateDescription(reportId)}
          ctaTo={getEmptyStateCta(reportId)?.to}
          ctaLabel={getEmptyStateCta(reportId)?.label}
        />
      </div>
    );
  }

  switch (reportId) {
    case "booking-compliance":
      return (
        <BookingComplianceContent
          rows={rows as BookingComplianceRow[]}
          complianceData={complianceData}
          totalBookings={totalRows}
          timeframeLabel={timeframe.label}
          onRowClick={handlers.onBookingRowClick}
        />
      );

    case "overdue-items":
      return (
        <OverdueItemsContent
          rows={rows as OverdueItemRow[]}
          kpis={kpis}
          totalRows={totalRows}
          onRowClick={handlers.onBookingRowClick}
        />
      );

    case "idle-assets":
      return (
        <IdleAssetsContent
          rows={rows as IdleAssetRow[]}
          kpis={kpis}
          totalRows={totalRows}
          timeframeLabel={timeframe.label}
          onRowClick={handlers.onAssetRowClick}
        />
      );

    case "custody-snapshot":
      return (
        <CustodySnapshotContent
          rows={rows as CustodySnapshotRow[]}
          kpis={kpis}
          totalRows={totalRows}
          onRowClick={handlers.onAssetRowClick}
        />
      );

    case "top-booked-assets":
      return (
        <TopBookedAssetsContent
          rows={rows as TopBookedAssetRow[]}
          kpis={kpis}
          totalRows={totalRows}
          timeframeLabel={timeframe.label}
          topBookedAsset={topBookedAsset}
          onRowClick={handlers.onAssetRowClick}
        />
      );

    case "asset-inventory":
      return (
        <AssetInventoryContent
          rows={rows as AssetInventoryRow[]}
          kpis={kpis}
          totalRows={totalRows}
          onRowClick={handlers.onAssetRowClick}
        />
      );

    case "monthly-booking-trends":
      return (
        <MonthlyBookingTrendsContent
          rows={rows as MonthlyBookingTrendRow[]}
          kpis={kpis}
          totalRows={totalRows}
          chartSeries={chartSeries}
        />
      );

    case "asset-utilization":
      return (
        <AssetUtilizationContent
          rows={rows as AssetUtilizationRow[]}
          kpis={kpis}
          totalRows={totalRows}
          onRowClick={handlers.onAssetRowClick}
        />
      );

    case "asset-activity":
      return (
        <AssetActivityContent
          rows={rows as AssetActivityRow[]}
          kpis={kpis}
          totalRows={totalRows}
          onRowClick={handlers.onAssetRowClick}
        />
      );

    default:
      return (
        <ReportEmptyState
          reason="error"
          title="Rapport non implémenté"
          description="Ce type de rapport n'est pas encore pris en charge."
        />
      );
  }
}

// -----------------------------------------------------------------------------
// Empty-state copy
//
// Reports are analytics views, not action prompts. The primary guidance
// should help users find data (expand timeframe, adjust filters), not
// necessarily create new data.
// -----------------------------------------------------------------------------

function getEmptyStateTitle(reportId: string): string {
  switch (reportId) {
    case "booking-compliance":
      return "Aucune réservation à analyser";
    case "overdue-items":
      return "Aucun retard de réservation";
    case "idle-assets":
      return "Aucun bien inactif";
    case "custody-snapshot":
      return "Aucun bien affecté";
    case "top-booked-assets":
      return "Aucune activité de réservation";
    case "distribution":
      return "Aucun bien";
    case "asset-inventory":
      return "Aucun bien dans l'inventaire";
    case "monthly-booking-trends":
      return "Aucune donnée de réservation";
    case "asset-utilization":
      return "Aucune donnée d'utilisation";
    case "asset-activity":
      return "Aucune activité enregistrée";
    default:
      return "Aucune donnée sur cette période";
  }
}

function getEmptyStateDescription(reportId: string): string {
  switch (reportId) {
    case "booking-compliance":
      // This is an analytics report - focus on finding data, not creating it.
      // The report analyzes check-out/check-in compliance for bookings that
      // fall within the selected timeframe.
      return "Ce rapport suit si les réservations ont été sorties et restituées à temps. Essayez une période plus longue pour afficher l'historique de conformité.";
    case "overdue-items":
      return "Bonne nouvelle : aucune réservation n'est actuellement en retard.";
    case "idle-assets":
      return "Tous vos biens ont été utilisés sur la période sélectionnée. Ajustez le seuil d'inactivité pour repérer les biens les moins sollicités.";
    case "custody-snapshot":
      return "Aucun responsable n'a actuellement de bien affecté. Les biens apparaîtront ici dès qu'une affectation sera créée.";
    case "top-booked-assets":
      return "Aucun bien n'a été réservé sur la période sélectionnée. Essayez une période plus longue pour voir l'activité.";
    case "distribution":
      return "Ajoutez des biens à votre inventaire pour afficher leur répartition par catégorie, localisation et statut.";
    case "asset-inventory":
      return "Votre inventaire est vide. Ajoutez des biens pour les retrouver ici avec les options de filtre et d'export.";
    case "monthly-booking-trends":
      return "Aucune réservation n'a été créée sur la période sélectionnée. Essayez une période plus longue pour voir les tendances.";
    case "asset-utilization":
      return "Aucune activité de réservation sur la période sélectionnée. Des réservations sont nécessaires pour calculer les taux d'utilisation.";
    case "asset-activity":
      return "Aucune activité n'a été enregistrée pour vos biens sur cette période. L'activité apparaît lors des mises à jour, réservations ou changements d'affectation.";
    default:
      return "Essayez une autre période pour trouver des données pour ce rapport.";
  }
}

/**
 * Returns a CTA for the empty state, if appropriate. For analytics
 * reports we intentionally return `null` because "create new data"
 * isn't the right action when viewing reports — the user came here
 * to analyze, not to create.
 */
function getEmptyStateCta(
  _reportId: string
): { to: string; label: string } | null {
  // For now, no reports have a CTA in their empty state.
  // The appropriate action is to adjust the timeframe, which is
  // already available via the TimeframePicker above.
  return null;
}
