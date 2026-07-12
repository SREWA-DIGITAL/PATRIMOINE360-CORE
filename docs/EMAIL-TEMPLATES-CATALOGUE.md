# Catalogue des templates e-mail Core

## Decision de reference

- Source de verite: `apps/webapp/app/emails/template-registry.server.tsx`
- Moteur de rendu: React Email cote code
- Transport: Brevo ou SMTP via `sendEmail()`
- Regle de convergence: les nouveaux flux transactionnels doivent passer par `sendTemplatedEmail()`

## Templates deja normalises

### Auth / identite

- `auth.verify-email-link`
- `auth.login-otp`
- `auth.signup-otp`
- `auth.reset-password-otp`
- `auth.change-email-otp`

### Invitation / onboarding

- `invite.workspace`
- `onboarding.welcome`

### Compte / equipe

- `account.delete-request-admin`
- `account.delete-request-user`
- `account.deleted`
- `team.access-revoked`
- `team.role-changed`

## Flows raccordes sur le registre

- Better Auth:
  - verification d'adresse e-mail
  - OTP de connexion
  - OTP de confirmation d'inscription
  - OTP de reinitialisation de mot de passe
  - OTP de changement d'e-mail
- Invitation workspace
- E-mail d'onboarding
- Demande de suppression de compte
- Confirmation de suppression de compte
- Notification de suppression effective
- Retrait d'acces workspace
- Changement de role workspace

## Phases suivantes recommandees

### Phase 3

- Bookings
- Audits
- Report found
- Notifications organisation / ownership transfer

### Phase 4

- Billing Stripe
- Trials
- Factures impayees
- Alertes admin de facturation

## Revue minimale pour tout nouveau template

- branding `Patrimoine360`
- sujet francais coherent
- rendu HTML
- fallback texte
- tags d'observabilite
- absence de `Shelf` et `shelf.nu` dans le contenu utilisateur
