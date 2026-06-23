# Plan d'alignement PRD - Patrimoine360 Core

Date de création : 2026-06-11
Branche cible : `structuration`
Dépôt cible : `SREWA-DIGITAL/patrimoine360-core`
Statut global : En cours

## Règle de mise à jour

Ce document sert de référence opérationnelle pour aligner le projet avec le PRD Patrimoine360 Core. Chaque phase doit être mise à jour après exécution avec :

- son statut courant ;
- les décisions prises ;
- les livrables produits ;
- les commandes de validation exécutées ;
- les risques ou blocages restants.

## Légende des statuts

- À faire : phase non démarrée.
- En cours : phase démarrée, livrables incomplets.
- Terminé : objectifs et critères d'acceptation couverts.
- Bloqué : action impossible sans décision ou information externe.
- Reporté : phase volontairement différée.

## État des lieux vérifié

Vérification effectuée le 2026-06-11.

- Workspace local : `C:\dev\patrimoine360-core`.
- Remote principal : `origin` pointe vers `https://github.com/SREWA-DIGITAL/patrimoine360-core.git`.
- Remote amont : `upstream` pointe vers `https://github.com/Shelf-nu/shelf.nu.git`.
- Branche de départ : `main`.
- Branche de structuration créée : `structuration`.
- Stack observée : monorepo pnpm + Turborepo, Remix / React Router v7, React, TypeScript, Prisma et PostgreSQL.
- Applications présentes : `apps/webapp`, `apps/docs`, `apps/companion`.
- Packages présents : `packages/database`, `tooling/typescript`.
- État sensible vérifié : `.gitignore` exclut les fichiers `.env`, variantes locales d'environnement, caches, sorties de build, rapports de tests et fichiers de configuration sensibles connus.

## Périmètres

### Core public

Le Core public doit rester le socle AGPL de Patrimoine360. Il contient uniquement les modules génériques nécessaires à la gestion du patrimoine : organisations, sites, biens, responsables, affectations, rappels, rapports simples, configuration de base, documentation et scripts communautaires.

### Enterprise privé

Enterprise doit rester séparé du dépôt Core. Les modules avancés, intégrations propriétaires et fonctions commercialement sensibles doivent être développés dans un dépôt privé ou derrière des garde-fous explicites : contrats, prestataires, fiches de visite, travaux avancés, imports métier spécifiques, RBAC géographique avancé, SSO, WhatsApp, tableaux de bord premium et licence Enterprise.

### Hors périmètre immédiat

Cette phase ne modifie pas le code applicatif, le schéma Prisma, les routes, l'authentification, les migrations ou le branding visuel. Elle sécurise le dépôt, crée le cadre de suivi et documente les frontières à respecter avant les phases fonctionnelles.

## Règles Core / Enterprise

- Aucun module Enterprise ne doit être ajouté au Core public sans décision explicite.
- Toute fonctionnalité partageable doit être conçue Core-first, puis étendue côté Enterprise si nécessaire.
- Les variables comme `LICENSE_TYPE`, les flags Enterprise et les clés privées ne doivent jamais exposer de secret dans le dépôt.
- Les modèles Prisma Core et Enterprise doivent rester lisibles et séparables.
- Les scripts Core doivent fonctionner sans dépendance à une licence Enterprise.
- Les imports, exports et intégrations propriétaires doivent être isolés derrière des flags ou packages privés.
- Les migrations Core doivent rester compatibles avec une installation communautaire PostgreSQL.
- Les changements de marque doivent remplacer les libellés shelf.nu sans supprimer l'attribution ou les obligations de licence applicables.

## Plan par phases

### Phase 0 - Sécurisation du dépôt

Statut : Terminé

Objectifs :

- Confirmer que le dépôt courant est bien `patrimoine360-core`.
- Créer la branche `structuration`.
- Vérifier l'état Git avant modification.
- Confirmer que les fichiers sensibles sont protégés par `.gitignore`.
- Poser les règles Core public / Enterprise privé.

Livrables :

- Branche `structuration` créée depuis `main`.
- Document `docs/PLAN-ALIGNEMENT-PRD.md`.
- État des lieux Git et monorepo documenté.
- Règles Core / Enterprise documentées.

Commandes de validation exécutées :

- `git config --global --add safe.directory C:/dev/patrimoine360-core`
- `git status --short --branch`
- `git remote -v`
- `git branch --show-current`
- `git checkout -b structuration`

Critères d'acceptation :

- Le remote `origin` pointe vers `SREWA-DIGITAL/patrimoine360-core`.
- La branche courante est `structuration`.
- Aucun fichier sensible n'est ajouté.
- La phase 0 ne contient aucune modification fonctionnelle du code.
- La frontière Core / Enterprise est explicite.

Risques et points d'attention :

- Git signale une permission refusée sur `C:\Users\Tutu/.config/git/ignore` lors de certaines commandes. Ce point n'a pas bloqué la phase 0 mais peut être corrigé côté environnement local.
- Le dépôt conserve encore de nombreux éléments issus de shelf.nu ; leur traitement appartient aux phases suivantes.

### Phase 1 - Recalage avec la base shelf.nu

Statut : Terminé

Objectif : comparer l'architecture PRD attendue avec l'état actuel du monorepo, puis choisir la trajectoire : repartir proprement de shelf.nu ou adapter progressivement l'existant.

Sources vérifiées :

- `C:\Users\Tutu\Downloads\PATRIMOINE360_PRD.md`, version 1.0.
- `AGENTS.md`.
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`.
- Manifestes de `apps/webapp`, `apps/docs`, `apps/companion`, `packages/database`.
- Documentation locale : `apps/docs/local-development.md`, `apps/docs/docker.md`, `apps/docs/license.md`.
- Structure réelle de `apps/webapp/app`, `apps/webapp/app/routes`, `apps/webapp/app/modules`, `apps/webapp/app/config`, `apps/webapp/app/integrations`.
- Schéma et migrations Prisma dans `packages/database/prisma`.

Cartographie du dépôt actuel :

| Zone             | État constaté                                                                                                     | Lecture phase 1                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Racine           | `package.json` nommé `shelf`, scripts pnpm + Turbo, `pnpm-workspace.yaml` sur `apps/*`, `packages/*`, `tooling/*` | Base Shelf.nu conservée, cohérente avec le monorepo cible               |
| Webapp           | `apps/webapp` / `@shelf/webapp`, React Router `7.14.0`, React `19.2.1`, Vite, Vitest, Playwright                  | Application principale déjà au bon emplacement                          |
| Base de données  | `packages/database` / `@shelf/database`, Prisma `6.19.3`, migrations nombreuses, client partagé                   | Le paquet cible existe déjà, mais son modèle reste Shelf.nu             |
| Documentation    | `apps/docs` / VitePress, documentation Shelf.nu                                                                   | Utile pour les pratiques existantes, à rebrander et compléter plus tard |
| Companion mobile | `apps/companion` / Expo                                                                                           | Présent dans le dépôt, hors cible immédiate du PRD Core web             |
| Tooling          | `tooling/typescript`                                                                                              | Conforme à l'approche monorepo                                          |
| Docker           | Pas de dossier racine `docker/`; Dockerfiles dans `apps/webapp`; docs Docker encore dépendantes de Supabase Cloud | Écart avec la cible on-prem Docker Compose                              |

Correspondance entre le PRD et l'existant :

| PRD Patrimoine360                             | Existant Shelf.nu                                                            | Décision de recalage                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/webapp` comme application principale    | Présent                                                                      | Conserver                                                                                          |
| `packages/database` comme propriétaire Prisma | Présent                                                                      | Conserver                                                                                          |
| Remix / React Router v7                       | React Router v7 présent, traces Remix encore dans conventions et dépendances | Conserver l'architecture actuelle                                                                  |
| PostgreSQL + Prisma                           | Présent via Prisma et Supabase PostgreSQL                                    | Conserver PostgreSQL / Prisma, retirer progressivement la dépendance Supabase là où le PRD l'exige |
| Better Auth                                   | Non présent ; intégration Supabase active                                    | Traiter en phase 3, sans migration précipitée en phase 1                                           |
| MinIO on-prem                                 | Non présent ; stockage et images liés à Supabase                             | Traiter en phase 2 ou phase 9 selon la trajectoire Docker                                          |
| Sites / Locaux                                | Module `location` et routes `locations.*` présents                           | Mapper progressivement vers le vocabulaire `Site` / `Local`                                        |
| Biens / Équipements                           | Module `asset` et routes `assets.*` présents                                 | Mapper progressivement vers `Bien` / `Équipement`                                                  |
| Custody / Responsables                        | Module `custody`, `team-member`, relations Prisma existantes                 | Réutiliser et renommer au bon moment                                                               |
| Rappels                                       | Module `asset-reminder` et routes `reminders.*` présents                     | Réutiliser comme base des rappels Core                                                             |
| Réservations                                  | Module `booking` présent                                                     | Réutiliser comme module Core                                                                       |
| Contrats, fiches de visite, travaux           | Non observés comme modules métier Patrimoine360                              | Réserver au dépôt Enterprise privé                                                                 |
| Feature flags `LICENSE_TYPE`                  | `ENABLE_PREMIUM_FEATURES` existe, pas `LICENSE_TYPE`                         | Introduire une frontière licence en phase 7                                                        |
| Branding Patrimoine360                        | Nombreux libellés et paquets `shelf`, `@shelf/*`                             | Rebranding progressif en phase 6                                                                   |

Écarts principaux :

- Authentification : le dépôt actuel dépend de Supabase, alors que le PRD cible Better Auth.
- Stockage : le PRD cible MinIO pour l'on-prem, alors que l'existant conserve des flux Supabase.
- Nommage métier : les concepts actuels sont `assets`, `locations`, `bookings`, `team members`, alors que le PRD cible `biens`, `sites`, `locaux`, `responsables`, `rappels`.
- Nommage technique : les packages et scripts restent `shelf` / `@shelf/*`.
- Docker on-prem : le PRD demande `docker/docker-compose.yml` avec PostgreSQL et MinIO ; le dépôt n'a pas ce dossier et la documentation Docker actuelle suppose encore une base Supabase configurée séparément.
- Enterprise : le dépôt contient des fonctionnalités premium Shelf.nu comme Stripe, SSO et `ENABLE_PREMIUM_FEATURES`, mais pas les modules Enterprise Patrimoine360 ciblés.
- Prisma : le schéma actuel contient déjà `Organization`, `Asset`, `Location`, `Custody`, `Booking`, `AssetReminder`, mais pas les modèles nommés `Site`, `Bien`, `CustodyRecord`, `Rappel`, ni les tables Better Auth du PRD.
- Documentation : `apps/docs` reste centrée sur Shelf.nu et doit être réalignée avec Patrimoine360 après les fondations.

Décision de trajectoire :

Adapter progressivement l'existant, sans repartir d'un nouveau clone et sans reconstruire un découpage `apps/web` + `apps/api`.

Justification :

- Le dépôt est déjà le bon dépôt public `patrimoine360-core` et pointe vers Shelf.nu comme amont.
- La structure actuelle correspond largement à la cible PRD : `apps/webapp`, `packages/database`, pnpm, Turborepo, React Router v7, Prisma, PostgreSQL.
- Les modules Core de Shelf.nu couvrent déjà une grande partie du domaine Patrimoine360 : actifs, emplacements, custody, réservations, rappels, rapports, QR, imports et permissions.
- Repartir de zéro ferait perdre les migrations, composants, tests et flux métier déjà exploitables.
- Une adaptation progressive permet d'isoler les risques : d'abord fondations, puis auth, modèle métier, branding et frontière Enterprise.

Règles d'application de la décision :

- Ne pas renommer massivement `@shelf/*` tant que les fondations, les tests et la stratégie de migration ne sont pas stabilisés.
- Ne pas supprimer Supabase en phase 1 ; la migration vers Better Auth et MinIO doit être traitée comme un chantier dédié.
- Ne pas introduire les modules Enterprise Patrimoine360 dans le Core public.
- Conserver `apps/companion` comme présent mais hors périmètre immédiat, sauf décision produit ultérieure.
- Utiliser les modules existants comme base fonctionnelle : `asset` vers `Bien`, `location` vers `Site`, `asset-reminder` vers `Rappel`, `custody` vers responsabilité / affectation.
- Documenter chaque renommage métier avant modification de schéma ou de route.

Impacts sur les phases suivantes :

- Phase 2 : normaliser les scripts et l'environnement sans casser le monorepo existant ; ajouter la cible Docker Community au lieu de remplacer brutalement les Dockerfiles actuels.
- Phase 3 : préparer la migration Supabase Auth vers Better Auth avec une matrice de compatibilité utilisateurs, sessions, rôles et routes protégées.
- Phase 4 : décider si les modèles Prisma sont renommés physiquement ou si une couche de vocabulaire Patrimoine360 recouvre d'abord les modèles existants.
- Phase 5 : réutiliser les flux `assets`, `locations`, `bookings`, `custody`, `reminders` comme base des modules Core.
- Phase 6 : rebrander les libellés visibles avant de renommer les packages internes.
- Phase 7 : remplacer ou encapsuler `ENABLE_PREMIUM_FEATURES` par une frontière explicite `LICENSE_TYPE`.
- Phase 8 : garder les modules contrats, fiches de visite, travaux, WhatsApp et RBAC géographique avancé hors Core public.
- Phase 9 : aligner CI, Docker, migrations, seeds et procédures de release sur la stratégie progressive.

Commandes de validation exécutées :

- `Get-Content -Raw package.json`
- `Get-Content -Raw pnpm-workspace.yaml`
- `Get-Content -Raw turbo.json`
- `Get-Content -Raw apps\webapp\package.json`
- `Get-Content -Raw packages\database\package.json`
- `Get-Content -Raw apps\docs\package.json`
- `Get-Content -Raw apps\companion\package.json`
- `Get-Content -Raw apps\docs\local-development.md`
- `Get-Content -Raw apps\docs\docker.md`
- `Get-Content -Raw apps\docs\license.md`
- `Get-Content -Raw C:\Users\Tutu\Downloads\PATRIMOINE360_PRD.md`
- `Get-ChildItem -Directory apps\webapp\app`
- `Get-ChildItem -Directory apps\webapp\app\modules`
- `rg --files apps\webapp\app\routes`
- `rg "model (Organization|Asset|Location|Booking|Custody|User|Team|Reminder|Site|Bien|Contract|Work|Visit)" packages\database\prisma\schema.prisma`

Critères d'acceptation :

- La cartographie des dossiers et packages est documentée.
- Les écarts entre le PRD, Shelf.nu et le dépôt courant sont listés.
- La trajectoire d'alignement est explicitement décidée.
- Les impacts sur scripts, routes, Prisma, environnement, Docker et CI sont identifiés.

Risques et points d'attention :

- La migration Supabase vers Better Auth / MinIO est un chantier à risque et ne doit pas être mélangée avec le rebranding.
- Les migrations Prisma existantes sont nombreuses ; tout renommage physique de modèle doit être préparé avec prudence.
- Le PRD mentionne Prisma 5, tandis que le dépôt utilise Prisma 6.19.3. La cible doit être réévaluée en phase 2 avant toute rétrogradation ou verrouillage de version.
- Le dépôt contient des fonctionnalités premium Shelf.nu ; elles ne sont pas équivalentes aux modules Enterprise Patrimoine360 et doivent être auditées avant conservation.

### Phase 2 - Fondations techniques Core

Statut : Terminé

Objectif : aligner le monorepo, les scripts, les conventions de packages, les variables d'environnement, Docker Community, PostgreSQL, Prisma, lint, typecheck, build et CI de base.

Sources vérifiées :

- Documentation Turborepo via Context7, bibliothèque `/vercel/turborepo`.
- Documentation Turborepo sur `tasks`, `dependsOn`, `outputs` et cache : `https://github.com/vercel/turborepo/blob/main/apps/docs/content/docs/guides/multi-language.mdx`.
- Documentation Turborepo sur la configuration ESLint : `https://github.com/vercel/turborepo/blob/main/apps/docs/content/docs/guides/tools/eslint.mdx`.
- Documentation locale : `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.env.example`.
- Manifestes : `apps/webapp/package.json`, `packages/database/package.json`, `apps/docs/package.json`, `apps/companion/package.json`, `tooling/typescript/package.json`.
- Prisma : `packages/database/prisma/schema.prisma`, `packages/database/prisma.config.ts`, `apps/webapp/prisma.config.ts`, `packages/database/src/client.ts`.
- Docker : `apps/webapp/Dockerfile`, `apps/webapp/Dockerfile.image`.
- CI et qualité : `.github/workflows/test.yml`, `.github/workflows/build.yml`, `.github/workflows/deploy.yml`, `.github/workflows/docs-deploy.yml`, `lefthook.yml`, `commitlint.config.cjs`.

État technique vérifié :

- Le dépôt est un monorepo pnpm + Turborepo.
- Le gestionnaire de paquets attendu est `pnpm@9.15.9`, déclaré dans `packageManager`.
- Le moteur Node attendu est `>=22.20.0`, mais la machine locale a répondu `v22.13.0`. Il faut mettre Node à jour avant de valider les builds localement.
- Le workspace couvre `apps/*`, `packages/*` et `tooling/*`.
- Les packages principaux restent nommés `@shelf/webapp`, `@shelf/database`, `@shelf/docs`, `@shelf/companion` et `@shelf/typescript-config`.
- `node_modules` n'est pas présent localement ; les commandes Turbo dépendantes de l'installation ne sont donc pas exécutables tant que `pnpm install --frozen-lockfile` n'a pas été lancé.
- `pnpm-lock.yaml` est présent et doit rester le lockfile de référence.
- Prisma est centralisé dans `packages/database`, avec un schéma PostgreSQL et `directUrl = env("DIRECT_URL")`.
- Le webapp consomme Prisma via `@shelf/database`, avec un client factory partagé.
- Le dépôt contient des Dockerfiles applicatifs dans `apps/webapp`, mais pas encore de dossier racine `docker/` ni de `docker-compose.yml` Community conforme au PRD.
- La CI GitHub existe déjà pour lint, typecheck, Vitest, build Docker GHCR, déploiement Fly.io et documentation, mais elle reste orientée Shelf.nu / Supabase / Fly.io.

Décision de fondation :

Conserver le socle pnpm + Turborepo + `apps/webapp` + `packages/database`, puis ajouter progressivement les conventions Patrimoine360 au lieu de renommer ou déplacer les packages immédiatement.

Règles de fondation Core :

- Utiliser exclusivement pnpm ; ne pas introduire `package-lock.json` ni `yarn.lock`.
- Conserver `pnpm-lock.yaml` comme source de reproductibilité.
- Garder `packages/database` comme propriétaire unique du schéma Prisma, des migrations et de la génération client.
- Garder `apps/webapp/app/database/db.server.ts` comme wrapper applicatif autour de `@shelf/database`.
- Ne pas renommer les packages `@shelf/*` avant stabilisation des scripts, tests et migrations.
- Ne pas créer de package Enterprise dans le dépôt Core public.
- Ajouter les conventions Patrimoine360 par couches : variables d'environnement, flags, documentation, puis renommage visible.
- Garder les tâches Turbo avec des `outputs` explicites pour les tâches qui produisent des fichiers, conformément à la documentation Turborepo.
- Garder les tâches non cacheables (`dev`, `start`, migrations, tests interactifs) hors cache.

Scripts retenus comme base :

| Besoin             | Script actuel                                  | Décision                                           |
| ------------------ | ---------------------------------------------- | -------------------------------------------------- |
| Installation       | `pnpm install --frozen-lockfile`               | À utiliser en CI et onboarding                     |
| Développement web  | `pnpm webapp:dev`                              | À conserver                                        |
| Build global       | `pnpm turbo build` ou `pnpm run build`         | À conserver                                        |
| Build webapp       | `pnpm webapp:build`                            | À conserver                                        |
| Lint global        | `pnpm turbo lint` ou `pnpm run lint`           | À conserver                                        |
| Typecheck global   | `pnpm turbo typecheck` ou `pnpm run typecheck` | À conserver                                        |
| Tests webapp       | `pnpm webapp:test -- --run`                    | À conserver avec `--run`                           |
| Validation webapp  | `pnpm webapp:validate`                         | À conserver comme contrôle fort                    |
| Prisma generate    | `pnpm db:generate`                             | À conserver                                        |
| Préparer migration | `pnpm db:prepare-migration`                    | À conserver                                        |
| Déployer migration | `pnpm db:deploy-migration`                     | À conserver                                        |
| Reset base         | `pnpm db:reset`                                | Destructif, ne pas utiliser sans demande explicite |
| Documentation      | `pnpm docs:build`, `pnpm docs:dev`             | À conserver                                        |

Variables d'environnement à aligner :

- Conserver temporairement `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_PUBLIC`, `SUPABASE_SERVICE_ROLE` tant que Supabase Auth / Storage n'est pas migré.
- Ajouter plus tard les variables PRD restantes : `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_USE_SSL`, `ENTERPRISE_LICENSE_KEY`. `LICENSE_TYPE` est traité en phase 7.
- Renommer progressivement les valeurs visibles `APP_NAME`, emails de support et exemples SMTP vers Patrimoine360.
- Ne jamais ajouter de secrets réels dans `.env.example`.

PostgreSQL et Prisma :

- La cible Core reste PostgreSQL.
- Le schéma actuel utilise Prisma `6.19.3`, alors que le PRD mentionne Prisma 5. La décision phase 2 est de conserver Prisma 6 tant qu'aucun blocage n'est démontré.
- Les migrations restent dans `packages/database/prisma/migrations`.
- Toute évolution du schéma doit passer par `pnpm db:prepare-migration`, revue SQL, puis `pnpm db:deploy-migration`.
- La séparation Core / Enterprise devra être documentée dans le schéma avant ajout de modèles privés.

Docker Community :

- L'existant fournit deux Dockerfiles : `apps/webapp/Dockerfile` pour Fly.io et `apps/webapp/Dockerfile.image` pour l'image GHCR.
- Le PRD cible un déploiement on-prem avec Docker Compose, PostgreSQL et MinIO.
- La décision phase 2 est d'ajouter plus tard un dossier racine `docker/` plutôt que de détourner les Dockerfiles existants.
- `docker/docker-compose.yml` devra lancer au minimum `app`, `postgres` et `minio`.
- `docker/docker-compose.enterprise.yml` devra rester hors Core ou ne contenir que des exemples sans module privé.

CI de base :

- La CI actuelle lance lint, typecheck et Vitest via `.github/workflows/test.yml`.
- La CI actuelle construit une image Docker GHCR via `.github/workflows/build.yml`.
- Le déploiement actuel Fly.io via `.github/workflows/deploy.yml` n'est pas la cible on-prem du PRD.
- La future CI Core devra valider : install pnpm, Prisma generate, lint, typecheck, tests unitaires, build webapp et éventuellement build Docker Community.
- Les secrets CI devront être renommés progressivement pour Better Auth / MinIO lorsque les phases 3 et 9 seront implémentées.

Critères d'acceptation phase 2 :

- Le socle monorepo cible est identifié et conservé.
- Les scripts de validation Core sont listés.
- Les écarts Node, dépendances locales, Supabase, Docker Compose et CI sont documentés.
- La stratégie Prisma est clarifiée.
- Aucun changement fonctionnel n'est introduit dans cette phase.

Commandes de validation exécutées :

- `npx ctx7@latest library "Turborepo" "..."`
- `npx ctx7@latest docs /vercel/turborepo "..."`
- `Get-Content -Raw package.json`
- `Get-Content -Raw pnpm-workspace.yaml`
- `Get-Content -Raw turbo.json`
- `Get-Content -Raw .env.example`
- `Get-Content -Raw apps\webapp\package.json`
- `Get-Content -Raw packages\database\package.json`
- `Get-Content -Raw packages\database\prisma.config.ts`
- `Get-Content -Raw apps\webapp\prisma.config.ts`
- `Get-Content -Raw apps\webapp\Dockerfile`
- `Get-Content -Raw apps\webapp\Dockerfile.image`
- `Get-Content -Raw .github\workflows\test.yml`
- `Get-Content -Raw .github\workflows\build.yml`
- `Get-Content -Raw .github\workflows\deploy.yml`
- `Get-Content -Raw lefthook.yml`
- `node --version`
- `pnpm.cmd --version`
- `pnpm.cmd exec turbo --version`
- `Test-Path node_modules`
- `rg "^(generator|datasource|  provider|  url|  directUrl)" packages\database\prisma\schema.prisma -n`

Résultats de validation :

- Node local : `v22.13.0`, inférieur à `>=22.20.0`.
- pnpm local : `9.15.9`, conforme à `packageManager`.
- Turbo local : non exécutable, car `node_modules` est absent.
- Dossier `docker/` : absent.
- Prisma datasource : PostgreSQL avec `DATABASE_URL` et `DIRECT_URL`.

Actions de suite recommandées :

1. Mettre Node local à `>=22.20.0`.
2. Lancer `pnpm install --frozen-lockfile`.
3. Vérifier `pnpm db:generate`.
4. Vérifier `pnpm turbo lint`.
5. Vérifier `pnpm turbo typecheck`.
6. Vérifier `pnpm webapp:test -- --run`.
7. Vérifier `pnpm webapp:build`.
8. Créer, dans une phase dédiée, le Docker Compose Community PostgreSQL + MinIO.
9. Aligner `.env.example` avec Patrimoine360 après les décisions Better Auth / MinIO.

Risques et points d'attention :

- Les commandes de build et test n'ont pas été lancées, car les dépendances ne sont pas installées localement.
- Node local doit être mis à jour avant validation complète.
- Les scripts et secrets CI restent liés à Supabase et Fly.io.
- Le Docker Compose on-prem n'existe pas encore.
- Le rebranding technique des packages `@shelf/*` doit attendre une phase dédiée.

Critères d'acceptation :

- `pnpm install` est reproductible.
- `pnpm turbo lint`, `pnpm turbo typecheck` et `pnpm turbo build` sont documentés et exécutables.
- Prisma generation et migrations Core sont clarifiées.

### Phase 3 - Authentification et identité

Statut : Terminé

Objectif : définir l'authentification cible, les rôles Patrimoine360, les sessions, les routes protégées et les seeds initiaux.

Sources vérifiées :

- Documentation Better Auth via Context7, bibliothèque `/better-auth/better-auth`.
- Documentation Better Auth React Router v7 : `https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/react-router.mdx`.
- Documentation Better Auth installation / Prisma : `https://github.com/better-auth/better-auth/blob/main/docs/content/docs/installation.mdx`.
- Documentation Better Auth migration Supabase : `https://github.com/better-auth/better-auth/blob/main/docs/content/docs/guides/supabase-migration-guide.mdx`.
- Code local : `apps/webapp/server/session.ts`, `apps/webapp/server/index.ts`, `apps/webapp/server/middleware.ts`.
- Code local : `apps/webapp/app/modules/auth/service.server.ts`, `apps/webapp/app/modules/auth/mappers.server.ts`.
- Code local : routes `_auth+`, intégration `apps/webapp/app/integrations/supabase/client.ts`, `apps/webapp/app/utils/env.ts`, `apps/webapp/app/utils/roles.server.ts`, `apps/webapp/app/utils/permissions/permission.data.ts`.
- Schéma Prisma : `packages/database/prisma/schema.prisma`.

État actuel de l'authentification :

- Le fournisseur d'authentification est Supabase Auth, via `@supabase/supabase-js`.
- Les variables obligatoires actuelles incluent `SUPABASE_URL`, `SUPABASE_ANON_PUBLIC`, `SUPABASE_SERVICE_ROLE` et `SESSION_SECRET`.
- Le serveur Hono expose aux loaders/actions un contrat applicatif très utilisé : `context.isAuthenticated`, `context.getSession()`, `context.setSession()` et `context.destroySession()`.
- La session applicative est stockée dans le cookie `__authSession` et contient `accessToken`, `refreshToken`, `userId`, `email`, `expiresIn`, `expiresAt`.
- Le middleware `refreshSession()` rafraîchit les tokens Supabase, puis `protect()` bloque les routes privées.
- La validation de session repose encore sur la table Supabase `auth.refresh_tokens`.
- Les flux existants couvrent : email/mot de passe, inscription, confirmation OTP, connexion OTP, réinitialisation du mot de passe, SSO Supabase, callback OAuth, acceptation d'invitation, mise à jour de mot de passe et suppression de compte auth.
- Les rôles existants sont séparés entre rôles globaux `Roles` et rôles d'organisation `OrganizationRoles` (`OWNER`, `ADMIN`, `SELF_SERVICE`, `BASE`).
- Le PRD cible des rôles métier différents : `SUPER_ADMIN`, `ADMIN`, `PILOTE_GRM`, `EVALUATEUR_CIPM`, `RESPONSABLE_SITE`, `LECTEUR`.

Décision cible :

Migrer vers Better Auth, mais préserver temporairement le contrat `context.getSession()` pour éviter de modifier toutes les routes protégées en une seule opération.

Architecture cible :

- Créer une instance Better Auth côté serveur dans `apps/webapp/app/lib/auth.server.ts` ou dans un emplacement équivalent validé en phase 2.
- Utiliser Better Auth avec PostgreSQL et Prisma, en s'appuyant sur l'adapter Prisma ou sur le provider PostgreSQL selon le choix retenu après validation du schéma.
- Monter la route Better Auth `apps/webapp/app/routes/api.auth.$.ts` avec un `loader` et une `action` qui délèguent à `auth.handler(request)`.
- Créer un client `apps/webapp/app/lib/auth-client.ts` avec `better-auth/react` pour les actions client.
- Ajouter les variables `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL`.
- Conserver `SESSION_SECRET` tant que le cookie applicatif de compatibilité existe.
- Introduire les tables Better Auth nécessaires : utilisateur auth, session, compte et vérification, en évitant les collisions avec le modèle applicatif `User` existant.
- Remplacer progressivement les appels Supabase Auth par un service d'auth interne stable.

Contrat de session à préserver pendant la migration :

- `context.getSession()` doit continuer à retourner au minimum `userId` et `email`.
- Les champs `accessToken`, `refreshToken`, `expiresIn` et `expiresAt` ne doivent pas être supposés permanents dans le code métier ; ils doivent être confinés à l'adaptateur d'auth.
- Le middleware de protection doit basculer de la validation Supabase vers la validation Better Auth sans changer les loaders/actions métier.
- Les routes publiques doivent rester explicitement listées, notamment `/login`, `/join`, `/forgot-password`, `/logout`, `/api/auth/*`, `/qr/*`, `/api/stripe-webhook` et les routes mobiles.

Plan de migration recommandé :

1. Ajouter Better Auth en parallèle de Supabase Auth, sans supprimer les flux existants.
2. Ajouter les variables `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` dans `.env.example` et `env.ts`.
3. Générer ou écrire la migration Prisma Better Auth dans `packages/database`.
4. Créer un adaptateur de session interne qui convertit une session Better Auth vers le contrat applicatif actuel.
5. Migrer les utilisateurs Supabase vers Better Auth par lots, en conservant les IDs quand c'est possible.
6. Migrer les comptes email/password et SSO avec un script vérifiable ; la documentation Better Auth fournit un guide de migration Supabase.
7. Basculer `/login` et `/join` vers Better Auth, puis traiter OTP et reset password.
8. Déplacer SSO vers le périmètre Enterprise si la décision licence le confirme.
9. Remplacer `validateSession()` et `refreshAccessToken()` par des appels Better Auth.
10. Retirer Supabase Auth uniquement après tests de connexion, déconnexion, invitation, session expirée, rôle et route protégée.

Décision sur les rôles :

- Ne pas remplacer brutalement `OrganizationRoles`.
- Introduire une matrice de mapping Patrimoine360 avant modification du schéma :
  - `SUPER_ADMIN` : administration globale, proche du `Roles.ADMIN` actuel mais à expliciter.
  - `ADMIN` : administration d'organisation, proche de `OrganizationRoles.OWNER` / `ADMIN`.
  - `PILOTE_GRM` : rôle opérationnel avancé, à ajouter comme rôle métier.
  - `EVALUATEUR_CIPM` : rôle métier à garder hors Core si lié aux fiches de visite Enterprise.
  - `RESPONSABLE_SITE` : rôle Core lié au périmètre site/local.
  - `LECTEUR` : rôle de consultation, proche de `BASE` mais avec terminologie Patrimoine360.
- Garder la table de permissions existante comme base technique, mais renommer les entités métier en phase 4 ou 6 selon la stratégie de modèle.

Seeds initiaux à prévoir :

- Un utilisateur `SUPER_ADMIN` ou administrateur système.
- Une organisation de démonstration Patrimoine360.
- Un jeu de rôles Core minimal : `ADMIN`, `RESPONSABLE_SITE`, `LECTEUR`.
- Des permissions Core pour sites, biens, affectations, rappels et rapports simples.
- Les rôles Enterprise ne doivent pas être seedés dans le Core public sauf comme valeurs inactives explicitement justifiées.

Critères de validation fonctionnelle :

- Un utilisateur peut s'inscrire ou être créé.
- Un utilisateur peut se connecter par email/mot de passe.
- Une session survit au rechargement de page.
- Une session expirée renvoie vers `/login`.
- Une route privée bloque un utilisateur non connecté.
- Une route privée charge `context.getSession().userId` pour un utilisateur connecté.
- Les rôles limitent bien l'accès aux actions sensibles.
- La déconnexion détruit la session.
- Les tests existants de loaders/actions utilisant `context.getSession()` restent adaptables sans réécriture massive.

Risques et points d'attention :

- La migration d'auth touche beaucoup de routes ; elle doit être isolée des changements de branding et de modèle métier.
- Supabase Auth et Supabase Storage sont entremêlés dans le dépôt ; remplacer l'auth ne remplace pas automatiquement le stockage.
- Les comptes SSO et OTP doivent être traités séparément, car leur comportement n'est pas identique à une connexion email/mot de passe.
- La conservation des IDs utilisateur est prioritaire pour préserver les relations Prisma existantes.
- Les tables Supabase `auth.*` ne doivent plus être interrogées une fois la bascule Better Auth terminée.
- Toute migration d'utilisateurs doit être répétable, traçable et testée sur une copie de base.

Commandes de validation exécutées :

- `npx ctx7@latest library "Better Auth" "..."`
- `npx ctx7@latest docs /better-auth/better-auth "...React Router...Prisma..."`
- `npx ctx7@latest docs /better-auth/better-auth "...migrate existing users...Supabase"`
- `rg --files apps\webapp\app\modules\auth apps\webapp\app\routes\_auth+ apps\webapp\app\utils apps\webapp\app\integrations\supabase apps\webapp\app\config`
- `rg "getSupabase|supabaseClient|require.*User|require.*Session|session|SESSION_SECRET|SUPABASE|Role|role|UserRole|TeamMemberRole|auth" apps\webapp\app\modules\auth apps\webapp\app\routes\_auth+ apps\webapp\app\utils apps\webapp\app\integrations\supabase apps\webapp\app\config -n`
- `Get-Content -Raw apps\webapp\server\session.ts`
- `Get-Content -Raw apps\webapp\server\index.ts`
- `Get-Content -Raw apps\webapp\server\middleware.ts`
- `Get-Content -Raw apps\webapp\app\modules\auth\service.server.ts`
- `Get-Content -Raw apps\webapp\app\utils\roles.server.ts`
- `Get-Content -Raw apps\webapp\app\utils\permissions\permission.data.ts`

Critères d'acceptation :

- Connexion, session, rôles et routes protégées sont validables.
- Les choix Supabase, Better Auth ou autre solution sont documentés avec impacts.

### Phase 4 - Modèle métier Core

Statut : Terminé

Objectif : implémenter ou aligner les entités Core : Organization, Site, Bien, CustodyRecord, Rappel, permissions de base et relations Prisma nécessaires.

Périmètre exécuté :

Cette phase établit l'alignement métier Core à partir du schéma Shelf.nu existant. Elle ne crée pas encore de migration Prisma et ne renomme pas physiquement les modèles, afin d'éviter une duplication de tables ou une rupture des flux déjà présents.

Sources auditées :

- PRD Patrimoine360 : rôles, `Organization`, `Site`, `SiteUserAccess`, `Bien`, `CustodyRecord`, `BienTag`, `Rappel`, types de biens et hiérarchie géographique.
- `packages/database/prisma/schema.prisma`
- `apps/webapp/app/modules/asset`
- `apps/webapp/app/modules/location`
- `apps/webapp/app/modules/custody`
- `apps/webapp/app/modules/asset-reminder`
- `apps/webapp/app/modules/booking`
- `apps/webapp/app/modules/team-member`
- `apps/webapp/app/utils/permissions/permission.data.ts`

Équivalences Core retenues :

| PRD Patrimoine360                 | Modèle technique actuel                    | Décision                                                                                                                                                  |
| --------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Organization`                    | `Organization`                             | Conserver le modèle existant comme racine multi-tenant. Nettoyer plus tard les champs Shelf/premium seulement si nécessaire.                              |
| `Site` / local / bâtiment / salle | `Location`                                 | Utiliser `Location` comme modèle technique des sites et locaux. La hiérarchie parent/enfants existe déjà.                                                 |
| `Bien` / équipement               | `Asset`                                    | Utiliser `Asset` comme modèle technique des biens. Les relations organisation, catégorie, site, responsable, rappels, réservations et tags existent déjà. |
| `CustodyRecord` / affectation     | `Custody`                                  | Utiliser `Custody` comme affectation active. Ajouter un historique séparé uniquement si le besoin métier l'exige.                                         |
| `Rappel`                          | `AssetReminder`                            | Conserver les rappels liés aux biens. Prévoir une extension ultérieure si des rappels doivent cibler un site sans bien.                                   |
| Responsable / détenteur           | `TeamMember`                               | Conserver `TeamMember` comme responsable opérationnel, avec lien optionnel vers `User`.                                                                   |
| Permissions de base               | `OrganizationRoles` + `Role2PermissionMap` | Garder la base technique existante jusqu'à l'introduction du mapping de rôles Patrimoine360 défini en phase 3.                                            |
| Réservation                       | `Booking`                                  | Conserver comme flux Core adjacent aux biens. Ne pas modifier en phase 4.                                                                                 |
| Kit / lot                         | `Kit`                                      | Conserver comme capacité héritée utile, sans en faire un pilier du modèle Core initial.                                                                   |

Décision structurante :

- Ne pas ajouter maintenant des modèles Prisma parallèles `Site`, `Bien`, `CustodyRecord` ou `Rappel`.
- Ne pas renommer physiquement `Asset`, `Location`, `Custody` et `AssetReminder` avant stabilisation des flux et des tests.
- Introduire d'abord une couche de vocabulaire Patrimoine360 dans les services, routes, libellés et documents.
- Réserver les renommages physiques à une décision ultérieure, après validation des migrations et du risque produit.

Relations principales documentées :

- `Organization` possède les biens, sites, membres, réservations, rappels, kits, paramètres et utilisateurs rattachés.
- `Location` appartient à une organisation et peut avoir un parent, des enfants, des biens, des kits et des notes.
- `Asset` appartient à une organisation, peut être rattaché à un site, une catégorie, des tags, un kit, une affectation active, des rappels et des réservations.
- `Custody` relie un bien à un `TeamMember` et impose une seule affectation active par bien via `assetId @unique`.
- `AssetReminder` appartient à une organisation, cible un bien et peut notifier des `TeamMember`.
- `Booking` appartient à une organisation, possède un statut et relie des biens à un créateur et à un responsable.
- `UserOrganization` relie un utilisateur à une organisation avec les rôles techniques actuels.

Invariants à préserver :

- Toute entité Core opérationnelle doit être rattachée à `organizationId`.
- Un bien ne doit jamais être associé à un site, une affectation, un rappel ou une réservation d'une autre organisation.
- La hiérarchie des sites doit rester dans la même organisation et ne doit pas permettre de cycle parent/enfant.
- Un bien ne peut avoir qu'une affectation active à la fois.
- L'assignation et la libération d'une affectation doivent mettre à jour le statut du bien de façon atomique.
- Le statut du bien doit rester cohérent avec l'affectation et la réservation : `AVAILABLE`, `IN_CUSTODY`, `CHECKED_OUT`.
- La suppression d'un responsable doit rester bloquée s'il possède une affectation active.
- Les rappels doivent pointer vers un bien valide de la même organisation.
- Les modèles Enterprise comme contrats, fiches de visite, travaux, WhatsApp et RBAC géographique avancé ne doivent pas entrer dans le Core public.

Écarts identifiés :

- Le PRD définit des rôles métier (`SUPER_ADMIN`, `PILOTE_GRM`, `RESPONSABLE_SITE`, `LECTEUR`) alors que le schéma actuel expose `Roles` et `OrganizationRoles`.
- `Custody` représente l'état actif, mais pas encore un historique complet de responsabilités.
- `AssetReminder` cible obligatoirement un bien ; le rappel site/local n'est pas encore modélisé.
- `Location` couvre la hiérarchie mais ne porte pas encore tous les champs PRD de niveau géographique, code site ou typologie immobilière.
- `Asset` couvre le bien générique mais devra probablement recevoir ou exposer des champs métier comme type de bien, référence, marque, modèle, numéro de série ou date d'acquisition.

Plan de migration recommandé :

1. Conserver le schéma actuel comme modèle technique de référence.
2. Ajouter les libellés, types applicatifs et adaptateurs Patrimoine360 sans migration destructive.
3. Introduire uniquement les champs manquants prouvés par les écrans Core de phase 5.
4. Ajouter un historique d'affectation si le besoin de traçabilité dépasse l'état actif fourni par `Custody`.
5. Étendre les rappels vers des cibles multiples seulement si les flux Core l'exigent.
6. Écrire les migrations dans `packages/database` avec `pnpm db:prepare-migration`.
7. Générer le client avec `pnpm db:generate`.
8. Couvrir les invariants critiques par tests de services avant toute bascule de vocabulaire profonde.

Tests à prévoir :

- Création, modification et déplacement d'un site dans une hiérarchie sans cycle.
- Rejet d'un rattachement de bien à un site d'une autre organisation.
- Assignation et libération d'un bien avec statut cohérent.
- Blocage de suppression d'un responsable avec affectation active.
- Création de rappel sur un bien de la même organisation.
- Vérification des permissions Core pour sites, biens, affectations et rappels.

Commandes de validation exécutées :

- `rg -n "model (Organization|Asset|Location|Custody|AssetReminder|Booking|TeamMember|UserOrganization)|enum (Roles|OrganizationRoles|AssetStatus|BookingStatus)" packages/database/prisma/schema.prisma`
- `rg --files apps/webapp/app/modules/asset apps/webapp/app/modules/location apps/webapp/app/modules/custody apps/webapp/app/modules/asset-reminder apps/webapp/app/modules/booking apps/webapp/app/modules/team-member`
- `rg --files apps/webapp/app/routes`
- `Get-Content -Raw apps\webapp\app\modules\custody\service.server.ts`
- `Get-Content -Raw apps\webapp\app\modules\location\descendants.server.ts`
- `Get-Content -Raw apps\webapp\app\modules\team-member\service.server.ts`
- `Get-Content -Raw apps\webapp\app\utils\permissions\permission.data.ts`

Critères d'acceptation :

- Les modèles Core existants sont identifiés et alignés avec le vocabulaire PRD.
- Les relations principales sont documentées.
- Les invariants de données critiques sont explicités.
- Les migrations nécessaires sont différées jusqu'aux champs réellement requis par les modules Core.

### Phase 5 - Modules Core fonctionnels

Statut : Terminé

Objectif : livrer les écrans et flux Core : dashboard basique, sites, locaux, biens, équipements, responsables, affectations, rappels et rapports simples.

Périmètre exécuté :

Cette phase confirme la couverture fonctionnelle Core déjà présente dans l'application héritée de Shelf.nu. Aucun écran n'a été réécrit et aucun libellé n'a encore été remplacé par la terminologie Patrimoine360 ; ce travail reste volontairement réservé à la phase 6.

Constat global :

- Les flux Core demandés par le PRD existent déjà majoritairement sous les noms Shelf.nu : `assets`, `locations`, `team members`, `custody`, `asset reminders`, `bookings`, `reports` et `home`.
- Les routes Remix chargent des données réelles via loaders/actions et s'appuient sur les services métier existants.
- Les contrôles d'organisation et de permissions sont déjà présents dans les routes et services principaux.
- Le dashboard applicatif réel est `/home`; `/dashboard` redirige vers `/home`.
- Les modules mobiles exposent aussi des points d'entrée Core pour biens, sites, affectations, réservations, responsables et dashboard.

Flux Core disponibles :

| Besoin Patrimoine360 Core | Implémentation actuelle                                                                           | État                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Dashboard basique         | `/home`, `apps/webapp/app/components/home`, `apps/webapp/app/components/dashboard`                | Disponible avec KPI, biens récents, valeur, statuts, sites, rappels et réservations.                                      |
| Sites et locaux           | `/locations`, `/locations/new`, `/locations/:id`, `/locations/:id/edit`, API tree et bulk actions | Disponible avec CRUD, hiérarchie, notes, activité, biens et kits rattachés.                                               |
| Biens et équipements      | `/assets`, `/assets/new`, `/assets/:id`, import/export, API bulk actions                          | Disponible avec CRUD, recherche, filtres, catégorie, site, responsable, images, QR, tags, notes, rappels et réservations. |
| Responsables              | `/settings/team`, `/settings/team/nrm`, profils utilisateurs et membres non enregistrés           | Disponible avec création, import, édition, consultation des biens/réservations/notes.                                     |
| Affectations              | routes `assign-custody`, `release-custody`, API bulk et mobile                                    | Disponible avec mise à jour atomique du statut du bien.                                                                   |
| Rappels                   | `/reminders`, onglet rappels d'un bien, scheduler et emails                                       | Disponible pour les rappels rattachés à un bien.                                                                          |
| Réservations              | `/bookings`, lifecycle, paramètres, exports, calendrier et mobile                                 | Disponible comme flux Core adjacent aux biens.                                                                            |
| Rapports simples          | `/reports`, `/reports/:reportId`, export CSV et PDF                                               | Disponible avec rapports inventaire, activité, utilisation, réservations, retards et affectations.                        |

Flux métier principaux :

- Bien : créer, modifier, supprimer, importer, exporter, rattacher à un site, changer de catégorie, associer des tags, rattacher un responsable, ajouter une note, créer un rappel, lier à une réservation.
- Site : créer, modifier, supprimer, rattacher des biens ou lots, gérer les notes, consulter l'activité, naviguer dans la hiérarchie.
- Responsable : créer un membre, importer des responsables, modifier les informations, consulter ses biens et réservations.
- Affectation : assigner un bien à un responsable, libérer l'affectation, préserver le statut du bien et l'événement d'activité.
- Rappel : créer, modifier, supprimer, planifier une notification et afficher les prochains rappels.
- Réservation : créer, réserver, sortir, retourner, retourner partiellement, annuler, archiver, exporter et notifier.
- Rapport : lister les rapports disponibles, exécuter un rapport, appliquer des filtres, exporter les résultats.

Tests et couverture existante :

- `apps/webapp/app/modules/asset` contient des tests de champs, requêtes, identifiants séquentiels, utilitaires et service.
- `apps/webapp/app/modules/location` contient des tests de valorisation, notes, rattachements et garde-fous inter-organisations.
- `apps/webapp/app/modules/booking` contient une couverture large du cycle de réservation, des conflits, des notifications, des retours partiels, de l'archivage et des permissions d'extension.
- `apps/webapp/app/modules/team-member` contient des tests de récupération, validation, erreurs et sélection.
- `apps/webapp/app/modules/reports` contient des tests de helpers et de rapports temporels.
- Les routes de gestion d'actifs dans les réservations possèdent aussi des tests serveur ciblés.

Écarts à traiter avant une livraison Core finale :

- Les libellés, titres, menus et URLs visibles restent majoritairement en anglais et orientés Shelf.nu.
- Les responsables sont encore exposés comme `team members` ou `NRM`.
- Les sites sont encore exposés comme `locations`.
- Les biens sont encore exposés comme `assets`.
- Les affectations sont encore exposées comme `custody`.
- Les rappels ciblent uniquement les biens ; les rappels site/local ne sont pas encore couverts.
- Les rapports contiennent encore des catégories et noms anglais.
- Les modules audits et certains add-ons apparaissent dans plusieurs surfaces ; leur frontière Core / Enterprise doit être clarifiée en phase 7.
- Aucun test dédié n'a été identifié pour `apps/webapp/app/modules/custody` ou `apps/webapp/app/modules/asset-reminder`.

Décision d'implémentation :

- Ne pas reconstruire les modules Core en phase 5.
- Conserver les écrans et services existants comme base fonctionnelle.
- Reporter la francisation, la terminologie Patrimoine360 et la navigation métier à la phase 6.
- Reporter l'isolation stricte des modules premium, audits et add-ons à la phase 7.
- Ajouter des tests ciblés sur `custody` et `asset-reminder` avant toute refonte de ces flux.

Validation locale :

- `node --version` retourne `v22.13.0`, inférieur à l'engine requis `>=22.20.0`.
- `pnpm.cmd webapp:test -- --run` a été relancé hors sandbox.
- La commande échoue avant exécution de Vitest, car `node_modules` est absent et `vitest` n'est pas disponible.
- La validation runtime complète doit être reprise après installation des dépendances et mise à niveau Node.

Commandes de validation exécutées :

- `rg --files apps\webapp\app\routes apps\webapp\app\modules`
- `rg --files apps\webapp\app\routes | rg "home|dashboard|assets|locations|reminders|reports|settings\.team"`
- `rg -n "export async function|export const loader|export const action" apps\webapp\app\routes\_layout+\dashboard.tsx apps\webapp\app\routes\_layout+\assets._index.tsx apps\webapp\app\routes\_layout+\assets.new.tsx apps\webapp\app\routes\_layout+\locations._index.tsx apps\webapp\app\routes\_layout+\locations.new.tsx apps\webapp\app\routes\_layout+\reminders._index.tsx apps\webapp\app\routes\_layout+\reports._index.tsx`
- `rg -n "describe\(|it\(|test\(" apps\webapp\app\modules\asset apps\webapp\app\modules\location apps\webapp\app\modules\custody apps\webapp\app\modules\asset-reminder apps\webapp\app\modules\booking apps\webapp\app\modules\team-member apps\webapp\app\modules\reports`
- `Get-Content -Raw apps\webapp\app\routes\_layout+\home.tsx`
- `Get-Content -Raw apps\webapp\app\routes\api+\mobile+\dashboard.ts`
- `Get-Content -Raw apps\webapp\app\modules\asset-reminder\service.server.ts`
- `Get-Content -Raw apps\webapp\app\modules\reports\registry.ts`
- `node --version`
- `pnpm.cmd webapp:test -- --run`

Critères d'acceptation :

- Les flux CRUD principaux sont présents dans le code et reliés à des données réelles.
- Les modules Core hérités sont identifiés comme base fonctionnelle Patrimoine360.
- Les écarts de terminologie et de branding sont explicitement transférés à la phase 6.
- Les lacunes de tests sur affectations et rappels sont documentées avant refonte.
- La validation runtime est bloquée localement par l'environnement, pas par une erreur fonctionnelle identifiée dans cette phase.

### Phase 6 - Branding Patrimoine360 Core

Statut : Terminé

Objectif : remplacer les libellés shelf.nu par Patrimoine360, ajouter la configuration de marque, la navigation française, la terminologie métier et les mentions d'attribution/licence.

Périmètre exécuté :

Cette phase applique un premier branding Core visible sans renommer les routes, les modèles Prisma, les packages ou les services internes. Les chemins historiques `/assets`, `/locations`, `/bookings`, `/reports` et `/reminders` restent inchangés pour préserver le fonctionnement existant.

Changements appliqués :

- Ajout d'une configuration de marque `Patrimoine360` dans `apps/webapp/app/config/shelf.config.ts`.
- Ajout des champs `brand.name`, `brand.shortName`, `brand.description` et `brand.sourceAttribution` dans `apps/webapp/app/config/types.ts`.
- Remplacement du suffixe de titre navigateur `shelf.nu` par `Patrimoine360` via `apps/webapp/app/utils/append-to-meta-title.ts`.
- Remplacement du titre racine et de la langue HTML principale dans `apps/webapp/app/root.tsx`.
- Remplacement du logo Shelf par un marquage texte `Patrimoine360` / `P360` quand aucun logo Patrimoine360 dédié n'est fourni.
- Mise à jour du logo email central `apps/webapp/app/emails/logo.tsx`.
- Ajout d'une mention d'attribution visible dans la barre latérale : `Adapté de Shelf.nu, sous licence AGPL-3.0.`
- Traduction de la navigation principale : Accueil, Biens, Sites, Réservations, Rappels, Rapports, Équipe, Paramètres.
- Traduction des surfaces Core principales : accueil, biens, sites, réservations, rappels et rapports.
- Traduction des titres et descriptions de rapports dans le registre central.
- Mise à jour des titres d'onglet des écrans d'authentification et d'accueil onboarding les plus visibles.

Fichiers modifiés :

- `apps/webapp/app/config/shelf.config.ts`
- `apps/webapp/app/config/types.ts`
- `apps/webapp/app/components/marketing/logos.tsx`
- `apps/webapp/app/components/layout/sidebar/app-sidebar.tsx`
- `apps/webapp/app/hooks/use-sidebar-nav-items.tsx`
- `apps/webapp/app/utils/append-to-meta-title.ts`
- `apps/webapp/app/root.tsx`
- `apps/webapp/app/emails/logo.tsx`
- `apps/webapp/app/modules/asset/data.server.ts`
- `apps/webapp/app/modules/reports/registry.ts`
- `apps/webapp/app/routes/_layout+/home.tsx`
- `apps/webapp/app/routes/_layout+/assets._index.tsx`
- `apps/webapp/app/routes/_layout+/locations._index.tsx`
- `apps/webapp/app/routes/_layout+/bookings._index.tsx`
- `apps/webapp/app/routes/_layout+/reminders._index.tsx`
- `apps/webapp/app/routes/_layout+/reports.tsx`
- `apps/webapp/app/routes/_layout+/reports._index.tsx`
- `apps/webapp/app/routes/_auth+/_auth.tsx`
- `apps/webapp/app/routes/_auth+/login.tsx`
- `apps/webapp/app/routes/_auth+/join.tsx`
- `apps/webapp/app/routes/_welcome+/welcome.tsx`
- `apps/webapp/app/routes/_welcome+/select-plan.tsx`

Limites assumées :

- Les noms de routes et d'API restent en anglais pour éviter une rupture fonctionnelle.
- Les noms de composants, services, erreurs techniques et types internes conservent encore la terminologie Shelf.nu.
- Les flux Stripe, SSO, add-ons, emails commerciaux et références store Shelf ne sont pas finalisés en Core ; ils doivent être traités en phase 7 ou phase 8.
- Le favicon pointe encore vers l'actif existant tant qu'un logo Patrimoine360 officiel n'est pas fourni.
- Les écrans de détail et certains composants profonds contiennent encore des libellés anglais.

Validation locale :

- `git diff --check` ne remonte pas d'erreur de whitespace.
- `pnpm.cmd webapp:test -- --run` reste non exécutable dans l'environnement actuel : Node est en `v22.13.0`, l'engine attendu est `>=22.20.0`, `node_modules` est absent et `vitest` n'est pas disponible.
- La validation visuelle complète devra être reprise après installation des dépendances et démarrage du serveur Remix.

Commandes de validation exécutées :

- `rg -n "Shelf|shelf.nu|Assets|Locations|Bookings|Reports|Reminders|Custody|Team members|Home" apps\webapp\app --glob "*.{ts,tsx}"`
- `rg -n "appendToMetaTitle|siteName|brand|logo|navigation|sidebar" apps\webapp\app --glob "*.{ts,tsx}"`
- `rg -n -e "Shelf Logo" -e "Welcome to shelf\.nu" -e "shelf\.nu" ...`
- `git diff --check`

Critères d'acceptation :

- Les surfaces visibles principales affichent Patrimoine360.
- La navigation principale utilise la terminologie française Core.
- Les titres navigateur utilisent Patrimoine360.
- Le logo visible n'affiche plus les images Shelf par défaut.
- Les obligations d'attribution restent visibles.
- Les écarts restants sont documentés avant traitement Core / Enterprise.

### Phase 7 - Frontière Core / Enterprise

Statut : Terminé

Objectif : mettre en place les feature flags, `LICENSE_TYPE`, les garde-fous AGPL/propriétaire, les conventions de synchronisation Core vers Enterprise et les règles empêchant les modules privés d'entrer dans Core.

Périmètre exécuté :

- Ajout de `LICENSE_TYPE` comme frontière de déploiement publique : `core` par défaut, `enterprise` uniquement pour les déploiements privés.
- Ajout d'une configuration typée `config.license` dans `apps/webapp/app/config/shelf.config.ts` et `apps/webapp/app/config/types.ts`.
- Encapsulation de `ENABLE_PREMIUM_FEATURES` derrière la licence : les fonctionnalités premium héritées ne peuvent s'activer que si `LICENSE_TYPE="enterprise"`.
- Désactivation SSO automatique en Core : `config.disableSSO` vaut vrai sans licence Enterprise, même si `DISABLE_SSO` n'est pas explicitement défini.
- Ajout du helper `apps/webapp/app/utils/license.ts` pour normaliser la licence et lever un garde-fou explicite sur les fonctions Enterprise.
- Ajout du helper `assertSSOEnabled()` dans `apps/webapp/app/utils/sso.server.ts`.
- Protection de `/sso-login`, `/oauth/callback` et `signInWithSSO()` par le garde-fou licence.
- Remplacement des accès directs à `ENABLE_PREMIUM_FEATURES` par `config.enablePremiumFeatures` dans les routes d'abonnement et d'accueil premium.
- Mise à jour de `.env.example` pour documenter `LICENSE_TYPE="core"` et désactiver les fonctionnalités premium par défaut.

Décisions :

- Core reste la base communautaire AGPL : biens, sites, affectations, réservations, rappels, rapports simples et navigation principale restent actifs sans licence Enterprise.
- Enterprise ne doit pas être livré par erreur dans Core : les modules contrats, fiches de visite, travaux, WhatsApp, RBAC géographique avancé et dashboards premium restent hors dépôt public.
- Le code premium/SSO hérité de Shelf.nu n'est pas supprimé dans cette phase pour éviter une refonte risquée ; il est rendu inactif en Core et réservé aux déploiements Enterprise privés.
- Toute nouvelle extension privée doit arriver via dépôt/package privé ou branche Enterprise, jamais comme dépendance obligatoire du Core public.
- La synchronisation recommandée est Core vers Enterprise : les correctifs communs partent du dépôt Core, puis sont propagés au dépôt privé ; le chemin inverse doit être filtré pour éviter les modules propriétaires.

Livrables :

- `apps/webapp/app/utils/license.ts`
- `apps/webapp/app/utils/license.test.ts`
- `apps/webapp/app/utils/env.ts`
- `apps/webapp/app/config/types.ts`
- `apps/webapp/app/config/shelf.config.ts`
- `apps/webapp/app/utils/sso.server.ts`
- `apps/webapp/app/routes/_auth+/sso-login.tsx`
- `apps/webapp/app/routes/_auth+/oauth.callback.tsx`
- `apps/webapp/app/modules/auth/service.server.ts`
- `apps/webapp/app/routes/_welcome+/welcome.tsx`
- `apps/webapp/app/routes/_layout+/account-details.subscription.tsx`
- `.env.example`

Validation locale :

- `git diff --check` ne remonte pas d'erreur de whitespace.
- `pnpm.cmd webapp:test -- --run` reste non exécutable dans l'environnement actuel : Node est en `v22.13.0`, l'engine attendu est `>=22.20.0`, `node_modules` est absent et `vitest` n'est pas disponible.
- Le test unitaire `apps/webapp/app/utils/license.test.ts` est ajouté mais devra être exécuté après installation des dépendances.

Critères d'acceptation :

- Les modules Core restent actifs sans licence Enterprise.
- Les modules Enterprise sont absents du Core public ou inactifs sans dépôt privé.
- `LICENSE_TYPE` est documenté et retombe en `core` si la valeur est absente ou inconnue.
- Les surfaces premium et SSO héritées sont inactives en Core.

Risques et points d'attention :

- Des fichiers profonds contiennent encore des libellés historiques Shelf.nu, notamment dans les erreurs SSO et certains emails premium ; ces surfaces sont verrouillées en Core mais devront être nettoyées si elles sont conservées côté Enterprise.
- La séparation physique du dépôt Enterprise reste à traiter en phase 8.

### Phase 8 - Socle Enterprise privé

Statut : À faire

Objectif : préparer les extensions privées : contrats, prestataires, fiches de visite, travaux, dashboard avancé, Excel CNPS, RBAC géographique, SSO, WhatsApp et licence Enterprise.

Plan opérationnel :

- Voir [PLAN-OPERATIONNEL-PHASES-8-9.md](./PLAN-OPERATIONNEL-PHASES-8-9.md), section `Phase 8 - Fermeture des écarts Core et socle Enterprise`.

Critères d'acceptation :

- Les extensions privées ont une convention d'isolation.
- Leur synchronisation depuis Core est documentée.

### Phase 9 - DevOps, qualité et livraison

Statut : À faire

Objectif : définir CI/CD, migrations, seeds, tests unitaires, intégration, E2E, Docker on-prem, sauvegardes, monitoring, sécurité, release Core et propagation vers Enterprise.

Plan opérationnel :

- Voir [PLAN-OPERATIONNEL-PHASES-8-9.md](./PLAN-OPERATIONNEL-PHASES-8-9.md), section `Phase 9 - DevOps, qualité et livraison séparée`.

Critères d'acceptation :

- La procédure de release Core est documentée.
- Les contrôles de qualité minimum sont exécutables.
- Le chemin de livraison Enterprise est séparé.

## Interfaces et contrats à prévoir

- Variables d'environnement : `LICENSE_TYPE`, base de données, auth, SMTP Brevo, MinIO, WhatsApp, clé Enterprise.
- Prisma : séparation lisible entre modèles Core et extensions Enterprise.
- Routes et API : conventions pour auth, sites, biens, rappels, imports, contrats, fiches de visite et travaux.
- Feature flags : modules Core toujours actifs, modules Enterprise conditionnels.
- DevOps : scripts standardisés pour install, dev, build, lint, typecheck, test, migrate et seed.

## Suivi

- [x] Phase 0 - Sécurisation du dépôt.
- [x] Phase 1 - Recalage avec la base shelf.nu.
- [x] Phase 2 - Fondations techniques Core.
- [x] Phase 3 - Authentification et identité.
- [x] Phase 4 - Modèle métier Core.
- [x] Phase 5 - Modules Core fonctionnels.
- [x] Phase 6 - Branding Patrimoine360 Core.
- [x] Phase 7 - Frontière Core / Enterprise.
- [ ] Phase 8 - Socle Enterprise privé.
- [ ] Phase 9 - DevOps, qualité et livraison.
