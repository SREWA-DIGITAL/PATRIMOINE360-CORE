# Prisma, migrations et seed Core

Date de creation : 2026-07-09
Depot cible : `SREWA-DIGITAL/patrimoine360-core`
Statut : Actif

## Objectif

Fixer une convention simple pour les migrations et le seed du Core public,
sans melanger des besoins Enterprise dans la base de reference.

## Source de verite

- schema Prisma :
  [packages/database/prisma/schema.prisma](/C:/dev/patrimoine-360/patrimoine360-core/packages/database/prisma/schema.prisma)
- scripts Prisma :
  [packages/database/package.json](/C:/dev/patrimoine-360/patrimoine360-core/packages/database/package.json)
- seed Core :
  [packages/database/src/seed-core.ts](/C:/dev/patrimoine-360/patrimoine360-core/packages/database/src/seed-core.ts)

## Variables de connexion

### `DATABASE_URL`

Utilisee par le runtime applicatif et Prisma client.

### `DIRECT_URL`

Utilisee pour :

- les migrations Prisma ;
- les connexions qui ne doivent pas passer par le pooler, notamment `pg-boss`.

## Commandes de reference

### Generer Prisma

```bash
pnpm db:generate
```

### Preparer une migration

```bash
pnpm db:prepare-migration
```

Cette commande :

- regenere Prisma ;
- cree la migration en `--create-only` ;
- applique ensuite la protection d'index via `post-migration.ts`.

### Deployer les migrations

```bash
pnpm db:deploy-migration
```

### Seed Core minimal

```bash
pnpm db:seed:core
```

### Variantes staging

```bash
pnpm db:prepare-migration:staging
pnpm db:deploy-migration:staging
pnpm db:seed:core:staging
```

## Contenu du seed Core

Le seed Core est volontairement minimal et idempotent.

Il garantit la presence des donnees de base suivantes :

- roles plateforme `USER` et `ADMIN` ;
- tiers `free`, `tier_1`, `tier_2`, `custom` ;
- `TierLimit` de base pour `free`, `tier_1` et `tier_2`.

Il ne seed pas :

- de donnees client ;
- de workspace de demo ;
- de roles PRD Enterprise ;
- de modules prives.

## Conventions de migration Core

- une migration Core doit rester executable seule ;
- son nom doit rester descriptif et purement technique ;
- elle ne doit pas introduire de contrat Enterprise obligatoire ;
- tout ajout prive reutilisable doit d'abord exister comme extension
  generique ou point d'accroche Core.

## Coexistence Core -> Enterprise

Regle retenue :

- Enterprise etend ;
- Core reste autonome.

Concretement :

- les migrations Core s'appliquent sans depot Enterprise ;
- une extension Enterprise doit arriver dans un depot prive, avec ses propres
  migrations et son propre runbook de synchronisation ;
- le sens de propagation autorise reste `Core -> Enterprise`.

## Verification minimale avant release

Pour un lot qui touche Prisma :

1. `pnpm db:generate`
2. `pnpm db:deploy-migration`
3. `pnpm db:seed:core` si l'environnement en a besoin
4. `pnpm core:validate:min`
