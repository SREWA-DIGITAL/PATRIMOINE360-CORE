# Contribuer à Patrimoine360 Core

Merci de contribuer au socle communautaire de Patrimoine360. Les corrections,
tests, améliorations d'accessibilité, traductions et documentations sont aussi
utiles que les nouvelles fonctionnalités.

## Périmètre des contributions

Une contribution au Core doit être :

- générique et utile à plusieurs organisations ;
- compatible avec la licence AGPL-3.0 ;
- exploitable sans module privé Patrimoine360 Enterprise ;
- dépourvue de secret, donnée client ou dépendance propriétaire obligatoire ;
- cohérente avec la frontière décrite dans
  [`docs/PLAN-ALIGNEMENT-PRD.md`](./docs/PLAN-ALIGNEMENT-PRD.md).

Les contrats, fiches de visite, travaux avancés, imports clients spécialisés,
RBAC géographique avancé, SSO Enterprise et notifications WhatsApp restent
hors de ce dépôt.

## Préparer son environnement

Prérequis :

- Node.js `>= 22.20.0` ;
- pnpm `9.15.9` ;
- Git ;
- un environnement Supabase compatible avec l'architecture actuelle.

```bash
git clone https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE.git
cd PATRIMOINE360-CORE
pnpm install --frozen-lockfile
cp .env.example .env
pnpm webapp:setup
```

Ne commettez jamais votre fichier `.env`, une clé API, une sauvegarde ou une
donnée réelle.

## Processus Git

1. Créez une issue ou décrivez clairement le problème traité.
2. Créez une branche courte depuis `main`, par exemple
   `fix/reminder-timezone` ou `feat/location-export`.
3. Limitez le changement au besoin validé.
4. Ajoutez ou adaptez les tests proportionnellement au risque.
5. Exécutez les contrôles pertinents.
6. Utilisez un message de commit conforme à
   [Conventional Commits](https://www.conventionalcommits.org/).
7. Ouvrez une pull request vers `main`.

Exemples :

```text
fix: preserve asset location during custody release
feat: add basic location export
docs: clarify community deployment
```

## Contrôles

Le contrôle complet de l'application web est :

```bash
pnpm webapp:validate
```

Selon le changement, exécutez également :

```bash
pnpm lint
pnpm typecheck
pnpm webapp:test -- --run
pnpm webapp:build
pnpm docs:build
```

Une migration de base doit être préparée avec
`pnpm db:prepare-migration`, revue en SQL, puis testée avant inclusion.
`pnpm db:reset` est destructif.

## Pull requests

La description doit préciser :

- le problème résolu ;
- le comportement avant et après ;
- le périmètre Core concerné ;
- les tests exécutés ;
- les migrations ou variables d'environnement ajoutées ;
- les limites ou risques connus.

Une pull request ne doit pas mélanger refonte générale, renommage massif et
fonctionnalité métier sans nécessité démontrée.

## Synchronisation avec l'amont

Le remote `upstream` référence le projet d'origine afin de recevoir les
correctifs génériques utiles. Une synchronisation amont doit être isolée,
revue et adaptée à la frontière Patrimoine360 Core avant fusion.

Les noms techniques historiques `@shelf/*` sont conservés jusqu'à une migration
dédiée. Ne les renommez pas dans une contribution fonctionnelle ordinaire.

## Conduite et sécurité

Toute participation est soumise au
[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

Ne publiez pas une vulnérabilité dans une issue publique. Utilisez le canal de
signalement privé disponible dans l'onglet **Security** du dépôt.
