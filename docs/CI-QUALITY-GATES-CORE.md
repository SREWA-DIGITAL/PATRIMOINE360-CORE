# CI et quality gates Core

Date de creation : 2026-07-09
Depot cible : `SREWA-DIGITAL/patrimoine360-core`
Statut : Actif

## Objectif

Standardiser le chemin de validation minimal du Core pour qu'il soit :

- explicite en local ;
- reproductible dans GitHub Actions ;
- aligne sur le runtime reel `webapp + Prisma + PostgreSQL`.

## Version Node de reference

Le depot aligne desormais la version de reference sur :

- `.nvmrc` : `22.20.0`
- `.node-version` : `22.20.0`
- `actions/setup-node` dans la CI : `22.20.0`

Cette version doit etre privilegiee pour les verifications locales et CI.

## Commandes de validation de reference

### Minimum contributif

```bash
pnpm core:validate:min
```

Cette commande delegue aujourd'hui a :

```bash
pnpm webapp:validate
```

Elle couvre :

- generation Prisma ;
- lint webapp ;
- typecheck webapp ;
- tests unitaires webapp.

### Validation CI Core

```bash
pnpm core:validate:ci
```

Elle ajoute au minimum contributif :

- le build applicatif Core.

Equivalent actuel :

```bash
pnpm core:validate:min
pnpm core:build
```

## Workflow GitHub Actions

Le workflow de reference est :

- [.github/workflows/test.yml](/C:/dev/patrimoine-360/patrimoine360-core/.github/workflows/test.yml)

Il sert a la fois :

- en `push` sur `main`, `dev`, `staging` ;
- en `pull_request` ;
- comme workflow reusable pour les flux de deploiement.

## Regles de la CI

### Job `quality`

Le job `quality` :

- provisionne un PostgreSQL local GitHub Actions ;
- applique les migrations Core ;
- execute `pnpm core:validate:min`.

### Job `build`

Le job `build` :

- attend la reussite du job `quality` ;
- execute `pnpm core:build`.

## Variables d'environnement en CI

La CI cherche d'abord des secrets si un appelant veut fournir de vraies valeurs,
mais possede aussi des valeurs de repli non sensibles pour les controles qui ne
necessitent pas d'integration externe reelle.

Exemples de variables alimentees :

- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_SECRET`
- `SERVER_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_PUBLIC`
- `SUPABASE_SERVICE_ROLE`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `MAPTILER_TOKEN`

## Ce que la CI ne promet pas

Ce workflow ne remplace pas encore :

- un run E2E complet avec une vraie boite mail et un storage pleinement
  fonctionnel ;
- des validations Enterprise ;
- un deploiement cible.

Il fournit le filet minimal Core pour attraper :

- regressions TypeScript ;
- regressions Prisma de base ;
- regressions unitaires webapp ;
- build casse.
