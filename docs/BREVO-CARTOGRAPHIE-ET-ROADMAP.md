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

- `EMAIL_PROVIDER="brevo"` : chemin Core par defaut pour l'envoi backend
- `EMAIL_PROVIDER="smtp"` : rollback explicite vers le provider historique

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
- `apps/webapp/app/modules/auth/auth-error-classifier.server.ts`
- `apps/webapp/app/modules/api/mobile-auth.server.ts`
- `apps/webapp/app/routes/_auth+/forgot-password.tsx`
- `apps/webapp/app/routes/_auth+/otp.tsx`
- `apps/webapp/app/routes/_layout+/account-details.general.tsx`
- `apps/webapp/app/modules/user/service.server.ts`

La classification des erreurs SDK auth est maintenant isolée derrière
`auth-error-classifier.server.ts`, branché sur
`supabase-auth-error-classifier.server.ts`.

Stratégie de retrait :

- conserver uniquement les scripts et runbooks de migration legacy encore
  utiles à l'historique Better Auth
- supprimer le runtime Supabase Auth résiduel dès qu'il n'est plus importé

### 2. Sessions et tokens

Criticité : haute

Supabase n'est plus utilisé sur le chemin runtime principal pour :

- `refreshSession`
- `verifyAuthSession`
- `validateSession`

Stratégie de retrait :

- garder seulement les lectures SQL legacy dans les scripts de migration
- ne plus conserver de helper runtime lisant `auth.users` ou
  `auth.refresh_tokens`

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
  les appels directs à Supabase runtime aux seules implémentations storage
  comme `supabase-storage-provider.server.ts`

## Séquence de déploiement recommandée

### Core

1. Activer `EMAIL_PROVIDER="brevo"` dans l'environnement Core avec
   `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `EMAIL_REPLY_TO` et leurs valeurs
   associees.
2. Verifier les parcours suivants :
   login OTP, signup OTP, signup mot de passe, renvoi OTP, reset password,
   invitation, onboarding, changement d'email.
3. Surveiller les tags Brevo et les retries du worker.
4. Ne garder `EMAIL_PROVIDER="smtp"` que comme rollback volontaire et explicite.

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

## Etat de `CORE-BREVO-06G`

Le lot `06G` est désormais cadré et implémenté sur le périmètre Core suivant :

- callback OAuth / SSO Better Auth côté serveur via `apps/webapp/app/routes/_auth+/oauth.callback.tsx`
- préférence Better Auth pour les domaines SSO configurés, avec fallback legacy contrôlé via `apps/webapp/app/modules/auth/service.server.ts`
- validation bearer mobile via la façade auth partagée dans `apps/webapp/app/modules/api/mobile-auth.server.ts`
- middleware de session web conservant le contrat `context.getSession()` tout en validant et rafraîchissant les sessions Better Auth via `apps/webapp/server/middleware.ts`

### Différences web et mobile documentées

- web : session applicative portée par cookie serveur, lue via le middleware Hono/Remix, puis rafraîchie par `refreshSession()`
- mobile : pas de cookie applicatif ; le client envoie un bearer token validé par `requireMobileAuth()`
- OAuth / SSO web : Better Auth finalise désormais la session côté serveur lorsque le provider Better Auth est configuré ; le callback Supabase historique reste en fallback pendant la coexistence
- fallback legacy : si un bearer token mobile ou un domaine SSO n'est pas encore migré, la façade auth retombe vers Supabase de façon bornée

### Impacts clients identifiés avant bascule finale

- client web : pas de changement de contrat Remix côté routes protégées ; le contrat `context.getSession()` est conservé
- client mobile : le bearer token reste le mécanisme d'appel, mais sa validation passe maintenant d'abord par Better Auth puis par le fallback legacy si nécessaire
- clients SSO : les organisations configurées dans `BETTER_AUTH_SSO_PROVIDERS` empruntent Better Auth ; les autres restent sur le provider Supabase tant que `06H/06I` ne sont pas terminés
- exploitation : la bascule finale nécessitera encore la migration des comptes Supabase existants (`06H`) avant le retrait complet du chemin actif Supabase Auth (`06I`)

## Validation actuelle

Validations ciblées passées :

- `app/emails/brevo-email-provider.server.test.ts`
- `app/emails/email-provider.server.test.ts`
- `app/emails/email.worker.server.test.ts`
- `app/modules/auth/service.server.test.ts`
- `app/modules/auth/service.provider-routing.server.test.ts`
- `app/modules/auth/better-auth-session.server.test.ts`
- `app/routes/_auth+/join.test.ts`
- `app/routes/_auth+/forgot-password.test.ts`
- `app/routes/_auth+/oauth.callback.test.ts`
- `app/modules/api/mobile-auth.server.test.ts`

Ces validations couvrent notamment :

- l'envoi Brevo backend
- le point d'entrée backend unique
- le signup mot de passe avec OTP envoyé par l'application
- le reset password émis par le backend applicatif
- le callback OAuth / SSO Better Auth côté serveur
- la préférence Better Auth avec fallback legacy sur mobile et SSO

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

## Etat de `CORE-BREVO-06H`

Le lot `06H` est maintenant cadre et outille cote Core pour preparer la
migration des comptes Supabase existants vers Better Auth :

- support des hash Supabase `bcrypt` importes via
  `apps/webapp/app/modules/auth/legacy-password-hash.server.ts`
- branchement de cette verification dans `better-auth.server.ts` afin de
  preserver les connexions email/mot de passe apres import
- script d'audit de migration `apps/webapp/scripts/audit-supabase-auth-migration.ts`
- script d'execution controlee `apps/webapp/scripts/migrate-supabase-auth-to-better-auth.ts`
- runbook dedie `docs/BETTER-AUTH-SUPABASE-MIGRATION.md`

### Decisions operationnelles

- `auth.users.id` reste l'identifiant cible pour `BetterAuthUser.id`
- les comptes mot de passe migres creent un `BetterAuthAccount` avec
  `providerId = "credential"`
- les nouveaux mots de passe et resets restent hashes nativement par Better
  Auth ; seuls les hash herites Supabase gardent une compatibilite legacy
- les sessions actives Supabase ne sont pas migrees dans `BetterAuthSession`

### Contraintes documentees avant `06I`

- un compte ne peut pas etre migre automatiquement si le `User` metier n'existe
  pas deja avec le meme `id`
- les collisions d'email entre `auth.users`, `User` et `BetterAuthUser`
  doivent etre resolues avant execution finale
- les identites OAuth/SSO importees doivent rester alignees avec les
  `providerId` reellement configures dans Better Auth
- la bascule finale exigera une reconnexion controlee, car les refresh tokens
  Supabase restent legacy

### Validation attendue

- audit staging via `auth:audit:supabase-migration`
- backup PostgreSQL avant `--apply`
- migration staging d'un lot reel de comptes
- smoke tests login, reset password, OTP, changement d'email et OAuth/SSO
  avant lancement de `CORE-BREVO-06I`

## Etat de `CORE-BREVO-06I`

Le lot `06I` est maintenant implemente sur le chemin actif Core :

- `apps/webapp/app/modules/auth/service.server.ts` route desormais les
  parcours login, OTP, reset password, changement d'email, session refresh,
  verification de session et bearer mobile vers Better Auth
- `apps/webapp/app/modules/user/service.server.ts` cree et rattache les
  identites invitees via Better Auth au lieu de Supabase Auth
- `apps/webapp/app/routes/_auth+/oauth.callback.tsx` ne depend plus du
  listener client Supabase pour finaliser le callback SSO principal
- `.env.example` et `apps/docs/supabase-setup.md` documentent Better Auth
  comme cible auth active, Supabase restant positionne sur PostgreSQL et
  Storage

### Resultat de cadrage

- Supabase Auth n'est plus le provider actif sur le chemin principal Core
- les dependances legacy Supabase encore presentes sont residuelles,
  documentaires ou de compatibilite hors chemin principal
- le prochain lot logique devient `CORE-BREVO-06J` pour inventorier et
  reprioriser le reliquat Supabase hors auth

### Validation actuelle

Validations ciblees passees :

- `pnpm --filter @shelf/webapp exec tsc --noEmit --pretty false`
- `pnpm --filter @shelf/webapp exec vitest run app/modules/auth/service.provider-routing.server.test.ts app/modules/auth/service.server.test.ts app/modules/user/service.server.test.ts app/routes/_auth+/oauth.callback.test.ts`

## Etat de `CORE-BREVO-06J`

Le lot `06J` est maintenant cadre pour la suite apres la bascule Better Auth,
avec un reliquat Supabase limite aux domaines hors chemin auth principal.

### Reliquat Supabase restant par domaine

#### 1. Storage applicatif

Criticite : haute

Dependances encore actives :

- `apps/webapp/app/utils/supabase-storage-provider.server.ts`
- `apps/webapp/app/utils/supabase-storage-url-resolver.server.ts`
- `apps/webapp/app/utils/supabase-storage-error-classifier.server.ts`
- `apps/webapp/app/integrations/supabase/client.ts`

Couche d'abstraction deja en place :

- `apps/webapp/app/utils/storage-provider.server.ts`
- `apps/webapp/app/utils/storage-url-resolver.server.ts`
- `apps/webapp/app/utils/storage-error-classifier.server.ts`

Conclusion :

- le prochain lot technique prioritaire apres Better Auth est la sortie ou
  l'abstraction finale de Supabase Storage
- le metier consomme deja une facade generique, ce qui borne le chantier
  suivant aux implementations storage et a leurs derniers appelants directs

#### 2. SQL legacy du schema `auth`

Criticite : moyenne a haute

Dependances encore actives :

- scripts de migration Better Auth lisant `auth.users` :
  `apps/webapp/scripts/better-auth-migration/*`

Conclusion :

- ces acces ne pilotent plus le chemin auth principal et ne vivent plus dans
  le runtime webapp
- ils restent utiles uniquement pour les operations de migration controlee et
  pourront etre retires apres validation complete du runbook

#### 3. Outils et diagnostics d'administration

Criticite : basse a moyenne

Dependances encore actives :

- `apps/webapp/app/routes/_layout+/admin-dashboard+/test-supabase-rls.tsx`

Conclusion :

- ce reliquat n'est pas bloquant pour la sortie de Supabase Auth
- il devra etre soit adapte au backend cible, soit retire si le besoin
  d'observabilite change avec la future architecture

### Prochain lot clairement priorise

Ordre recommande apres `06J` :

1. stabiliser la documentation et le runbook Better Auth en staging
2. traiter le reliquat storage Supabase comme prochain chantier technique
3. reevaluer ensuite les acces SQL legacy `auth.*` qui ne servent plus qu'a la
   migration et au diagnostic

### Sequence Core -> Enterprise

- Core reste la source des abstractions generiques Better Auth et Storage
- Enterprise devra seulement consommer ou etendre ces contrats sans
  reintroduire de dependance directe a Supabase Auth
- toute adaptation privee de SSO, RBAC avance ou workflow metier doit rester
  synchronisee apres stabilisation du socle Core

### Validation de cloture

- audit de code par recherche `supabase` sur `apps/webapp/app`,
  `apps/webapp/scripts`, `packages/database` et `docs`
- verification que `CORE-BREVO-06I` reste `Done` et que `06J` devient le point
  de sortie documentaire du reliquat
- nettoyage du code mort sur le callback OAuth et les helpers de test Better Auth
