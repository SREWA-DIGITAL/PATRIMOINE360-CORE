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
  "invite.workspace": {
    extraMessage?: string | null;
    invite: InviteWithInviterAndOrg;
    token: string;
  };
  "onboarding.welcome": {
    firstName?: string | null;
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
