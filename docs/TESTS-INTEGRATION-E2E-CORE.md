# Tests integration et E2E Core

Date de creation : 2026-07-09
Depot cible : `SREWA-DIGITAL/patrimoine360-core`
Statut : Actif

## Objectif

Identifier le noyau des scenarios Core qui doivent disposer d'un filet
automatique avant livraison.

## Commandes de reference

### Unitaires / integration legere

```bash
pnpm core:validate:min
```

### Smoke E2E prioritaire

```bash
pnpm webapp:test:e2e:smoke
```

Le script pointe aujourd'hui vers :

- [apps/webapp/test/e2e/smoke.spec.ts](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/test/e2e/smoke.spec.ts)

## Configuration Playwright

La configuration de reference est :

- [apps/webapp/playwright.config.ts](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/playwright.config.ts)

Points fixes retenus :

- `testDir` sur `test/e2e` ;
- `baseURL` overridable via `PLAYWRIGHT_BASE_URL` ;
- `webServer.command` overridable via `PLAYWRIGHT_WEB_SERVER_COMMAND` ;
- reporter `github + html` en CI, `html` en local.

## Scenarios prioritaires Core

### Lot 1 - critiques immediats

- auth : ouverture de session / inscription ;
- onboarding minimal ;
- creation d'un bien ;
- creation d'une categorie ;
- creation d'un responsable ;
- affectation et liberation d'un bien.

### Lot 2 - a automatiser ensuite

- invitation utilisateur ;
- reset password ;
- changement d'email ;
- permissions `OWNER`, `ADMIN`, `BASE`, `SELF_SERVICE` ;
- reservation simple ;
- audit simple.

## Politique minimale de non-regression

Avant une release Core impactante, verifier au minimum :

1. `pnpm core:validate:min`
2. `pnpm core:build`
3. `pnpm webapp:test:e2e:smoke` si le lot touche auth, onboarding ou surfaces
   critiques du coeur applicatif

## Limites connues

Le smoke E2E actuel n'est pas encore une couverture complete du produit :

- il ne couvre pas toute la matrice RBAC ;
- il depend toujours d'un environnement local capable de delivrer le flux
  d'auth et les e-mails de test ;
- il ne remplace pas un run manuel staging sur les flux sensibles.

## Decision

La cible 9C retenue pour le Core est pragmatique :

- un smoke E2E prioritaire stabilise ;
- une liste explicite des flux suivants a industrialiser ;
- pas de promesse de couverture exhaustive avant le depot Enterprise.
