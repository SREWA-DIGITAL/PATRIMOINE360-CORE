# Plan opérationnel - Phases 8 et 9

Date de création : 2026-06-23
Dépôt cible : `SREWA-DIGITAL/patrimoine360-core`
Document parent : [PLAN-ALIGNEMENT-PRD.md](./PLAN-ALIGNEMENT-PRD.md)
Statut global : À faire

## Objet

Ce document détaille l'exécution des phases 8 et 9 du plan d'alignement PRD.
Il sert de plan opérationnel pour terminer l'alignement du Core Patrimoine360,
stabiliser la frontière Core / Enterprise et préparer la livraison séparée de
Core et Enterprise.

## Règles de cadrage

- Le dépôt `patrimoine360-core` reste limité au socle public AGPL.
- Toute extension propriétaire reste documentée ici comme contrat, mais son
  implémentation métier finale doit vivre dans `patrimoine360-enterprise`.
- Une sous-phase n'est marquée `Terminée` que si ses validations et ses
  garde-fous sont couverts.
- Les migrations, routes, services et tests doivent rester séparables entre
  Core et Enterprise.

## Phase 8 - Fermeture des écarts Core et socle Enterprise

### Finalité

Finir proprement l'alignement du Core par rapport au PRD, supprimer les
dépendances Auth héritées de Supabase et préparer une base exploitable par le
dépôt Enterprise sans fuite de logique privée dans Core.

### Phase 8A - Stabilisation Better Auth

Statut : Terminée

Périmètre :

- finaliser `join`, `login`, `logout`, vérification email, reset password et
  changement d'email ;
- couvrir les callbacks, sessions serveur et cas de compatibilité legacy ;
- vérifier la façade auth partagée pour le webapp et les usages API/mobile ;
- fermer les derniers écarts de migration depuis Supabase Auth.

Hors périmètre :

- ajout de nouveaux modules métier Enterprise ;
- refonte UI complète hors auth.

Livrables attendus :

- parcours auth fonctionnels en local ;
- tests ciblés Better Auth ;
- documentation auth mise à jour.

Critères d'acceptation :

- plus aucun flux principal d'authentification ne dépend de Supabase Auth ;
- les erreurs auth sont compréhensibles et tracées ;
- les tests ciblés passent.

Avancement 2026-06-23 :

- ajout des tests de routes manquants sur `logout`, `send-otp`, `resend-otp`
  et `otp` ;
- validation ciblée du lot auth actif :
  `better-auth-session`, `service.server`, `service.provider-routing`,
  `mobile-auth` et routes `_auth+` ;
- suppression d'un `@ts-expect-error` fragile dans `resend-otp.tsx`.
- suppression du dernier point d'entrée public OTP d'inscription sur `join`,
  avec recentrage du flux OTP sur la connexion ;
- durcissement de `send-otp` pour normaliser le mode `login` et éviter les
  redirections incohérentes ;
- validation ciblée complémentaire sur `better-auth.server`,
  `better-auth-user-sync` et `account-details.general`.
- suppression dans `service.server` des helpers auth Supabase devenus morts
  (`signUpWithEmailPass`, `resendVerificationEmail`, `verifyRecoveryOtp` et
  anciens helpers de création/confirmation) ;
- simplification du service OTP pour un envoi `login` Better Auth uniquement,
  avec retrait des tests legacy correspondants ;
- validation ciblée complémentaire sur `service.server`,
  `service.provider-routing`, `forgot-password` et `account-details.general`.
- découplage du code actif de la façade `auth-provider.server`, qui ne sert
  plus aux flux Better Auth principaux ;
- confirmation que les reliquats `auth-provider` / `supabase-auth-provider`
  restants sont désormais isolés et relèvent du retrait structurel de la
  phase `8C`, plus de la stabilisation fonctionnelle `8A`.

### Phase 8B - Finalisation Brevo

Statut : Terminée

Périmètre :

- fiabiliser l'envoi transactionnel via Brevo ;
- stabiliser les variables d'environnement, sender et reply-to ;
- vérifier les emails de signup, vérification, reset password et invitation ;
- confirmer la stratégie de queue/retry et de journalisation.

Hors périmètre :

- templates marketing ;
- canaux non email.

Livrables attendus :

- configuration `.env.example` alignée ;
- flux email auth validés ;
- documentation de configuration Brevo.

Critères d'acceptation :

- tous les emails auth partent via Brevo ;
- les erreurs SMTP historiques ne peuvent plus se produire en mode Brevo ;
- les chemins d'erreur sont couverts.

Avancement 2026-06-23 :

- bascule de la configuration de référence Core sur `EMAIL_PROVIDER="brevo"`
  dans [.env.example](/C:/dev/patrimoine-360/patrimoine360-core/.env.example)
  et dans
  [apps/docs/supabase-setup.md](/C:/dev/patrimoine-360/patrimoine360-core/apps/docs/supabase-setup.md) ;
- ajout des variables explicites `EMAIL_REPLY_TO` et
  `EMAIL_REPLY_TO_NAME` pour découpler le `reply-to` du fallback SMTP ;
- suppression du fallback Brevo vers `SMTP_FROM`, avec sender Brevo désormais
  résolu via `BREVO_SENDER_EMAIL` puis `SUPPORT_EMAIL` ;
- ajout de validations ciblées sur :
  `email-provider.server`, `brevo-email-provider.server`,
  `email.worker.server` et `mail.server` pour couvrir le sender par défaut,
  le `reply-to`, l'erreur provider et la mise en queue sur échec.

### Phase 8C - Retrait Supabase Auth

Statut : Terminée

Périmètre :

- supprimer les helpers, providers, callbacks et docs encore dépendants de
  Supabase Auth ;
- conserver seulement PostgreSQL et storage Supabase si encore nécessaires ;
- expliciter la dépendance restante éventuelle dans la documentation.

Hors périmètre :

- retrait immédiat du storage Supabase si une alternative n'est pas prête.

Livrables attendus :

- code auth legacy supprimé ou isolé ;
- cartographie des dépendances Supabase résiduelles ;
- documentation de migration mise à jour.

Critères d'acceptation :

- Supabase n'est plus utilisé comme fournisseur d'identité ;
- le Core sait démarrer sans dépendance fonctionnelle à Supabase Auth.

Avancement 2026-06-23 :

- suppression des reliquats runtime
  `auth-provider.server`, `supabase-auth-provider.server` et
  `auth-state.server`, devenus orphelins après la bascule Better Auth ;
- suppression du test associé `auth-state.server.test.ts`, qui ne couvrait plus
  qu'un accès SQL legacy au schéma `auth` ;
- conservation des seuls accès `auth.users` / `auth.refresh_tokens` dans les
  scripts de migration Better Auth, hors chemin principal webapp ;
- mise à jour de
  [apps/docs/supabase-setup.md](/C:/dev/patrimoine-360/patrimoine360-core/apps/docs/supabase-setup.md),
  [docs/BREVO-CARTOGRAPHIE-ET-ROADMAP.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/BREVO-CARTOGRAPHIE-ET-ROADMAP.md),
  [docs/BETTER-AUTH-SUPABASE-MIGRATION.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/BETTER-AUTH-SUPABASE-MIGRATION.md)
  et
  [docs/PLAN-ALIGNEMENT-PRD.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/PLAN-ALIGNEMENT-PRD.md)
  pour distinguer clairement le runtime Core du reliquat migration.

### Phase 8D - Vocabulaire métier Patrimoine360

Statut : Terminée

Périmètre :

- aligner les labels et contenus visibles sur la terminologie PRD ;
- recadrer `asset`, `location`, `custody`, `team member` vers le langage
  Patrimoine360 ;
- vérifier la navigation, les titres de pages, les aides et les états vides.

Hors périmètre :

- renommage physique massif des routes, modèles Prisma ou packages internes.

Livrables attendus :

- inventaire des labels critiques ;
- navigation et écrans principaux cohérents métier ;
- liste des écarts visibles restants.

Critères d'acceptation :

- un utilisateur métier ne voit plus de terminologie Shelf dans les parcours
  Core principaux ;
- le vocabulaire Core est cohérent entre navigation, listes et détails.

Avancement 2026-06-24 :

- recadrage du parcours d'onboarding avec vocabulaire Patrimoine360 sur les
  titres, labels, messages de validation, email de bienvenue et appel à
  l'action final ;
- recadrage des écrans d'organisation sur les sections `Général`,
  `Permissions`, `Paramètres SSO`, invitation d'utilisateur et suppression d'un
  responsable ;
- alignement des écrans de réservation et d'actions de masse pour privilégier
  `bien`, `lot`, `affectation`, `responsable` et `organisation` à la place des
  formulations Shelf historiques ;
- fermeture du reliquat principal sur l'accueil, les écrans équipe /
  responsables, les états vides, les badges d'affectation et les libellés de
  rapports visibles ;
- le vocabulaire utilisateur visible est désormais cohérent sur les parcours
  Core principaux, les noms techniques internes `asset`, `location` et
  `custody` restant volontairement inchangés hors interface.

### Phase 8E - Hiérarchie métier Patrimoine360

Statut : Terminée

Périmètre :

- aligner les concepts organisation, région, direction, site et local avec le
  PRD ;
- définir la stratégie Core pour CNPS et NSIA ;
- vérifier les filtres, descendants, rattachements et vues hiérarchiques.

Hors périmètre :

- ajout des modèles Enterprise `Contrat`, `FicheVisite`, `Travaux`.

Livrables attendus :

- décision documentée sur la hiérarchie cible ;
- ajustements de services et écrans Core nécessaires ;
- plan de migration de données si requis.

Critères d'acceptation :

- la hiérarchie métier Core est claire, stable et documentée ;
- les écrans principaux supportent la hiérarchie choisie.

Avancement 2026-06-24 :

- formalisation de la décision métier dans
  [HIERARCHIE-METIER-PATRIMOINE360.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/HIERARCHIE-METIER-PATRIMOINE360.md) ;
- décision retenue pour le Core :
  `Organization` reste la racine de segmentation, `Location` porte
  l'arborescence métier visible ;
- cadrage CNPS :
  une organisation Core peut représenter `CNPS Côte d'Ivoire`, avec
  `Siège social`, `Direction`, `Site`, `Bâtiment`, `Étage`, `Salle`
  dans l'arbre des locations ;
- cadrage NSIA :
  une organisation Core représente une entité pays, la consolidation
  `Groupe -> Pays` restant hors Core et réservée à l'Enterprise ;
- vérification du socle technique existant :
  relation récursive `Location.parentId`, services d'ancêtres et de
  descendants, breadcrumbs et profondeur maximale `12`, suffisante pour la
  cible PRD ;
- ajout du module
  [hierarchy-profiles.ts](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/app/modules/location/hierarchy-profiles.ts)
  pour figer les profils hiérarchiques Core réutilisables côté application ;
- conclusion :
  aucune migration Prisma n'est requise à ce stade pour supporter la
  hiérarchie métier Core.

### Phase 8F - Permissions et rôles Patrimoine360

Statut : Terminée

Périmètre :

- aligner les permissions sur les rôles PRD ;
- vérifier les loaders, actions, services et API sensibles ;
- formaliser les cas `SUPER_ADMIN`, `ADMIN`, `PILOTE_GRM`,
  `EVALUATEUR_CIPM`, `RESPONSABLE_SITE`, `LECTEUR`.

Hors périmètre :

- RBAC géographique avancé Enterprise complet.

Livrables attendus :

- matrice de permissions Core validée ;
- ajustements de garde-fous ;
- tests ciblés sur les points sensibles.

Critères d'acceptation :

- les permissions Core sont explicites et cohérentes avec le PRD ;
- aucun rôle Core n'accède à un flux interdit par erreur.

Avancement 2026-06-24 :

- formalisation de la matrice Core dans
  [RBAC-PATRIMOINE360-CORE.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/RBAC-PATRIMOINE360-CORE.md) ;
- vérification du RBAC réel du Core :
  `Roles.ADMIN` côté plateforme, puis `OrganizationRoles.OWNER`, `ADMIN`,
  `BASE`, `SELF_SERVICE` côté organisation ;
- décision retenue :
  `SUPER_ADMIN` est couvert par `Roles.ADMIN`, `ADMIN` est couvert par
  `OWNER` / `ADMIN`, tandis que `PILOTE_GRM`, `EVALUATEUR_CIPM` et le vrai
  `RESPONSABLE_SITE` à périmètre géographique restent hors Core finalisé ;
- cadrage honnête des projections partielles :
  `SELF_SERVICE` peut servir d'approximation opérationnelle de
  `RESPONSABLE_SITE`, `BASE` d'approximation partielle de `LECTEUR`, sans les
  renommer officiellement tant que la matrice PRD n'est pas complètement
  satisfaite ;
- ajout du helper
  [patrimoine360-core-rbac.ts](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/app/utils/patrimoine360-core-rbac.ts)
  et de son test
  [patrimoine360-core-rbac.test.ts](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/app/utils/patrimoine360-core-rbac.test.ts)
  pour figer la projection Core -> PRD dans le code ;
- conclusion :
  le Core dispose d'un RBAC fonctionnel, mais les rôles PRD avancés
  dépendants de l'accès géographique restent réservés à l'Enterprise.

### Phase 8G - Fermeture des écarts de flux Core

Statut : Terminée

Périmètre :

- compléter les flux existants qui ne collent pas encore au PRD ;
- revoir rappels, rapports simples, responsables, affectations et dashboard
  basique ;
- identifier ce qui relève réellement du Core et ce qui doit partir en
  Enterprise.

Hors périmètre :

- analytics premium, contrats, fiches de visite et travaux.

Livrables attendus :

- backlog court des écarts Core restants ;
- corrections fonctionnelles ciblées ;
- validations manuelles documentées.

Critères d'acceptation :

- les parcours Core décrits par le PRD sont couverts sans module Enterprise ;
- les écarts restants sont explicitement assumés et documentés.

Avancement 2026-06-24 :

- ajout d'un vrai point d'entrée Core `Responsables et affectations` sur
  `/custody`, pour fermer l'écart entre le PRD et la navigation réelle ;
- exposition côté Core des responsables actifs, affectations récentes,
  couverture simple des sites / locaux concernés et lien direct vers le rapport
  `Affectations en cours` ;
- recadrage des libellés visibles sur le dashboard des responsables, les
  rappels à venir et le rapport `custody-snapshot` pour rester cohérent avec le
  vocabulaire Patrimoine360 ;
- formalisation des écarts restants dans
  [ECARTS-FLUX-CORE-PATRIMOINE360.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/ECARTS-FLUX-CORE-PATRIMOINE360.md) :
  rappels encore limités aux biens, absence d'historique métier enrichi des
  affectations et réservation du dashboard analytique avancé à l'Enterprise ;
- simplification finale des surfaces visibles :
  la page `/custody`, le rapport `Affectations en cours` et les états vides
  associés portent désormais une présentation opérationnelle, sans copy
  interne de cadrage projet ;
- clôture du lot :
  la vue opérationnelle Core existe, les parcours principaux sont couverts et
  les extensions PRD plus riches restent documentées dans les écarts assumés.

### Phase 8H - Storage et infrastructure Core

Statut : Terminée

Périmètre :

- décider la trajectoire storage Core : Supabase Storage temporaire ou bascule
  future vers MinIO ;
- aligner `.env.example`, onboarding local et documentation ;
- préparer le cadrage Docker Community.

Hors périmètre :

- migration complète on-prem Enterprise.

Livrables attendus :

- décision d'architecture storage documentée ;
- variables d'environnement clarifiées ;
- checklist d'installation locale mise à jour.

Critères d'acceptation :

- la stack Core de dev est compréhensible et reproductible ;
- la dépendance storage restante est assumée et documentée.

Avancement 2026-06-24 :

- décision formalisée dans
  [STORAGE-INFRA-CORE.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/STORAGE-INFRA-CORE.md) :
  le Core supporté aujourd'hui reste `Better Auth + Brevo + PostgreSQL Supabase + Supabase Storage` ;
- confirmation explicite qu'il n'existe pas encore de provider MinIO actif dans
  le runtime Core ni de stack Community `app + postgres + minio` prête à
  l'emploi ;
- alignement de [.env.example](/C:/dev/patrimoine-360/patrimoine360-core/.env.example)
  pour cadrer honnêtement les variables encore nécessaires tant que Storage
  reste sur Supabase ;
- mise à jour de
  [apps/docs/supabase-setup.md](/C:/dev/patrimoine-360/patrimoine360-core/apps/docs/supabase-setup.md),
  [apps/docs/docker.md](/C:/dev/patrimoine-360/patrimoine360-core/apps/docs/docker.md)
  et
  [apps/docs/local-development.md](/C:/dev/patrimoine-360/patrimoine360-core/apps/docs/local-development.md)
  pour refléter la pile Core réellement supportée et préparer la phase 9D ;
- frontière clarifiée :
  la documentation 8H prépare Docker Community, mais la création du dossier
  racine `docker/` et du `docker-compose.yml` reste bien dans la phase 9D.

## Phase 9 - DevOps, qualité et livraison séparée

### Finalité

Rendre le Core publiable proprement, industrialiser les validations minimales et
préparer un chemin de livraison distinct pour Enterprise.

### Phase 9A - CI et quality gates Core

Statut : Terminée

Périmètre :

- standardiser lint, typecheck, tests ciblés et build ;
- garantir des commandes de validation stables ;
- clarifier la version Node et les prérequis locaux/CI.

Livrables attendus :

- scripts de validation documentés ;
- workflow CI Core lisible ;
- baseline de tests exécutable.

Critères d'acceptation :

- un contributeur peut lancer les contrôles minimums sans ambiguïté ;
- la CI Core échoue sur régression réelle, pas sur ambiguïté de setup.

Avancement 2026-07-09 :

- ajout des scripts racine `core:validate:min`, `core:build` et
  `core:validate:ci` dans
  [package.json](/C:/dev/patrimoine-360/patrimoine360-core/package.json) ;
- alignement explicite de la version Node de référence via
  [.nvmrc](/C:/dev/patrimoine-360/patrimoine360-core/.nvmrc),
  [.node-version](/C:/dev/patrimoine-360/patrimoine360-core/.node-version) et
  `actions/setup-node` ;
- refonte du workflow
  [.github/workflows/test.yml](/C:/dev/patrimoine-360/patrimoine360-core/.github/workflows/test.yml)
  pour lancer un PostgreSQL CI local, appliquer les migrations Core puis
  exécuter les quality gates et le build ;
- formalisation du runbook 9A dans
  [CI-QUALITY-GATES-CORE.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/CI-QUALITY-GATES-CORE.md).

### Phase 9B - Prisma, migrations, seed et données de base

Statut : Terminée

Périmètre :

- stabiliser les conventions de migration Core ;
- clarifier `DATABASE_URL`, `DIRECT_URL`, seed et génération Prisma ;
- préparer les conventions de coexistence Core -> Enterprise.

Livrables attendus :

- procédure de migration documentée ;
- seed minimal Core ;
- règles de nommage et d'isolation des migrations.

Critères d'acceptation :

- les migrations Core s'exécutent seules ;
- les règles d'extension Enterprise sont explicites.

Avancement 2026-07-09 :

- ajout d'un vrai seed Prisma Core idempotent dans
  [packages/database/src/seed-core.ts](/C:/dev/patrimoine-360/patrimoine360-core/packages/database/src/seed-core.ts) ;
- exposition des commandes `db:seed:core` et `db:seed:core:staging` dans
  [packages/database/package.json](/C:/dev/patrimoine-360/patrimoine360-core/packages/database/package.json)
  et dans le
  [package.json](/C:/dev/patrimoine-360/patrimoine360-core/package.json) racine ;
- formalisation des conventions `DATABASE_URL`, `DIRECT_URL`, migrations et
  sens Core -> Enterprise dans
  [PRISMA-MIGRATIONS-ET-SEED-CORE.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/PRISMA-MIGRATIONS-ET-SEED-CORE.md).

### Phase 9C - Tests d'intégration et E2E prioritaires

Statut : Terminée

Périmètre :

- définir les scénarios critiques à automatiser ;
- couvrir auth, onboarding, écrans Core critiques et permissions ;
- identifier les trous de couverture bloquants.

Livrables attendus :

- liste des tests prioritaires ;
- premiers scénarios d'intégration/E2E stabilisés ;
- politique de non-régression minimale.

Critères d'acceptation :

- les flux Core critiques ont au moins un filet de sécurité automatisé ;
- les régressions majeures sont détectables avant livraison.

Avancement 2026-07-09 :

- conservation du smoke E2E Core existant comme premier filet prioritaire dans
  [apps/webapp/test/e2e/smoke.spec.ts](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/test/e2e/smoke.spec.ts) ;
- ajout du script dédié `webapp:test:e2e:smoke` côté racine et
  [apps/webapp/package.json](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/package.json) ;
- stabilisation de la configuration Playwright pour la CI et l'override local
  via
  [apps/webapp/playwright.config.ts](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/playwright.config.ts) ;
- documentation des scénarios prioritaires et de la politique minimale de
  non-régression dans
  [TESTS-INTEGRATION-E2E-CORE.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/TESTS-INTEGRATION-E2E-CORE.md).

### Phase 9D - Docker Community et exploitation locale

Statut : Terminée

Périmètre :

- produire ou stabiliser `docker/docker-compose.yml` Community ;
- documenter PostgreSQL, storage et variables nécessaires ;
- valider le démarrage de la webapp avec sa base locale.

Livrables attendus :

- stack Docker Community documentée ;
- procédure de démarrage locale ;
- variables d'environnement de référence.

Critères d'acceptation :

- un environnement Community peut être lancé sans dépendre d'informations
  implicites ;
- les services requis au Core sont identifiés.

Avancement 2026-07-09 :

- création d'une stack Community locale
  [docker/docker-compose.yml](/C:/dev/patrimoine-360/patrimoine360-core/docker/docker-compose.yml)
  avec PostgreSQL local et build de l'image webapp ;
- ajout du contrat d'environnement
  [docker/core.env.example](/C:/dev/patrimoine-360/patrimoine360-core/docker/core.env.example) ;
- mise à jour de
  [apps/docs/docker.md](/C:/dev/patrimoine-360/patrimoine360-core/apps/docs/docker.md)
  pour décrire honnêtement la limite actuelle :
  PostgreSQL local oui, storage Supabase toujours explicite ;
- mise à jour de
  [apps/docs/local-development.md](/C:/dev/patrimoine-360/patrimoine360-core/apps/docs/local-development.md)
  pour exposer les nouvelles commandes de validation, seed et smoke E2E.

### Phase 9E - Release Core et synchronisation vers Enterprise

Statut : Terminée

Périmètre :

- formaliser la procédure de release Core ;
- documenter la synchronisation autorisée Core -> Enterprise ;
- fixer les garde-fous Git, docs et migrations.

Livrables attendus :

- procédure de release Core ;
- checklist de synchronisation vers Enterprise ;
- rappel des règles de frontière.

Critères d'acceptation :

- le chemin de livraison Core est documenté ;
- la propagation vers Enterprise est séparée, volontaire et tracée.

Avancement 2026-07-09 :

- formalisation du runbook de release et de synchronisation dans
  [RELEASE-CORE-ET-SYNCHRO-ENTERPRISE.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/RELEASE-CORE-ET-SYNCHRO-ENTERPRISE.md) ;
- articulation explicite avec le flux GHCR / Dockploy déjà documenté dans
  [DEPLOIEMENT-STAGING-DOCKPLOY.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/DEPLOIEMENT-STAGING-DOCKPLOY.md) ;
- rappel des garde-fous Core -> Enterprise :
  propagation volontaire, filtrée, traçable, sans retour massif Enterprise
  vers Core.

### Phase 9F - Préparation du lot Enterprise privé

Statut : À faire

Périmètre :

- transformer le socle Enterprise en backlog exécutable par domaine ;
- ordonner `SSO`, `licence`, `contrats`, `fiches de visite`, `travaux`,
  `dashboard avancé`, `Excel CNPS`, `WhatsApp` ;
- préparer les conventions de lot, sans implémenter ici les modules privés.

Livrables attendus :

- ordre d'implémentation Enterprise ;
- périmètre et dépendances par module ;
- point de passage entre Core et Enterprise.
  u
  Critères d'acceptation :

- le dépôt Enterprise peut consommer un plan clair sans ambiguïté sur la
  frontière produit ;
- les modules privés sont séquencés et priorisés.

## Ordre recommandé d'exécution

1. Phase 8A
2. Phase 8B
3. Phase 8C
4. Phase 8D
5. Phase 8E
6. Phase 8F
7. Phase 8G
8. Phase 8H
9. Phase 9A
10. Phase 9B
11. Phase 9C
12. Phase 9D
13. Phase 9E
14. Phase 9F

## Définition de fin

Les phases 8 et 9 sont considérées terminées lorsque :

- le Core fonctionne sans Supabase Auth ;
- les emails auth passent par Brevo ;
- les parcours Core principaux sont alignés sur le vocabulaire métier ;
- les permissions Core sont recadrées ;
- la frontière Core / Enterprise est exécutable et documentée ;
- les validations minimales, migrations et procédures de release sont
  reproductibles ;
- le dépôt Enterprise peut reprendre un backlog clair sans dépendance implicite
  au dépôt Core.
