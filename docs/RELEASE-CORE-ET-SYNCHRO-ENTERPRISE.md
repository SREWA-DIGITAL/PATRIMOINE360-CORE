# Release Core et synchronisation Enterprise

Date de creation : 2026-07-09
Depot cible : `SREWA-DIGITAL/patrimoine360-core`
Statut : Actif

## Objectif

Formaliser un chemin simple pour :

- livrer `patrimoine360-core` ;
- conserver une synchronisation volontaire vers `patrimoine360-enterprise` ;
- eviter tout melange entre le depot public et les modules prives.

## Rappels de frontiere

- sens autorise : `Shelf.nu upstream -> Patrimoine360 Core -> Patrimoine360 Enterprise`
- ne jamais pousser Core vers `upstream`
- ne jamais fusionner Enterprise globalement vers Core
- tout correctif partageable doit naitre dans Core, puis etre propage vers
  Enterprise

## Procedure de release Core

### 1. Verifier le lot

Depuis `patrimoine360-core` :

```bash
pnpm core:validate:min
pnpm core:build
```

Si le lot touche Prisma :

```bash
pnpm db:deploy-migration
pnpm db:seed:core
```

Si le lot touche les flux critiques UI/auth :

```bash
pnpm webapp:test:e2e:smoke
```

### 2. Verifier la branche cible

Les branches de livraison usuelles sont :

- `staging` pour l'image GHCR `:staging`
- `main` pour la ligne de production

### 3. Publier le code

Exemple staging :

```bash
git checkout staging
git merge --no-ff <branche-source>
git push origin staging
```

### 4. Laisser GitHub Actions produire l'image

Le workflow image de reference est :

- [.github/workflows/build.yml](/C:/dev/patrimoine-360/patrimoine360-core/.github/workflows/build.yml)

Tags attendus :

- `ghcr.io/srewa-digital/patrimoine360-core:staging`
- `ghcr.io/srewa-digital/patrimoine360-core:staging-<sha>`
- `ghcr.io/srewa-digital/patrimoine360-core:latest` pour `main`

### 5. Deployer la cible

Pour staging Dockploy, suivre :

- [DEPLOIEMENT-STAGING-DOCKPLOY.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/DEPLOIEMENT-STAGING-DOCKPLOY.md)

## Checklist de synchronisation vers Enterprise

Une fois le lot Core stabilise :

1. identifier le commit Core source ;
2. verifier que le diff ne contient aucun secret ni module client prive ;
3. propager uniquement les fichiers reutilisables ;
4. adapter ensuite les extensions privees uniquement dans Enterprise ;
5. tracer le point de synchronisation dans la documentation ou le changelog
   interne Enterprise.

## Ce qui peut partir vers Enterprise

- fixes generiques de services ;
- migrations ou contrats Prisma partageables ;
- composants UI et wording Core-first ;
- documentation d'exploitation generique ;
- garde-fous auth, e-mail, CI, Docker ou release reutilisables.

## Ce qui ne doit pas repartir depuis Enterprise vers Core sans filtrage

- contrats prives ;
- modules metier proprietaires ;
- clefs, endpoints client, specificites d'exploitation privees ;
- RBAC geographique avance ;
- SSO ou licence privee couples a un depot Enterprise.

## Decision de release 9E

Le Core est considere comme livrable si :

- ses validations minimales passent ;
- ses migrations sont explicites ;
- son image ou son build cible est reproductible ;
- sa propagation vers Enterprise reste separee et tracee.
