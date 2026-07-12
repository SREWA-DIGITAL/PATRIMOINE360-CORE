# Guide de développement local

Ce guide rassemble l'essentiel pour lancer Patrimoine360 Core en local après
avoir configuré [Supabase](./supabase-setup.md).

Le chemin officiel de développement du Core repose aujourd'hui sur :

- Better Auth pour l'authentification active ;
- Brevo pour les e-mails transactionnels ;
- Supabase pour PostgreSQL et le stockage de fichiers.

## Prérequis

- **Node.js** `22.20.0` recommandé via `.nvmrc` ou `.node-version`
- **pnpm** `9.15.4+`
- **Git**
- **Un projet Supabase** prêt pour PostgreSQL et Storage
- **Un fichier `.env`** à la racine du monorepo, copié depuis `.env.example`

## Vue d'ensemble du monorepo

Patrimoine360 Core est organisé en monorepo `pnpm + Turborepo`.

| Package                    | Chemin                | Description                             |
| -------------------------- | --------------------- | --------------------------------------- |
| `@shelf/webapp`            | `apps/webapp/`        | application web principale              |
| `@shelf/docs`              | `apps/docs/`          | site de documentation                   |
| `@shelf/database`          | `packages/database/`  | Prisma, client base de données et types |
| `@shelf/typescript-config` | `tooling/typescript/` | configurations TypeScript partagées     |

Les commandes peuvent être lancées package par package avec
`pnpm --filter <package>` ou à l'échelle du monorepo avec `pnpm turbo <task>`.

## Commandes principales

### Webapp

```bash
pnpm webapp:dev
pnpm webapp:build
pnpm webapp:test
pnpm webapp:validate
pnpm webapp:start
```

### Documentation

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

### Base de données

```bash
pnpm webapp:setup
pnpm db:generate
pnpm db:prepare-migration
pnpm db:deploy-migration
pnpm db:seed:core
pnpm db:reset
```

### Validation Core

```bash
pnpm core:validate:min
pnpm core:validate:ci
pnpm webapp:test:e2e:smoke
```

## Installation

### 1. Cloner le dépôt et installer les dépendances

```bash
git clone https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE.git
cd PATRIMOINE360-CORE
pnpm install
```

### 2. Configurer le SSL local si besoin

Le projet peut fonctionner en HTTPS local avec `mkcert`.

```bash
mkcert -install
mkdir apps/webapp/.cert
mkcert -key-file apps/webapp/.cert/key.pem -cert-file apps/webapp/.cert/cert.pem localhost 127.0.0.1 ::1
```

Si vous préférez désactiver le SSL local, retirez la configuration `https`
dans `apps/webapp/vite.config.ts`.

### 3. Initialiser la base

```bash
pnpm webapp:setup
```

### 4. Démarrer l'application

```bash
pnpm webapp:dev
```

Avec SSL :

- `https://localhost:3000`

Sans SSL :

- `http://localhost:3000`

## Pile technique

### Socle applicatif

- **React Router / Remix mode data**
- **React**
- **TypeScript**
- **Vite**

### Données et backend

- **Better Auth**
- **Supabase**
- **Prisma**
- **PostgreSQL**

### UI et outillage

- **Tailwind CSS**
- **ESLint**
- **Prettier**
- **Playwright**
- **Vitest**

## Workflow de développement

### Modifier le schéma Prisma

1. éditer `packages/database/prisma/schema.prisma`
2. préparer une migration :

```bash
pnpm db:prepare-migration
```

3. relire le SQL généré dans `packages/database/prisma/migrations/`
4. appliquer la migration :

```bash
pnpm db:deploy-migration
```

5. injecter le seed minimal si nécessaire :

```bash
pnpm db:seed:core
```

### Ajouter une fonctionnalité

- nouvelles routes : `apps/webapp/app/routes/`
- composants réutilisables : `apps/webapp/app/components/`
- logique métier : `apps/webapp/app/modules/`
- utilitaires : `apps/webapp/app/utils/`

Avant de considérer un lot comme prêt :

```bash
pnpm webapp:validate
pnpm webapp:test -- --run
```

## Hooks Git

Le dépôt utilise `lefthook.yml` pour lancer automatiquement :

- génération Prisma si le schéma change ;
- ESLint sur les fichiers stagés ;
- Prettier ;
- typecheck webapp ;
- contrôle du message de commit via Conventional Commits.

En phase de merge ou de rebase, les hooks pre-commit sont ignorés pour éviter
de bloquer la résolution des conflits.

## Variables d'environnement

Le fichier `.env` vit à la **racine du monorepo**, pas dans `apps/webapp/`.

Variables importantes en local :

```bash
SERVER_URL="https://localhost:3000"
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="https://localhost:3000"
BETTER_AUTH_BASE_PATH="/api/auth"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_PUBLIC="your-anon-public-key"
SUPABASE_SERVICE_ROLE="your-service-role-key"
ENABLE_PREMIUM_FEATURES="false"
SESSION_SECRET="your-local-session-secret"
```

### Chargement des variables

| Contexte            | Commande            | Chargement                            |
| ------------------- | ------------------- | ------------------------------------- |
| Dev                 | `pnpm webapp:dev`   | Vite lit la racine du monorepo        |
| Production locale   | `pnpm webapp:start` | wrapper `start:local` avec `dotenv`   |
| Docker / plateforme | `pnpm run start`    | variables injectées par la plateforme |

## Tests

### Tests unitaires

```bash
pnpm webapp:test -- --run
```

### Smoke E2E prioritaire

```bash
pnpm webapp:test:e2e:smoke
```

### Playwright complet

```bash
pnpm --filter @shelf/webapp test:e2e:install
pnpm --filter @shelf/webapp test:e2e:dev
```

## Débogage rapide

### Prisma Studio

```bash
pnpm --filter @shelf/webapp exec prisma studio
```

### Typecheck global

```bash
pnpm turbo typecheck
```

### Formatage global

```bash
pnpm run format
```

### En cas d'erreur base de données

- vérifier `DATABASE_URL` et `DIRECT_URL`
- vérifier que Supabase est bien accessible
- relancer les migrations si nécessaire

### En cas d'erreur SSL locale

- relancer `mkcert -install`
- régénérer les certificats
- ou désactiver `https` dans `vite.config.ts`

## Structure du projet

```text
PATRIMOINE360-CORE/
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
├── apps/
│   ├── webapp/
│   │   └── app/
│   │       ├── components/
│   │       ├── database/
│   │       ├── modules/
│   │       ├── routes/
│   │       ├── utils/
│   │       └── root.tsx
│   └── docs/
├── packages/
│   └── database/
│       ├── prisma/
│       └── src/
└── tooling/
    └── typescript/
```

## Outils recommandés

- **Prisma** pour `.prisma`
- **Tailwind CSS IntelliSense**
- **TypeScript and JavaScript**
- **Prettier**
- **ESLint**

Exemple de `.vscode/settings.json` :

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Étapes suivantes

1. explorer les routes et modules existants ;
2. lire aussi [hooks](./hooks.md), [handling-errors](./handling-errors.md) et
   les autres guides de `apps/docs` ;
3. préparer ensuite le déploiement avec [deployment](./deployment.md) ou
   [docker](./docker.md) selon le contexte.
