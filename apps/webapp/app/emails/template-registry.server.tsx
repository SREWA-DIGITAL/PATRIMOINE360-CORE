import type { ReactElement } from "react";
import { Heading, Link, Text, render } from "@react-email/components";
import { config } from "~/config/shelf.config";
import { sendEmail } from "~/emails/mail.server";
import type { EmailPayloadType } from "~/emails/types";
import type { InviteWithInviterAndOrg } from "~/modules/invite/types";
import { SERVER_URL, SUPPORT_EMAIL } from "~/utils/env";
import { resolveUserDisplayName } from "~/utils/user";
import {
  EmailCtaButton,
  EmailInfoBox,
  PatrimoineEmailLayout,
} from "./components/patrimoine-email-layout";
import { styles } from "./styles";

type NamedEmailUser = {
  displayName?: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type EmailTemplatePayloads = {
  "account.delete-request-admin": {
    adminUrl: string;
    reason: string;
    requesterEmail: string;
    userId: string;
  };
  "account.delete-request-user": Record<string, never>;
  "account.deleted": Record<string, never>;
  "auth.change-email-otp": {
    otp: string;
    user: NamedEmailUser;
  };
  "auth.login-otp": {
    email: string;
    otp: string;
  };
  "auth.reset-password-otp": {
    email: string;
    otp: string;
  };
  "auth.signup-otp": {
    email: string;
    otp: string;
  };
  "auth.verify-email-link": {
    email: string;
    url: string;
  };
  "billing.audit-trial-ending-soon": {
    firstName?: string | null;
    hasPaymentMethod: boolean;
    trialEndDate: Date;
  };
  "billing.audit-trial-ending-tomorrow": {
    firstName?: string | null;
    hasPaymentMethod: boolean;
    trialEndDate: Date;
  };
  "billing.audit-trial-welcome": {
    firstName?: string | null;
    hasPaymentMethod: boolean;
  };
  "billing.barcode-trial-ending-soon": {
    firstName?: string | null;
    hasPaymentMethod: boolean;
    trialEndDate: Date;
  };
  "billing.barcode-trial-ending-tomorrow": {
    firstName?: string | null;
    hasPaymentMethod: boolean;
    trialEndDate: Date;
  };
  "billing.barcode-trial-welcome": {
    firstName?: string | null;
    hasPaymentMethod: boolean;
  };
  "billing.invoice-admin-notification": {
    eventType: string;
    invoiceId: string;
    status: "overdue" | "payment-failed" | "resolved";
    user: NamedEmailUser & { id: string };
  };
  "billing.invoice-overdue": {
    amountDue: string;
    customerEmail: string;
    customerName?: string | null;
    dueDate?: string | null;
    subscriptionName: string;
  };
  "billing.invoice-payment-failed": {
    amountDue: string;
    customerEmail: string;
    customerName?: string | null;
    dueDate?: string | null;
    subscriptionName: string;
  };
  "billing.plan-trial-ending-soon": {
    firstName?: string | null;
    hasPaymentMethod: boolean;
    planName: string;
    trialEndDate: Date;
  };
  "billing.subscription-activated": {
    customerName?: string | null;
    subscriptionName: string;
  };
  "billing.team-trial-welcome": {
    firstName?: string | null;
  };
  "invite.workspace": {
    extraMessage?: string | null;
    invite: InviteWithInviterAndOrg;
    token: string;
  };
  "onboarding.welcome": {
    firstName?: string | null;
  };
  "organization.ownership-transfer.admin": {
    newOwner: NamedEmailUser;
    previousOwner: NamedEmailUser;
    subscriptionTransferError?: string | null;
    subscriptionTransferred: boolean;
    workspaceId: string;
    workspaceName: string;
  };
  "organization.ownership-transfer.new-owner": {
    newOwnerName: string;
    subscriptionTransferred: boolean;
    workspaceName: string;
  };
  "organization.ownership-transfer.previous-owner": {
    newOwnerName: string;
    previousOwnerName: string;
    subscriptionTransferred: boolean;
    workspaceName: string;
  };
  "report-found.owner": {
    itemLabel: string;
    message: string;
    ownerEmail: string;
    reportType: string;
    reporterEmail: string;
  };
  "report-found.reporter": {
    itemLabel: string;
    reportType: string;
  };
  "team.access-revoked": {
    customEmailFooter?: string | null;
    orgName: string;
    recipientEmail: string;
  };
  "team.role-changed": {
    customEmailFooter?: string | null;
    newRole: string;
    orgName: string;
    previousRole: string;
    recipientEmail: string;
  };
};

export type EmailTemplateKey = keyof EmailTemplatePayloads;

type EmailTemplateDefinition<K extends EmailTemplateKey> = {
  audience: "admin" | "user" | "workspace-member";
  defaultLanguage: "fr";
  html: (data: EmailTemplatePayloads[K]) => Promise<string> | string;
  status: "a-conserver" | "a-fusionner" | "a-reecrire" | "a-retirer";
  subject: (data: EmailTemplatePayloads[K]) => string;
  tags: (data: EmailTemplatePayloads[K]) => string[];
  text: (data: EmailTemplatePayloads[K]) => string;
};

type EmailTemplateCatalogue = {
  [K in EmailTemplateKey]: EmailTemplateDefinition<K>;
};

const productName = config.brand.name;
const supportEmail = SUPPORT_EMAIL || "support@patrimoine360.local";

function getGreeting(name?: string | null) {
  return name?.trim() ? `Bonjour ${name},` : "Bonjour,";
}

function renderParagraphs(lines: string[]) {
  return lines.map((line, index) => (
    <Text
      key={`${line}-${index}`}
      style={{ ...styles.p, marginBottom: "16px" }}
    >
      {line}
    </Text>
  ));
}

function joinLines(lines: Array<string | false | null | undefined>) {
  return lines.filter(Boolean).join("\n");
}

function withFooter(text: string, footerText?: string | null) {
  if (!footerText?.trim()) {
    return text;
  }

  return `${text}\n\n---\n${footerText.trim()}`;
}

function inviteAcceptanceUrl(inviteId: string, token: string) {
  return `${SERVER_URL}/accept-invite/${inviteId}?token=${token}`;
}

function subscriptionSettingsUrl() {
  return `${SERVER_URL}/account-details/subscription`;
}

function workspaceSettingsUrl() {
  return `${SERVER_URL}/account-details/workspace`;
}

function auditsUrl() {
  return `${SERVER_URL}/audits`;
}

function settingsGeneralUrl() {
  return `${SERVER_URL}/settings/general`;
}

function adminDashboardUrl(userId: string) {
  return `${SERVER_URL}/admin-dashboard/${userId}`;
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
  }).format(date);
}

function getAddonLabel(kind: "audit" | "barcode") {
  return kind === "audit" ? "Audits" : "Codes-barres";
}

function getBillingGreeting(name?: string | null, fallback = "Bonjour,") {
  return name?.trim() ? `Bonjour ${name},` : fallback;
}

function getInvoiceStatusLabel(
  status: "overdue" | "payment-failed" | "resolved"
) {
  switch (status) {
    case "payment-failed":
      return "incident de paiement";
    case "overdue":
      return "facture en retard";
    case "resolved":
      return "facture regularisee";
  }
}

function getInvoiceAdminSubject(
  status: "overdue" | "payment-failed" | "resolved",
  email: string
) {
  switch (status) {
    case "payment-failed":
      return `Facture impayee : ${email}`;
    case "overdue":
      return `Facture en retard : ${email}`;
    case "resolved":
      return `Facture regularisee : ${email}`;
  }
}

function getTrialEndingSubject({
  hasPaymentMethod,
  kind,
  tomorrow = false,
}: {
  hasPaymentMethod: boolean;
  kind: "audit" | "barcode";
  tomorrow?: boolean;
}) {
  const label = getAddonLabel(kind);
  if (tomorrow) {
    return hasPaymentMethod
      ? `Votre essai ${label} se termine demain : prelevement automatique`
      : `Votre essai ${label} se termine demain`;
  }

  return hasPaymentMethod
    ? `Votre essai ${label} se termine bientot : prelevement automatique`
    : `Votre essai ${label} se termine bientot`;
}

async function renderTemplate(node: ReactElement) {
  return render(node);
}

export const emailTemplateCatalog: EmailTemplateCatalogue = {
  "account.delete-request-admin": {
    audience: "admin",
    defaultLanguage: "fr",
    html: async ({ adminUrl, reason, requesterEmail, userId }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Demande de suppression de compte">
          {renderParagraphs([
            "Une demande de suppression de compte a ete soumise sur Patrimoine360.",
            `Utilisateur concerne : ${requesterEmail}`,
            `Identifiant utilisateur : ${userId}`,
          ])}
          <EmailInfoBox label="Motif communique">
            <Text style={{ ...styles.p, margin: 0 }}>{reason}</Text>
          </EmailInfoBox>
          <Text style={{ ...styles.p, marginBottom: "16px" }}>
            Lien d'administration :
          </Text>
          <Text style={{ ...styles.p, marginBottom: "24px" }}>
            <Link href={adminUrl}>{adminUrl}</Link>
          </Text>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Demande de suppression de compte",
    tags: () => ["account", "deletion-request", "admin-notification"],
    text: ({ adminUrl, reason, requesterEmail, userId }) =>
      joinLines([
        "Demande de suppression de compte",
        "",
        "Une demande de suppression de compte a ete soumise sur Patrimoine360.",
        `Utilisateur concerne : ${requesterEmail}`,
        `Identifiant utilisateur : ${userId}`,
        `Lien d'administration : ${adminUrl}`,
        "",
        "Motif communique :",
        reason,
      ]),
  },
  "account.delete-request-user": {
    audience: "user",
    defaultLanguage: "fr",
    html: async () =>
      renderTemplate(
        <PatrimoineEmailLayout title="Demande de suppression recue">
          {renderParagraphs([
            "Nous avons bien recu votre demande de suppression de compte.",
            "Elle sera traitee dans un delai maximum de 72 heures.",
            "Si vous n'etes pas a l'origine de cette demande, contactez-nous sans attendre.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Demande de suppression de compte recue",
    tags: () => ["account", "deletion-request", "user-confirmation"],
    text: () =>
      joinLines([
        "Nous avons bien recu votre demande de suppression de compte.",
        "Elle sera traitee dans un delai maximum de 72 heures.",
        "Si vous n'etes pas a l'origine de cette demande, contactez-nous sans attendre.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "account.deleted": {
    audience: "user",
    defaultLanguage: "fr",
    html: async () =>
      renderTemplate(
        <PatrimoineEmailLayout title="Compte supprime">
          {renderParagraphs([
            "Votre compte Patrimoine360 a bien ete supprime.",
            "Si vous pensez qu'il s'agit d'une erreur, contactez notre equipe de support.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Votre compte Patrimoine360 a ete supprime",
    tags: () => ["user", "account-deleted", "transactional"],
    text: () =>
      joinLines([
        "Votre compte Patrimoine360 a bien ete supprime.",
        "Si vous pensez qu'il s'agit d'une erreur, contactez notre equipe de support.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "auth.change-email-otp": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ otp, user }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Confirmez votre nouvelle adresse e-mail">
          {renderParagraphs([
            getGreeting(resolveUserDisplayName(user)),
            "Utilisez ce code pour confirmer le changement de votre adresse e-mail dans Patrimoine360.",
          ])}
          <EmailInfoBox label="Code de confirmation">
            <Heading as="h2" style={{ ...styles.h2, margin: 0 }}>
              {otp}
            </Heading>
          </EmailInfoBox>
          {renderParagraphs([
            "Ne partagez jamais ce code. Notre equipe ne vous demandera jamais votre mot de passe, votre OTP ou vos informations bancaires.",
            "Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail et contactez le support.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ otp }) => `Code de confirmation ${productName} : ${otp}`,
    tags: () => ["account", "email-change", "otp"],
    text: ({ otp, user }) =>
      joinLines([
        getGreeting(resolveUserDisplayName(user)),
        "",
        "Utilisez ce code pour confirmer le changement de votre adresse e-mail dans Patrimoine360.",
        otp,
        "",
        "Ne partagez jamais ce code. Notre equipe ne vous demandera jamais votre mot de passe, votre OTP ou vos informations bancaires.",
        "Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail et contactez le support.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "auth.login-otp": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ otp }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Code de connexion">
          {renderParagraphs([
            "Utilisez ce code a usage unique pour vous connecter a Patrimoine360.",
          ])}
          <EmailInfoBox label="Code de connexion">
            <Heading as="h2" style={{ ...styles.h2, margin: 0 }}>
              {otp}
            </Heading>
          </EmailInfoBox>
          {renderParagraphs(["Ne partagez jamais ce code avec un tiers."])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ otp }) => `Code de connexion ${productName} : ${otp}`,
    tags: () => ["auth", "otp", "login"],
    text: ({ otp }) =>
      joinLines([
        "Utilisez ce code a usage unique pour vous connecter a Patrimoine360.",
        "",
        otp,
        "",
        "Ne partagez jamais ce code avec un tiers.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "auth.reset-password-otp": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ otp }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Reinitialisez votre mot de passe">
          {renderParagraphs([
            "Utilisez ce code pour definir un nouveau mot de passe Patrimoine360.",
          ])}
          <EmailInfoBox label="Code de reinitialisation">
            <Heading as="h2" style={{ ...styles.h2, margin: 0 }}>
              {otp}
            </Heading>
          </EmailInfoBox>
          {renderParagraphs([
            "Si vous n'etes pas a l'origine de cette demande, ignorez simplement cet e-mail.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ otp }) => `Code de reinitialisation ${productName} : ${otp}`,
    tags: () => ["auth", "password-reset"],
    text: ({ otp }) =>
      joinLines([
        "Utilisez ce code pour definir un nouveau mot de passe Patrimoine360.",
        "",
        otp,
        "",
        "Si vous n'etes pas a l'origine de cette demande, ignorez simplement cet e-mail.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "auth.signup-otp": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ otp }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Confirmez votre adresse e-mail">
          {renderParagraphs([
            "Utilisez ce code pour confirmer votre adresse e-mail et finaliser votre acces a Patrimoine360.",
          ])}
          <EmailInfoBox label="Code de confirmation">
            <Heading as="h2" style={{ ...styles.h2, margin: 0 }}>
              {otp}
            </Heading>
          </EmailInfoBox>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ otp }) => `Code de confirmation ${productName} : ${otp}`,
    tags: () => ["auth", "otp", "confirm-signup"],
    text: ({ otp }) =>
      joinLines([
        "Utilisez ce code pour confirmer votre adresse e-mail et finaliser votre acces a Patrimoine360.",
        "",
        otp,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "auth.verify-email-link": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ url }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Confirmez votre adresse e-mail">
          {renderParagraphs([
            "Confirmez votre adresse e-mail pour finaliser la creation de votre compte Patrimoine360.",
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton href={url} label="Confirmer mon adresse e-mail" />
          </div>
          {renderParagraphs([
            "Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :",
          ])}
          <Text style={{ ...styles.p, marginBottom: "24px" }}>
            <Link href={url}>{url}</Link>
          </Text>
          {renderParagraphs([
            "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet e-mail.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Confirmez votre adresse e-mail",
    tags: () => ["auth", "email-verification", "transactional"],
    text: ({ url }) =>
      joinLines([
        "Confirmez votre adresse e-mail pour finaliser la creation de votre compte Patrimoine360.",
        "",
        `Confirmer mon adresse e-mail : ${url}`,
        "",
        "Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet e-mail.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.audit-trial-ending-soon": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName, hasPaymentMethod, trialEndDate }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          title={getTrialEndingSubject({
            hasPaymentMethod,
            kind: "audit",
          })}
        >
          {renderParagraphs([
            getBillingGreeting(firstName),
            hasPaymentMethod
              ? `Votre essai Audits se termine le ${formatLongDate(
                  trialEndDate
                )}. Comme un moyen de paiement est deja enregistre, l'abonnement passera automatiquement en payant a la fin de l'essai.`
              : `Votre essai Audits se termine le ${formatLongDate(
                  trialEndDate
                )}. Sans moyen de paiement valide, l'acces aux audits sera suspendu a la fin de l'essai.`,
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={subscriptionSettingsUrl()}
              label={
                hasPaymentMethod
                  ? "Gerer mon abonnement"
                  : "Ajouter un moyen de paiement"
              }
            />
          </div>
          {renderParagraphs([
            hasPaymentMethod
              ? "Si vous ne souhaitez pas continuer, vous pouvez resilier depuis vos parametres d'abonnement avant la fin de l'essai."
              : "Ajoutez un moyen de paiement avant l'echeance pour conserver un acces continu a cette fonctionnalite.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ hasPaymentMethod }) =>
      getTrialEndingSubject({ hasPaymentMethod, kind: "audit" }),
    tags: () => ["billing", "trial", "audit", "ends-soon"],
    text: ({ firstName, hasPaymentMethod, trialEndDate }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        hasPaymentMethod
          ? `Votre essai Audits se termine le ${formatLongDate(
              trialEndDate
            )}. Comme un moyen de paiement est deja enregistre, l'abonnement passera automatiquement en payant a la fin de l'essai.`
          : `Votre essai Audits se termine le ${formatLongDate(
              trialEndDate
            )}. Sans moyen de paiement valide, l'acces aux audits sera suspendu a la fin de l'essai.`,
        hasPaymentMethod
          ? `Gerer mon abonnement : ${subscriptionSettingsUrl()}`
          : `Ajouter un moyen de paiement : ${subscriptionSettingsUrl()}`,
        "",
        hasPaymentMethod
          ? "Si vous ne souhaitez pas continuer, vous pouvez resilier depuis vos parametres d'abonnement avant la fin de l'essai."
          : "Ajoutez un moyen de paiement avant l'echeance pour conserver un acces continu a cette fonctionnalite.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.audit-trial-ending-tomorrow": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName, hasPaymentMethod, trialEndDate }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          title={getTrialEndingSubject({
            hasPaymentMethod,
            kind: "audit",
            tomorrow: true,
          })}
        >
          {renderParagraphs([
            getBillingGreeting(firstName),
            hasPaymentMethod
              ? `Votre essai Audits se termine demain, le ${formatLongDate(
                  trialEndDate
                )}. Le passage a l'abonnement payant se fera automatiquement si vous conservez votre moyen de paiement actuel.`
              : `Votre essai Audits se termine demain, le ${formatLongDate(
                  trialEndDate
                )}. Sans moyen de paiement valide, l'acces sera suspendu a l'echeance.`,
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={subscriptionSettingsUrl()}
              label={
                hasPaymentMethod
                  ? "Verifier mon abonnement"
                  : "Ajouter un moyen de paiement"
              }
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ hasPaymentMethod }) =>
      getTrialEndingSubject({
        hasPaymentMethod,
        kind: "audit",
        tomorrow: true,
      }),
    tags: () => ["billing", "trial", "audit", "ends-tomorrow"],
    text: ({ firstName, hasPaymentMethod, trialEndDate }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        hasPaymentMethod
          ? `Votre essai Audits se termine demain, le ${formatLongDate(
              trialEndDate
            )}. Le passage a l'abonnement payant se fera automatiquement si vous conservez votre moyen de paiement actuel.`
          : `Votre essai Audits se termine demain, le ${formatLongDate(
              trialEndDate
            )}. Sans moyen de paiement valide, l'acces sera suspendu a l'echeance.`,
        hasPaymentMethod
          ? `Verifier mon abonnement : ${subscriptionSettingsUrl()}`
          : `Ajouter un moyen de paiement : ${subscriptionSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.audit-trial-welcome": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName, hasPaymentMethod }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Votre essai Audits est actif">
          {renderParagraphs([
            getBillingGreeting(firstName),
            `Votre essai Audits de ${config.freeTrialDays} jours est maintenant actif sur Patrimoine360.`,
            "Vous pouvez commencer a planifier vos campagnes de verification, suivre les ecarts et centraliser vos controles.",
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton href={auditsUrl()} label="Ouvrir les audits" />
          </div>
          {renderParagraphs([
            hasPaymentMethod
              ? "Un moyen de paiement est deja enregistre. Si vous ne souhaitez pas continuer apres l'essai, pensez a resilier avant l'echeance depuis vos parametres d'abonnement."
              : "Aucun moyen de paiement n'est encore enregistre. Vous pourrez en ajouter un plus tard si vous souhaitez poursuivre sans interruption.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Votre essai Audits Patrimoine360 est actif",
    tags: () => ["billing", "trial", "audit", "welcome"],
    text: ({ firstName, hasPaymentMethod }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        `Votre essai Audits de ${config.freeTrialDays} jours est maintenant actif sur Patrimoine360.`,
        "Vous pouvez commencer a planifier vos campagnes de verification, suivre les ecarts et centraliser vos controles.",
        `Ouvrir les audits : ${auditsUrl()}`,
        "",
        hasPaymentMethod
          ? `Un moyen de paiement est deja enregistre. Si vous ne souhaitez pas continuer apres l'essai, pensez a resilier avant l'echeance : ${subscriptionSettingsUrl()}`
          : "Aucun moyen de paiement n'est encore enregistre. Vous pourrez en ajouter un plus tard si vous souhaitez poursuivre sans interruption.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.barcode-trial-ending-soon": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName, hasPaymentMethod, trialEndDate }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          title={getTrialEndingSubject({
            hasPaymentMethod,
            kind: "barcode",
          })}
        >
          {renderParagraphs([
            getBillingGreeting(firstName),
            hasPaymentMethod
              ? `Votre essai Codes-barres se termine le ${formatLongDate(
                  trialEndDate
                )}. Comme un moyen de paiement est deja enregistre, l'abonnement passera automatiquement en payant a la fin de l'essai.`
              : `Votre essai Codes-barres se termine le ${formatLongDate(
                  trialEndDate
                )}. Sans moyen de paiement valide, l'acces sera suspendu a la fin de l'essai.`,
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={subscriptionSettingsUrl()}
              label={
                hasPaymentMethod
                  ? "Gerer mon abonnement"
                  : "Ajouter un moyen de paiement"
              }
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ hasPaymentMethod }) =>
      getTrialEndingSubject({ hasPaymentMethod, kind: "barcode" }),
    tags: () => ["billing", "trial", "barcode", "ends-soon"],
    text: ({ firstName, hasPaymentMethod, trialEndDate }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        hasPaymentMethod
          ? `Votre essai Codes-barres se termine le ${formatLongDate(
              trialEndDate
            )}. Comme un moyen de paiement est deja enregistre, l'abonnement passera automatiquement en payant a la fin de l'essai.`
          : `Votre essai Codes-barres se termine le ${formatLongDate(
              trialEndDate
            )}. Sans moyen de paiement valide, l'acces sera suspendu a la fin de l'essai.`,
        hasPaymentMethod
          ? `Gerer mon abonnement : ${subscriptionSettingsUrl()}`
          : `Ajouter un moyen de paiement : ${subscriptionSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.barcode-trial-ending-tomorrow": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName, hasPaymentMethod, trialEndDate }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          title={getTrialEndingSubject({
            hasPaymentMethod,
            kind: "barcode",
            tomorrow: true,
          })}
        >
          {renderParagraphs([
            getBillingGreeting(firstName),
            hasPaymentMethod
              ? `Votre essai Codes-barres se termine demain, le ${formatLongDate(
                  trialEndDate
                )}. Le passage a l'abonnement payant se fera automatiquement si vous conservez votre moyen de paiement actuel.`
              : `Votre essai Codes-barres se termine demain, le ${formatLongDate(
                  trialEndDate
                )}. Sans moyen de paiement valide, l'acces sera suspendu a l'echeance.`,
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={subscriptionSettingsUrl()}
              label={
                hasPaymentMethod
                  ? "Verifier mon abonnement"
                  : "Ajouter un moyen de paiement"
              }
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ hasPaymentMethod }) =>
      getTrialEndingSubject({
        hasPaymentMethod,
        kind: "barcode",
        tomorrow: true,
      }),
    tags: () => ["billing", "trial", "barcode", "ends-tomorrow"],
    text: ({ firstName, hasPaymentMethod, trialEndDate }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        hasPaymentMethod
          ? `Votre essai Codes-barres se termine demain, le ${formatLongDate(
              trialEndDate
            )}. Le passage a l'abonnement payant se fera automatiquement si vous conservez votre moyen de paiement actuel.`
          : `Votre essai Codes-barres se termine demain, le ${formatLongDate(
              trialEndDate
            )}. Sans moyen de paiement valide, l'acces sera suspendu a l'echeance.`,
        hasPaymentMethod
          ? `Verifier mon abonnement : ${subscriptionSettingsUrl()}`
          : `Ajouter un moyen de paiement : ${subscriptionSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.barcode-trial-welcome": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName, hasPaymentMethod }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Votre essai Codes-barres est actif">
          {renderParagraphs([
            getBillingGreeting(firstName),
            `Votre essai Codes-barres de ${config.freeTrialDays} jours est maintenant actif sur Patrimoine360.`,
            "Vous pouvez des a present generer et exploiter vos QR codes pour fluidifier l'inventaire terrain.",
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={settingsGeneralUrl()}
              label="Ouvrir les parametres"
            />
          </div>
          {renderParagraphs([
            hasPaymentMethod
              ? "Un moyen de paiement est deja enregistre. Si vous ne souhaitez pas poursuivre apres l'essai, pensez a resilier avant l'echeance."
              : "Aucun moyen de paiement n'est encore enregistre. Vous pourrez en ajouter un plus tard si vous souhaitez conserver l'acces.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Votre essai Codes-barres Patrimoine360 est actif",
    tags: () => ["billing", "trial", "barcode", "welcome"],
    text: ({ firstName, hasPaymentMethod }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        `Votre essai Codes-barres de ${config.freeTrialDays} jours est maintenant actif sur Patrimoine360.`,
        "Vous pouvez des a present generer et exploiter vos QR codes pour fluidifier l'inventaire terrain.",
        `Ouvrir les parametres : ${settingsGeneralUrl()}`,
        "",
        hasPaymentMethod
          ? `Un moyen de paiement est deja enregistre. Si vous ne souhaitez pas poursuivre apres l'essai, pensez a resilier avant l'echeance : ${subscriptionSettingsUrl()}`
          : "Aucun moyen de paiement n'est encore enregistre. Vous pourrez en ajouter un plus tard si vous souhaitez conserver l'acces.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.invoice-admin-notification": {
    audience: "admin",
    defaultLanguage: "fr",
    html: async ({ eventType, invoiceId, status, user }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          title={getInvoiceAdminSubject(status, user.email)}
        >
          {renderParagraphs([
            `Une notification de facturation a ete emise pour ${user.email}.`,
            `Type d'evenement Stripe : ${eventType}`,
            `Statut : ${getInvoiceStatusLabel(status)}`,
            `Facture : ${invoiceId}`,
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={adminDashboardUrl(user.id)}
              label="Ouvrir le tableau de bord admin"
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ status, user }) => getInvoiceAdminSubject(status, user.email),
    tags: () => ["billing", "invoice", "admin-notification"],
    text: ({ eventType, invoiceId, status, user }) =>
      joinLines([
        `Une notification de facturation a ete emise pour ${user.email}.`,
        `Type d'evenement Stripe : ${eventType}`,
        `Statut : ${getInvoiceStatusLabel(status)}`,
        `Facture : ${invoiceId}`,
        `Tableau de bord admin : ${adminDashboardUrl(user.id)}`,
      ]),
  },
  "billing.invoice-overdue": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ amountDue, customerName, dueDate, subscriptionName }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Action requise : facture en retard">
          {renderParagraphs([
            getBillingGreeting(customerName),
            `La facture associee a votre abonnement ${subscriptionName} est actuellement en retard.`,
          ])}
          <EmailInfoBox label="Details de la facture">
            <Text style={{ ...styles.p, margin: 0 }}>
              Montant : {amountDue}
              <br />
              {dueDate ? `Echeance : ${dueDate}` : "Echeance : immediate"}
            </Text>
          </EmailInfoBox>
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={subscriptionSettingsUrl()}
              label="Mettre a jour mon paiement"
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Action requise : votre facture Patrimoine360 est en retard",
    tags: () => ["billing", "invoice", "overdue"],
    text: ({ amountDue, customerName, dueDate, subscriptionName }) =>
      joinLines([
        getBillingGreeting(customerName),
        "",
        `La facture associee a votre abonnement ${subscriptionName} est actuellement en retard.`,
        `Montant : ${amountDue}`,
        `Echeance : ${dueDate ?? "immediate"}`,
        `Mettre a jour mon paiement : ${subscriptionSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.invoice-payment-failed": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ amountDue, customerName, dueDate, subscriptionName }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Action requise : probleme de paiement">
          {renderParagraphs([
            getBillingGreeting(customerName),
            `Nous n'avons pas pu traiter le dernier paiement de votre abonnement ${subscriptionName}.`,
          ])}
          <EmailInfoBox label="Details de la facture">
            <Text style={{ ...styles.p, margin: 0 }}>
              Montant : {amountDue}
              <br />
              {dueDate ? `Echeance : ${dueDate}` : "Echeance : immediate"}
            </Text>
          </EmailInfoBox>
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={subscriptionSettingsUrl()}
              label="Mettre a jour mon paiement"
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () =>
      "Action requise : probleme de paiement sur votre abonnement Patrimoine360",
    tags: () => ["billing", "invoice", "payment-failed"],
    text: ({ amountDue, customerName, dueDate, subscriptionName }) =>
      joinLines([
        getBillingGreeting(customerName),
        "",
        `Nous n'avons pas pu traiter le dernier paiement de votre abonnement ${subscriptionName}.`,
        `Montant : ${amountDue}`,
        `Echeance : ${dueDate ?? "immediate"}`,
        `Mettre a jour mon paiement : ${subscriptionSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.plan-trial-ending-soon": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName, hasPaymentMethod, planName, trialEndDate }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          title={
            hasPaymentMethod
              ? "Votre essai se termine bientot : prelevement automatique"
              : "Votre essai se termine bientot"
          }
        >
          {renderParagraphs([
            getBillingGreeting(firstName),
            hasPaymentMethod
              ? `Votre essai ${planName} se termine le ${formatLongDate(
                  trialEndDate
                )}. Comme un moyen de paiement est deja enregistre, l'abonnement sera active automatiquement a la fin de l'essai.`
              : `Votre essai ${planName} se termine le ${formatLongDate(
                  trialEndDate
                )}. Pour conserver vos fonctionnalites premium sans interruption, passez a un abonnement payant avant l'echeance.`,
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={subscriptionSettingsUrl()}
              label="Gerer mon abonnement"
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ hasPaymentMethod }) =>
      hasPaymentMethod
        ? "Votre essai Patrimoine360 se termine bientot : prelevement automatique"
        : "Votre essai Patrimoine360 se termine bientot",
    tags: () => ["billing", "trial", "team", "ends-soon"],
    text: ({ firstName, hasPaymentMethod, planName, trialEndDate }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        hasPaymentMethod
          ? `Votre essai ${planName} se termine le ${formatLongDate(
              trialEndDate
            )}. Comme un moyen de paiement est deja enregistre, l'abonnement sera active automatiquement a la fin de l'essai.`
          : `Votre essai ${planName} se termine le ${formatLongDate(
              trialEndDate
            )}. Pour conserver vos fonctionnalites premium sans interruption, passez a un abonnement payant avant l'echeance.`,
        `Gerer mon abonnement : ${subscriptionSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.subscription-activated": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ customerName, subscriptionName }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Votre abonnement est actif">
          {renderParagraphs([
            getBillingGreeting(customerName),
            `Bonne nouvelle : votre abonnement ${subscriptionName} est maintenant actif.`,
            "Vous pouvez des a present profiter des fonctionnalites associees a votre formule.",
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton href={SERVER_URL} label="Ouvrir Patrimoine360" />
          </div>
          {renderParagraphs([
            `Vous pouvez gerer votre abonnement a tout moment depuis ${subscriptionSettingsUrl()}.`,
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Votre abonnement Patrimoine360 est maintenant actif",
    tags: () => ["billing", "subscription", "activated"],
    text: ({ customerName, subscriptionName }) =>
      joinLines([
        getBillingGreeting(customerName),
        "",
        `Bonne nouvelle : votre abonnement ${subscriptionName} est maintenant actif.`,
        `Ouvrir Patrimoine360 : ${SERVER_URL}`,
        `Gerer mon abonnement : ${subscriptionSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "billing.team-trial-welcome": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Votre essai Equipe est pret">
          {renderParagraphs([
            getBillingGreeting(firstName),
            `Votre essai Equipe Patrimoine360 de ${config.freeTrialDays} jours est maintenant actif.`,
            "Pour en tirer le meilleur parti, creez un espace de travail, importez vos premiers biens et invitez votre equipe.",
          ])}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton
              href={workspaceSettingsUrl()}
              label="Configurer mon espace"
            />
          </div>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Votre essai Equipe Patrimoine360 est pret",
    tags: () => ["billing", "trial", "team", "welcome"],
    text: ({ firstName }) =>
      joinLines([
        getBillingGreeting(firstName),
        "",
        `Votre essai Equipe Patrimoine360 de ${config.freeTrialDays} jours est maintenant actif.`,
        "Pour en tirer le meilleur parti, creez un espace de travail, importez vos premiers biens et invitez votre equipe.",
        `Configurer mon espace : ${workspaceSettingsUrl()}`,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "invite.workspace": {
    audience: "workspace-member",
    defaultLanguage: "fr",
    html: async ({ extraMessage, invite, token }) => {
      const inviterName = resolveUserDisplayName(invite.inviter);
      const url = inviteAcceptanceUrl(invite.id, token);

      return renderTemplate(
        <PatrimoineEmailLayout
          customFooter={invite.organization.customEmailFooter}
          recipientEmail={invite.inviteeEmail}
          title={`Invitation a rejoindre ${invite.organization.name}`}
        >
          {renderParagraphs([
            "Bonjour,",
            `${inviterName} vous invite a rejoindre l'espace ${invite.organization.name} sur Patrimoine360.`,
          ])}
          {extraMessage ? (
            <EmailInfoBox label={`Message de ${inviterName}`}>
              <Text
                style={{
                  ...styles.p,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {extraMessage}
              </Text>
            </EmailInfoBox>
          ) : null}
          <div style={{ marginBottom: "24px" }}>
            <EmailCtaButton href={url} label="Accepter l'invitation" />
          </div>
          {renderParagraphs([
            "Une fois votre acces active, vous pourrez rejoindre l'espace de travail et commencer a gerer vos biens, sites, affectations et rappels.",
            `Si vous avez des questions, contactez ${supportEmail}.`,
          ])}
        </PatrimoineEmailLayout>
      );
    },
    status: "a-reecrire",
    subject: ({ invite }) =>
      `Invitation a rejoindre ${invite.organization.name} sur ${productName}`,
    tags: () => ["invite", "organization", "transactional"],
    text: ({ extraMessage, invite, token }) => {
      const inviterName = resolveUserDisplayName(invite.inviter);
      const url = inviteAcceptanceUrl(invite.id, token);

      return withFooter(
        joinLines([
          "Bonjour,",
          "",
          `${inviterName} vous invite a rejoindre l'espace ${invite.organization.name} sur Patrimoine360.`,
          extraMessage
            ? joinLines(["", `Message de ${inviterName} :`, extraMessage])
            : "",
          "",
          `Accepter l'invitation : ${url}`,
          "",
          "Une fois votre acces active, vous pourrez rejoindre l'espace de travail et commencer a gerer vos biens, sites, affectations et rappels.",
          `Si vous avez des questions, contactez ${supportEmail}.`,
          "",
          `Cordialement,`,
          `L'equipe ${productName}`,
        ]),
        invite.organization.customEmailFooter
      );
    },
  },
  "onboarding.welcome": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ firstName }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Bienvenue sur Patrimoine360">
          {renderParagraphs([
            getGreeting(firstName),
            "Votre espace Patrimoine360 est pret.",
            "Si vous souhaitez nous partager votre contexte, vos priorites ou les fonctionnalites que vous attendez, repondez simplement a cet e-mail.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: () => "Bienvenue sur Patrimoine360",
    tags: () => ["onboarding", "welcome", "transactional"],
    text: ({ firstName }) =>
      joinLines([
        getGreeting(firstName),
        "",
        "Votre espace Patrimoine360 est pret.",
        "Si vous souhaitez nous partager votre contexte, vos priorites ou les fonctionnalites que vous attendez, repondez simplement a cet e-mail.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "organization.ownership-transfer.admin": {
    audience: "admin",
    defaultLanguage: "fr",
    html: async ({
      newOwner,
      previousOwner,
      subscriptionTransferError,
      subscriptionTransferred,
      workspaceId,
      workspaceName,
    }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          title={
            subscriptionTransferError
              ? `Transfert d'espace avec alerte : ${workspaceName}`
              : `Transfert d'espace : ${workspaceName}`
          }
        >
          {renderParagraphs([
            `Un transfert de propriete a ete realise sur l'espace ${workspaceName}.`,
            `Identifiant espace : ${workspaceId}`,
            `Ancien proprietaire : ${resolveUserDisplayName(previousOwner)} (${
              previousOwner.email
            })`,
            `Nouveau proprietaire : ${resolveUserDisplayName(newOwner)} (${
              newOwner.email
            })`,
            `Abonnement transfere : ${subscriptionTransferred ? "oui" : "non"}`,
          ])}
          {subscriptionTransferError ? (
            <EmailInfoBox label="Details de l'alerte">
              <Text style={{ ...styles.p, margin: 0 }}>
                {subscriptionTransferError}
              </Text>
            </EmailInfoBox>
          ) : null}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ subscriptionTransferError, workspaceName }) =>
      subscriptionTransferError
        ? `Transfert d'espace avec alerte : ${workspaceName}`
        : `Transfert d'espace : ${workspaceName}`,
    tags: () => ["organization", "ownership-transfer", "admin-notification"],
    text: ({
      newOwner,
      previousOwner,
      subscriptionTransferError,
      subscriptionTransferred,
      workspaceId,
      workspaceName,
    }) =>
      joinLines([
        `Un transfert de propriete a ete realise sur l'espace ${workspaceName}.`,
        `Identifiant espace : ${workspaceId}`,
        `Ancien proprietaire : ${resolveUserDisplayName(previousOwner)} (${
          previousOwner.email
        })`,
        `Nouveau proprietaire : ${resolveUserDisplayName(newOwner)} (${
          newOwner.email
        })`,
        `Abonnement transfere : ${subscriptionTransferred ? "oui" : "non"}`,
        subscriptionTransferError
          ? `Alerte : ${subscriptionTransferError}`
          : "",
      ]),
  },
  "organization.ownership-transfer.new-owner": {
    audience: "workspace-member",
    defaultLanguage: "fr",
    html: async ({ newOwnerName, subscriptionTransferred, workspaceName }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Vous etes maintenant proprietaire de l'espace">
          {renderParagraphs([
            getBillingGreeting(newOwnerName),
            `Vous etes maintenant proprietaire de l'espace ${workspaceName}.`,
            "Vous pouvez desormais gerer les reglages, les utilisateurs et la facturation associee.",
            subscriptionTransferred
              ? "L'abonnement en cours a egalement ete transfere vers votre compte."
              : "Aucun transfert d'abonnement n'a ete realise dans cette operation.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ workspaceName }) =>
      `Vous etes maintenant proprietaire de ${workspaceName}`,
    tags: () => ["organization", "ownership-transfer", "new-owner"],
    text: ({ newOwnerName, subscriptionTransferred, workspaceName }) =>
      joinLines([
        getBillingGreeting(newOwnerName),
        "",
        `Vous etes maintenant proprietaire de l'espace ${workspaceName}.`,
        "Vous pouvez desormais gerer les reglages, les utilisateurs et la facturation associee.",
        subscriptionTransferred
          ? "L'abonnement en cours a egalement ete transfere vers votre compte."
          : "Aucun transfert d'abonnement n'a ete realise dans cette operation.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "organization.ownership-transfer.previous-owner": {
    audience: "workspace-member",
    defaultLanguage: "fr",
    html: async ({
      newOwnerName,
      previousOwnerName,
      subscriptionTransferred,
      workspaceName,
    }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Le transfert de propriete a ete confirme">
          {renderParagraphs([
            getBillingGreeting(previousOwnerName),
            `Vous avez transfere la propriete de l'espace ${workspaceName} a ${newOwnerName}.`,
            "Vous conservez un acces administrateur, sans les droits de proprietaire ni de facturation.",
            subscriptionTransferred
              ? `${newOwnerName} gere desormais aussi l'abonnement associe a cet espace.`
              : "Aucun transfert d'abonnement n'a ete realise dans cette operation.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ workspaceName }) =>
      `Le transfert de propriete de ${workspaceName} est confirme`,
    tags: () => ["organization", "ownership-transfer", "previous-owner"],
    text: ({
      newOwnerName,
      previousOwnerName,
      subscriptionTransferred,
      workspaceName,
    }) =>
      joinLines([
        getBillingGreeting(previousOwnerName),
        "",
        `Vous avez transfere la propriete de l'espace ${workspaceName} a ${newOwnerName}.`,
        "Vous conservez un acces administrateur, sans les droits de proprietaire ni de facturation.",
        subscriptionTransferred
          ? `${newOwnerName} gere desormais aussi l'abonnement associe a cet espace.`
          : "Aucun transfert d'abonnement n'a ete realise dans cette operation.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "report-found.owner": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ itemLabel, message, reportType, reporterEmail }) =>
      renderTemplate(
        <PatrimoineEmailLayout title={`Signalement recu pour ${itemLabel}`}>
          {renderParagraphs([
            `Votre ${reportType} ${itemLabel} a ete signale comme retrouve.`,
            `Adresse de contact du declarant : ${reporterEmail}`,
          ])}
          <EmailInfoBox label="Message recu">
            <Text style={{ ...styles.p, margin: 0, whiteSpace: "pre-wrap" }}>
              {message}
            </Text>
          </EmailInfoBox>
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ itemLabel }) => `Signalement recu pour ${itemLabel}`,
    tags: ({ reportType }) => [
      "report-found",
      "owner-notification",
      reportType.toLowerCase(),
    ],
    text: ({ itemLabel, message, reportType, reporterEmail }) =>
      joinLines([
        `Votre ${reportType} ${itemLabel} a ete signale comme retrouve.`,
        `Adresse de contact du declarant : ${reporterEmail}`,
        "",
        "Message recu :",
        message,
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "report-found.reporter": {
    audience: "user",
    defaultLanguage: "fr",
    html: async ({ itemLabel, reportType }) =>
      renderTemplate(
        <PatrimoineEmailLayout title="Votre message a bien ete transmis">
          {renderParagraphs([
            `Merci. Le proprietaire du ${reportType} ${itemLabel} a bien ete informe de votre message.`,
            "Il pourra vous recontacter directement s'il souhaite donner suite.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ itemLabel }) =>
      `Votre message pour ${itemLabel} a ete transmis`,
    tags: ({ reportType }) => [
      "report-found",
      "reporter-confirmation",
      reportType.toLowerCase(),
    ],
    text: ({ itemLabel, reportType }) =>
      joinLines([
        `Merci. Le proprietaire du ${reportType} ${itemLabel} a bien ete informe de votre message.`,
        "Il pourra vous recontacter directement s'il souhaite donner suite.",
        "",
        `Cordialement,`,
        `L'equipe ${productName}`,
      ]),
  },
  "team.access-revoked": {
    audience: "workspace-member",
    defaultLanguage: "fr",
    html: async ({ customEmailFooter, orgName, recipientEmail }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          customFooter={customEmailFooter}
          recipientEmail={recipientEmail}
          title={`Acces retire a ${orgName}`}
        >
          {renderParagraphs([
            `Votre acces a l'espace ${orgName} a ete retire.`,
            "Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur de cet espace.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ orgName }) => `Acces retire a ${orgName}`,
    tags: () => ["team", "access-revoked", "organization"],
    text: ({ customEmailFooter, orgName }) =>
      withFooter(
        joinLines([
          `Votre acces a l'espace ${orgName} a ete retire.`,
          "Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur de cet espace.",
          "",
          `Cordialement,`,
          `L'equipe ${productName}`,
        ]),
        customEmailFooter
      ),
  },
  "team.role-changed": {
    audience: "workspace-member",
    defaultLanguage: "fr",
    html: async ({
      customEmailFooter,
      newRole,
      orgName,
      previousRole,
      recipientEmail,
    }) =>
      renderTemplate(
        <PatrimoineEmailLayout
          customFooter={customEmailFooter}
          recipientEmail={recipientEmail}
          title="Votre role a ete mis a jour"
        >
          {renderParagraphs([
            `Votre role dans l'espace ${orgName} a ete modifie : ${previousRole} -> ${newRole}.`,
            "Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur de cet espace.",
          ])}
        </PatrimoineEmailLayout>
      ),
    status: "a-reecrire",
    subject: ({ orgName }) => `Votre role a ete mis a jour dans ${orgName}`,
    tags: () => ["team", "role-changed", "organization"],
    text: ({ customEmailFooter, newRole, orgName, previousRole }) =>
      withFooter(
        joinLines([
          `Votre role dans l'espace ${orgName} a ete modifie : ${previousRole} -> ${newRole}.`,
          "Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur de cet espace.",
          "",
          `Cordialement,`,
          `L'equipe ${productName}`,
        ]),
        customEmailFooter
      ),
  },
};

export async function resolveTemplatedEmail<K extends EmailTemplateKey>(
  template: K,
  data: EmailTemplatePayloads[K]
) {
  const definition = emailTemplateCatalog[template];

  return {
    html: await definition.html(data),
    subject: definition.subject(data),
    tags: definition.tags(data),
    text: definition.text(data),
  };
}

export async function sendTemplatedEmail<K extends EmailTemplateKey>({
  data,
  tags,
  template,
  ...payload
}: Omit<EmailPayloadType, "html" | "subject" | "text" | "tags"> & {
  data: EmailTemplatePayloads[K];
  tags?: string[];
  template: K;
}) {
  const resolved = await resolveTemplatedEmail(template, data);

  return sendEmail({
    ...payload,
    html: resolved.html,
    subject: resolved.subject,
    tags: [...resolved.tags, ...(tags ?? [])],
    text: resolved.text,
  });
}
