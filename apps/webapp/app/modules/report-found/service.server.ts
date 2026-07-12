import type { Asset, Kit, Prisma, ReportFound, User } from "@prisma/client";
import { db } from "~/database/db.server";
import { sendTemplatedEmail } from "~/emails/template-registry.server";
import type { QR_SELECT_FOR_REPORT } from "~/routes/qr+/_public+/$qrId_.contact-owner";
import { ShelfError } from "~/utils/error";
import { normalizeQrData } from "~/utils/qr";

export async function createReport({
  email,
  content,
  assetId,
  kitId,
}: Pick<ReportFound, "email" | "content"> & {
  assetId?: Asset["id"];
  kitId?: Kit["id"];
}) {
  try {
    return await db.reportFound.create({
      data: {
        email,
        content,
        ...(assetId && {
          asset: {
            connect: {
              id: assetId,
            },
          },
        }),

        ...(kitId && {
          kit: {
            connect: {
              id: kitId,
            },
          },
        }),
      },
    });
  } catch (cause) {
    throw new ShelfError({
      cause,
      message:
        "Something went wrong while creating the report. Please try again or contact support.",
      additionalData: { email, content, assetId, kitId },
      label: "Report",
    });
  }
}

export function sendReportEmails({
  ownerEmail,
  message,
  reporterEmail,
  qr,
}: {
  ownerEmail: User["email"];
  message: ReportFound["content"];
  reporterEmail: ReportFound["email"];
  qr: Prisma.QrGetPayload<{
    select: typeof QR_SELECT_FOR_REPORT;
  }>;
}) {
  const { item, type, normalizedName } = normalizeQrData(qr);
  const isUnlinked = !qr.assetId && !qr.kitId;
  const reportType = type ?? "item";
  const itemLabel = item ? normalizedName : `QR ${qr.id}`;

  try {
    /** Send email to owner */
    void sendTemplatedEmail({
      to: ownerEmail,
      template: "report-found.owner",
      data: {
        itemLabel,
        message,
        ownerEmail,
        reportType: isUnlinked ? "code QR" : reportType,
        reporterEmail,
      },
    });

    /** Send email to reporter */
    void sendTemplatedEmail({
      to: reporterEmail,
      template: "report-found.reporter",
      data: {
        itemLabel,
        reportType: isUnlinked ? "code QR" : reportType,
      },
    });

    return;
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: "Failed to send report emails",
      additionalData: { ownerEmail, reporterEmail, item, type, normalizedName },
      label: "Report",
    });
  }
}
