# Cartographie Brevo et feuille de route Supabase

## Objectif

Basculer les emails transactionnels de Patrimoine360 Core vers Brevo sans
interrompre les parcours critiques, puis documenter ce qui reste encore couplé
à Supabase après la sortie de Supabase du rôle d'émetteur d'emails.

## État actuel

### Socle backend Brevo

Le backend dispose maintenant d'un point d'entrée unique pour l'envoi
d'emails :

- `apps/webapp/app/emails/mail.server.ts`
- `apps/webapp/app/emails/email.worker.server.ts`
- `apps/webapp/app/emails/email-provider.server.ts`
- `apps/webapp/app/emails/brevo-email-provider.server.ts`
- `apps/webapp/app/emails/smtp-email-provider.server.ts`

Le flux applicatif est désormais :

`sendEmail()` -> `triggerEmail()` -> `deliverEmail()` -> provider `smtp` ou
provider `brevo`

La bascule progressive repose sur `EMAIL_PROVIDER` :

- `EMAIL_PROVIDER="smtp"` : rollback immédiat vers le provider historique
- `EMAIL_PROVIDER="brevo"` : envoi backend via Brevo

Ce mécanisme couvre à la fois le mode de coexistence temporaire et le plan de
retour arrière.

### Flux applicatifs déjà compatibles Brevo

Ces flux passent déjà par `sendEmail()` et utilisent donc automatiquement le
provider configuré :

- invitations : `apps/webapp/app/modules/invite/service.server.ts`
- onboarding : `apps/webapp/app/routes/_welcome+/onboarding.tsx`
- changement d'email / suppression de compte :
  `apps/webapp/app/routes/_layout+/account-details.general.tsx`
- notifications métier existantes :
  `booking/*`, `audit/*`, `organization/*`, `report-found/*`,
  `stripe-webhook/*`, `user/*`

Les flux les plus visibles disposent maintenant de tags métier pour la
traçabilité Brevo :

- `auth/*`
- `invite/*`
- `onboarding/*`
- `account/*`
- `booking/*`
- `audit/*`
- `team/*`

### Flux d'authentification sortis du rôle d'émetteur Supabase

Les parcours suivants n'ont plus besoin que Supabase expédie l'email lui-même.
Supabase reste utilisé pour l'identité et la vérification OTP.

#### OTP de connexion

- émission : `auth.admin.generateLink({ type: "magiclink" })` puis `sendEmail()`
- vérification : `auth.verifyOtp({ type: "email" })`

#### OTP d'inscription sans mot de passe

- émission : `sendOTP(email, "signup")`
- génération : `auth.admin.generateLink({ type: "signup" })`
- livraison : `sendEmail()`
- vérification : `auth.verifyOtp({ type: "email" })`

#### Inscription email + mot de passe

- création du compte auth : `auth.admin.createUser({ email_confirm: false })`
- génération de l'OTP : `auth.admin.generateLink({ type: "signup" })`
- livraison : `sendEmail()`
- vérification : `auth.verifyOtp({ type: "email" })`

Ce point retire le dernier envoi initial de confirmation qui pouvait encore
partir de Supabase pendant le signup mot de passe.

#### Renvoi de confirmation

- émission : `resendVerificationEmail(email)`
- génération : `auth.admin.generateLink({ type: "signup" })`
- livraison : `sendEmail()`

#### Mot de passe oublié

- émission : `sendResetPasswordLink(email)`
- génération : `auth.admin.generateLink({ type: "recovery" })`
- livraison : `sendEmail()`
- vérification : `auth.verifyOtp({ type: "recovery" })`

#### Changement d'email

- émission : `auth.admin.generateLink({ type: "email_change_new" })`
- livraison : `sendEmail()`
- vérification : `auth.verifyOtp({ type: "email_change" })`

## Dépendances Supabase restantes

La migration email ne supprime pas encore Supabase du backend. Les dépendances
restantes doivent être traitées par domaine.

### 1. Identité et OTP

Criticité : haute

Supabase reste responsable de :

- la création et la mise à jour des comptes auth
- la vérification des OTP
- la connexion email/mot de passe
- le rafraîchissement de session
- la déconnexion forcée d'autres sessions
- la récupération d'un utilisateur auth par identifiant

Points de code principaux :

- `apps/webapp/app/modules/auth/service.server.ts`
- `apps/webapp/app/modules/auth/auth-provider.server.ts`
- `apps/webapp/app/modules/auth/auth-error-classifier.server.ts`
- `apps/webapp/app/modules/auth/auth-state.server.ts`
- `apps/webapp/app/modules/auth/supabase-auth-provider.server.ts`
- `apps/webapp/app/modules/api/mobile-auth.server.ts`
- `apps/webapp/app/routes/_auth+/forgot-password.tsx`
- `apps/webapp/app/routes/_auth+/otp.tsx`
- `apps/webapp/app/routes/_layout+/account-details.general.tsx`
- `apps/webapp/app/modules/user/service.server.ts`

Le métier dépend maintenant d'un point d'entrée générique
`auth-provider.server.ts`, branché sur l'implémentation
`supabase-auth-provider.server.ts`, ce qui recentre les appels backend
Supabase Auth avant un futur remplacement du provider d'identité.

Les lectures SQL restantes du schéma `auth` sont maintenant isolées dans
`auth-state.server.ts`, séparées du provider d'identité lui-même.

La classification des erreurs SDK auth est maintenant isolée derrière
`auth-error-classifier.server.ts`, branché sur
`supabase-auth-error-classifier.server.ts`.

La génération d'OTP ne lit plus directement la forme brute des réponses
Supabase dans le service métier : les codes OTP sont maintenant exposés via
des helpers génériques au niveau du provider auth.

Stratégie de retrait :

- conserver ce socle tant que les sessions et la vérification OTP restent
  Supabase
- documenter séparément un futur chantier de remplacement d'identity provider

### 2. Sessions et tokens

Criticité : haute

Supabase reste utilisé pour :

- `refreshSession`
- `verifyAuthSession`
- `validateSession`
- la gestion des refresh tokens

Le code contient encore des accès directs au schéma `auth`, désormais isolés
dans `auth-state.server.ts`, pour certains contrôles de cohérence :

- lecture de `auth.users`
- lecture de `auth.refresh_tokens`

Stratégie de retrait :

- traiter ce sujet après stabilisation Brevo
- isoler d'abord les accès SQL directs au schéma auth

### 3. Gestion du cycle de vie des comptes

Criticité : moyenne à haute

Supabase reste utilisé pour :

- suppression de compte auth
- confirmation forcée d'un compte existant dans certains scénarios d'invitation
- changement de mot de passe

Stratégie de retrait :

- distinguer les besoins publics Core des adaptations ultérieures Enterprise
- extraire ensuite les contrats nécessaires avant toute réécriture profonde

### 4. Base de données et services hors périmètre email

Criticité : haute

La base PostgreSQL, les schémas auth et les autres briques Supabase ne sortent
pas du périmètre de cette migration. Elles doivent être traitées dans un lot de
désengagement backend distinct.

Premier pas d'isolation déjà engagé côté stockage :

- `apps/webapp/app/utils/storage-provider.server.ts` sert désormais d'entrée
  générique côté métier
- `apps/webapp/app/utils/supabase-storage-provider.server.ts` centralise les
  téléchargements d'objets et la génération d'URLs publiques
- `apps/webapp/app/utils/storage-url-resolver.server.ts` expose maintenant
  une résolution d'URL storage générique au-dessus de
  `supabase-storage-url-resolver.server.ts`
- `apps/webapp/app/utils/storage-error-classifier.server.ts` expose maintenant
  une classification d'erreurs storage générique au-dessus de
  `supabase-storage-error-classifier.server.ts`
- `import.image-cache`, `location`, `audit image` et les routes de génération
  de miniatures consomment maintenant cette façade au lieu d'appels directs
  supplémentaires à Supabase Storage
- `asset.service`, `kit.service` et `move-location-images` utilisent aussi
  cette façade pour leurs opérations storage métier les plus directes
- `storage.server.ts` consomme désormais la façade storage, le resolver
  d'URL générique et le classificateur d'erreurs générique, ce qui cantonne
  les appels directs à Supabase aux seules implémentations
  `supabase-auth-provider.server.ts` et
  `supabase-storage-provider.server.ts`

## Séquence de déploiement recommandée

### Core

1. Valider les flux auth et applicatifs avec `EMAIL_PROVIDER="smtp"`.
2. Activer `EMAIL_PROVIDER="brevo"` dans l'environnement Core.
3. Vérifier les parcours suivants :
   login OTP, signup OTP, signup mot de passe, renvoi OTP, reset password,
   invitation, onboarding, changement d'email.
4. Surveiller les tags Brevo et les retries du worker.

### Enterprise

Une fois Core stabilisé :

1. synchroniser les changements génériques vers Enterprise
2. conserver les adaptations privées côté Enterprise hors de Core
3. compléter ensuite la cartographie Enterprise si des flux privés
   supplémentaires utilisent encore Supabase pour l'émission d'emails

La séquence autorisée reste :

`Core -> Enterprise`

## Lecture par phase

- `CORE-BREVO-01` : cadrage global disponible via le plan de phase
- `CORE-BREVO-02` : cartographie des flux et dépendances documentée ici
- `CORE-BREVO-03` : provider Brevo backend en place
- `CORE-BREVO-04` : flux auth principaux émis par le backend applicatif
- `CORE-BREVO-05` : flux applicatifs convergés vers le point d'entrée unique
- `CORE-BREVO-06` : dépendances Supabase restantes documentées et priorisées

## Validation actuelle

Validations ciblées passées :

- `app/emails/brevo-email-provider.server.test.ts`
- `app/emails/email-provider.server.test.ts`
- `app/emails/email.worker.server.test.ts`
- `app/modules/auth/service.server.test.ts`
- `app/routes/_auth+/join.test.ts`
- `app/routes/_auth+/forgot-password.test.ts`

Ces validations couvrent notamment :

- l'envoi Brevo backend
- le point d'entrée backend unique
- le signup mot de passe avec OTP envoyé par l'application
- le reset password émis par le backend applicatif

## Blocages externes constatés

- la création de l'issue GitHub globale `CORE-BREVO` a été tentée depuis le dépôt
  Core, mais a échoué avec `HTTP 401: Requires authentication`
- la validation globale `typecheck` n'a pas encore fourni de preuve exploitable
  dans cet environnement ; les preuves actuelles reposent donc sur des tests
  ciblés et sur l'inspection directe du code

## Hors périmètre immédiat

Ce lot ne couvre pas encore :

- le remplacement complet de Supabase Auth
- la refonte des sessions
- la suppression de tous les accès au schéma `auth`
- la migration des briques non-email vers un autre backend d'identité
