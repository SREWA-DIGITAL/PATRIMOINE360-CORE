import type { AuditForEmail } from "~/emails/audit-updates-template";
import { auditUpdatesTemplateString } from "~/emails/audit-updates-template";
import { sendEmail } from "~/emails/mail.server";
import type { ClientHint } from "~/utils/client-hints";
import { getDateTimeFormatFromHints } from "~/utils/client-hints";
import { SERVER_URL } from "~/utils/env";
import { ShelfError } from "~/utils/error";
import { Logger } from "~/utils/logger";
import { resolveUserDisplayName } from "~/utils/user";

function getAuditEmailTags(event: string, audience: string) {
  return ["audit", event, "notification", audience];
}

type BasicAuditEmailContentArgs = {
  auditName: string;
  assetsCount: number;
  creatorName: string;
  description?: string | null;
  dueDate?: Date | null;
  hints: ClientHint;
  auditId: string;
  organizationId?: string;
  customEmailFooter?: string | null;
};

/**
 * Base content for audit-related emails (plain text version).
 * Provides general info in a standardized format.
 */
export const baseAuditTextEmailContent = ({
  auditName,
  creatorName,
  assetsCount,
  description,
  dueDate,
  hints,
  auditId,
  organizationId,
  customEmailFooter,
  emailContent,
}: BasicAuditEmailContentArgs & { emailContent: string }) => {
  const dueDateText = dueDate
    ? `Date limite : ${getDateTimeFormatFromHints(hints, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(dueDate)}\n`
    : "";
  const orgQuery = organizationId ? `?orgId=${organizationId}` : "";

  return `Bonjour,

${emailContent}

${auditName} | ${assetsCount} ${assetsCount === 1 ? "bien" : "biens"}

Cree par : ${creatorName}
${dueDateText}${description ? `Description : ${description}\n` : ""}
Pour ouvrir l'audit :
${SERVER_URL}/audits/${auditId}/overview${orgQuery}
${customEmailFooter ? `\n---\n${customEmailFooter}\n` : ""}
Cordialement,
L'equipe Patrimoine360
`;
};

/**
 * Email content when an audit is assigned to a user
 */
export const auditAssignedEmailContent = (args: BasicAuditEmailContentArgs) =>
  baseAuditTextEmailContent({
    ...args,
    emailContent: `Vous avez ete assigne a l'audit "${args.auditName}".`,
  });

/**
 * Builds the plain-text body for the audit-cancelled email.
 *
 * `cancelledByName` is the user who actually performed the cancellation вЂ”
 * may differ from `creatorName` (the audit's original creator) when an
 * admin/owner cancels an audit a team member created.
 *
 * @param args - Standard audit email args plus the resolved canceller name.
 * @param args.cancelledByName - Display name of the acting canceller, used
 *   in the body sentence ("cancelled by {cancelledByName}").
 * @returns The full plain-text email body produced by
 *   {@link baseAuditTextEmailContent}.
 */
export const auditCancelledEmailContent = (
  args: BasicAuditEmailContentArgs & { cancelledByName: string }
) =>
  baseAuditTextEmailContent({
    ...args,
    emailContent: `L'audit "${args.auditName}" a ete annule par ${args.cancelledByName}. Cet audit n'est plus actif.`,
  });

/**
 * Email content when an audit is completed
 */
export const auditCompletedEmailContent = (
  args: BasicAuditEmailContentArgs & {
    completedAt: Date;
    wasOverdue: boolean;
  }
) => {
  const orgQuery = args.organizationId ? `?orgId=${args.organizationId}` : "";
  const receiptQuery = orgQuery ? `${orgQuery}&receipt=1` : "?receipt=1";
  const completedDateText = getDateTimeFormatFromHints(args.hints, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(args.completedAt);

  const dueDateText = args.dueDate
    ? getDateTimeFormatFromHints(args.hints, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(args.dueDate)
    : null;

  let statusMessage = `L'audit "${args.auditName}" a ete termine le ${completedDateText}.`;

  if (dueDateText) {
    if (args.wasOverdue) {
      statusMessage += `\n\nCet audit a ete termine apres la date limite (${dueDateText}).`;
    } else {
      statusMessage += `\n\nCet audit a ete termine avant la date limite (${dueDateText}).`;
    }
  }

  // Include a direct receipt link for the completion email.
  statusMessage += `\n\nTelecharger le recu :\n${SERVER_URL}/audits/${args.auditId}/overview${receiptQuery}`;

  return baseAuditTextEmailContent({
    ...args,
    emailContent: statusMessage,
  });
};

/**
 * Generic email content for audit reminders
 * @param timeframe - Human-readable timeframe (e.g., "24 hours", "4 hours", "1 hour")
 */
export const auditReminderEmailContent = (
  args: BasicAuditEmailContentArgs & { timeframe: string }
) =>
  baseAuditTextEmailContent({
    ...args,
    emailContent: `Rappel : l'audit "${args.auditName}" arrive a echeance dans ${args.timeframe}.`,
  });

/**
 * Email content for overdue audits
 */
export const auditOverdueEmailContent = (args: BasicAuditEmailContentArgs) =>
  baseAuditTextEmailContent({
    ...args,
    emailContent: `L'audit "${args.auditName}" est maintenant en retard. Merci de le terminer des que possible.`,
  });

/**
 * Sends an email notification when a user is assigned to an audit
 */
export async function sendAuditAssignedEmail({
  audit,
  assigneeEmail,
  assigneeName,
  hints,
}: {
  audit: AuditForEmail;
  assigneeEmail: string;
  assigneeName: string;
  hints: ClientHint;
}) {
  const creatorName = resolveUserDisplayName(audit.createdBy);
  const assetCount = audit._count.assets;

  try {
    const html = await auditUpdatesTemplateString({
      audit,
      heading: `Affectation a l'audit : "${audit.name}"`,
      hints,
      assetCount,
    });

    sendEmail({
      to: assigneeEmail,
      subject: `Affectation a l'audit : ${audit.name}`,
      text: auditAssignedEmailContent({
        auditName: audit.name,
        assetsCount: assetCount,
        creatorName,
        description: audit.description,
        dueDate: audit.dueDate,
        hints,
        auditId: audit.id,
        customEmailFooter: audit.organization.customEmailFooter,
      }),
      html,
      tags: getAuditEmailTags("assigned", "assignee"),
    });

    Logger.info(
      `Audit assignment email sent to ${assigneeName} (${assigneeEmail}) for audit: ${audit.name}`
    );
  } catch (emailError) {
    Logger.error(
      new ShelfError({
        cause: emailError,
        message: "Failed to send audit assignment email",
        additionalData: {
          auditId: audit.id,
          assigneeEmail,
          assigneeName,
        },
        label: "Audit",
      })
    );
  }
}

/**
 * Sends an "audit cancelled" email to each provided recipient.
 *
 * Recipient construction (assigneesToNotify) is the caller's responsibility вЂ”
 * the service decides who to notify. This function only handles delivery and
 * fan-out: per recipient it builds the plain-text + HTML versions, calls
 * {@link sendEmail}, and logs success or wraps any per-send failure in a
 * {@link ShelfError} via {@link Logger.error}. Failures for one recipient do
 * not stop sends to the others.
 *
 * @param args
 * @param args.audit - Audit record with the metadata embedded in the email
 *   (name, dueDate, organization, asset count, etc.).
 * @param args.assigneesToNotify - Recipients with email + display fields.
 *   Pass an empty array to skip sending entirely.
 * @param args.cancelledByName - Display name of the acting canceller. May
 *   differ from `audit.createdBy` when an admin/owner cancels someone
 *   else's audit; recipients see this name in the body, not the creator's.
 * @param args.hints - Client hints used to localise dates in the email.
 * @returns void. Per-recipient send errors are logged, not thrown.
 */
export function sendAuditCancelledEmails({
  audit,
  assigneesToNotify,
  cancelledByName,
  hints,
}: {
  audit: AuditForEmail;
  assigneesToNotify: Array<{
    userId: string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      displayName?: string | null;
    };
  }>;
  /**
   * Display name of the user who actually cancelled the audit. May differ
   * from the original creator when an admin/owner cancels someone else's
   * audit вЂ” recipients see the real canceller, not the creator.
   */
  cancelledByName: string;
  hints: ClientHint;
}) {
  const creatorName = resolveUserDisplayName(audit.createdBy);
  const assetCount = audit._count.assets;

  if (assigneesToNotify.length === 0) {
    return;
  }

  assigneesToNotify.forEach(async (assignment) => {
    try {
      const html = await auditUpdatesTemplateString({
        audit,
        heading: `Audit annule : "${audit.name}"`,
        hints,
        assetCount,
      });

      sendEmail({
        to: assignment.user.email,
        subject: `Audit annule : ${audit.name}`,
        text: auditCancelledEmailContent({
          auditName: audit.name,
          assetsCount: assetCount,
          creatorName,
          cancelledByName,
          description: audit.description,
          dueDate: audit.dueDate,
          hints,
          auditId: audit.id,
          customEmailFooter: audit.organization.customEmailFooter,
        }),
        html,
        tags: getAuditEmailTags("cancelled", "assignee"),
      });

      const assigneeName =
        resolveUserDisplayName(assignment.user) || "Unknown User";
      Logger.info(
        `Audit cancellation email sent to ${assigneeName} (${assignment.user.email})`
      );
    } catch (emailError) {
      Logger.error(
        new ShelfError({
          cause: emailError,
          message: "Failed to send audit cancellation email",
          additionalData: {
            auditId: audit.id,
            userId: assignment.userId,
            email: assignment.user.email,
          },
          label: "Audit",
        })
      );
    }
  });
}

/**
 * Send email notification to assignees when audit is completed
 */
export function sendAuditCompletedEmail({
  audit,
  assigneesToNotify,
  hints,
  completedAt,
  wasOverdue,
}: {
  audit: AuditForEmail;
  assigneesToNotify: Array<{
    userId: string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      displayName?: string | null;
    };
  }>;
  hints: ClientHint;
  completedAt: Date;
  wasOverdue: boolean;
}): void {
  const creatorName = resolveUserDisplayName(audit.createdBy) || "Unknown User";
  const assetCount = audit._count.assets;

  if (assigneesToNotify.length === 0) {
    return;
  }

  assigneesToNotify.forEach(async (assignment) => {
    try {
      const html = await auditUpdatesTemplateString({
        audit,
        heading: `Audit termine : "${audit.name}"`,
        hints,
        assetCount,
        completedAt,
        wasOverdue,
      });

      sendEmail({
        to: assignment.user.email,
        subject: `Audit termine : ${audit.name}`,
        text: auditCompletedEmailContent({
          auditName: audit.name,
          assetsCount: assetCount,
          creatorName,
          description: audit.description,
          dueDate: audit.dueDate,
          hints,
          auditId: audit.id,
          organizationId: audit.organizationId,
          customEmailFooter: audit.organization.customEmailFooter,
          completedAt,
          wasOverdue,
        }),
        html,
        tags: getAuditEmailTags("completed", "assignee"),
      });

      const assigneeName =
        resolveUserDisplayName(assignment.user) || "Unknown User";
      Logger.info(
        `Audit completion email sent to ${assigneeName} (${assignment.user.email})`
      );
    } catch (emailError) {
      Logger.error(
        new ShelfError({
          cause: emailError,
          message: "Failed to send audit completion email",
          additionalData: {
            auditId: audit.id,
            userId: assignment.userId,
            email: assignment.user.email,
          },
          label: "Audit",
        })
      );
    }
  });
}

/**
 * Send audit reminder email to assignees
 * @param timeframe - Human-readable timeframe (e.g., "24 hours", "4 hours", "1 hour")
 * @param heading - Email heading/subject prefix (e.g., "рџ”” Audit due in 24 hours")
 */
export function sendAuditReminderEmail({
  audit,
  assignees,
  hints,
  timeframe,
  heading,
}: {
  audit: AuditForEmail;
  assignees: Array<{
    userId: string;
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      displayName?: string | null;
    };
  }>;
  hints: ClientHint;
  timeframe: string;
  heading: string;
}): void {
  const creatorName = resolveUserDisplayName(audit.createdBy) || "Unknown User";
  const assetCount = audit._count.assets;

  assignees.forEach(async (assignment) => {
    try {
      const html = await auditUpdatesTemplateString({
        audit,
        heading,
        hints,
        assetCount,
      });

      sendEmail({
        to: assignment.user.email,
        subject: `${heading} : ${audit.name}`,
        text: auditReminderEmailContent({
          auditName: audit.name,
          assetsCount: assetCount,
          creatorName,
          description: audit.description,
          dueDate: audit.dueDate,
          hints,
          auditId: audit.id,
          customEmailFooter: audit.organization.customEmailFooter,
          timeframe,
        }),
        html,
        tags: getAuditEmailTags("reminder", "assignee"),
      });

      const assigneeName =
        resolveUserDisplayName(assignment.user) || "Unknown User";
      Logger.info(
        `${timeframe} reminder email sent to ${assigneeName} (${assignment.user.email})`
      );
    } catch (emailError) {
      Logger.error(
        new ShelfError({
          cause: emailError,
          message: `Failed to send ${timeframe} reminder email`,
          additionalData: {
            auditId: audit.id,
            userId: assignment.userId,
            email: assignment.user.email,
          },
          label: "Audit",
        })
      );
    }
  });
}

/**
 * Send overdue notice email to both creator and assignees
 */
export function sendAuditOverdueEmail({
  audit,
  recipients,
  hints,
}: {
  audit: AuditForEmail;
  recipients: Array<{
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName?: string | null;
  }>;
  hints: ClientHint;
}): void {
  const creatorName = resolveUserDisplayName(audit.createdBy) || "Unknown User";
  const assetCount = audit._count.assets;

  recipients.forEach(async (recipient) => {
    try {
      const html = await auditUpdatesTemplateString({
        audit,
        heading: `Audit en retard : "${audit.name}"`,
        hints,
        assetCount,
      });

      sendEmail({
        to: recipient.email,
        subject: `Audit en retard : ${audit.name}`,
        text: auditOverdueEmailContent({
          auditName: audit.name,
          assetsCount: assetCount,
          creatorName,
          description: audit.description,
          dueDate: audit.dueDate,
          hints,
          auditId: audit.id,
          customEmailFooter: audit.organization.customEmailFooter,
        }),
        html,
        tags: getAuditEmailTags("overdue", "recipient"),
      });

      const recipientName = resolveUserDisplayName(recipient) || "Unknown User";
      Logger.info(
        `Overdue notice email sent to ${recipientName} (${recipient.email})`
      );
    } catch (emailError) {
      Logger.error(
        new ShelfError({
          cause: emailError,
          message: "Failed to send overdue notice email",
          additionalData: {
            auditId: audit.id,
            email: recipient.email,
          },
          label: "Audit",
        })
      );
    }
  });
}
