<p align="center">
  <img width="100%" src="./docs/assets/patrimoine360-core-banner.png" alt="Patrimoine360 Core - gestion communautaire des sites et des biens" />
</p>

<h1 align="center">Patrimoine360 Core</h1>

<p align="center">
  Plateforme communautaire de gestion des sites, locaux, biens et équipements.
</p>

<p align="center">
  <a href="https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE/blob/main/LICENSE"><img src="https://img.shields.io/github/license/SREWA-DIGITAL/PATRIMOINE360-CORE?label=Licence" alt="Licence AGPL-3.0" /></a>
  <a href="https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE/actions/workflows/test.yml"><img src="https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE/actions/workflows/test.yml/badge.svg" alt="Tests" /></a>
  <a href="https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE/stargazers"><img src="https://img.shields.io/github/stars/SREWA-DIGITAL/PATRIMOINE360-CORE" alt="Étoiles GitHub" /></a>
</p>

<p align="center">
  <a href="https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE"><b>GitHub</b></a>
  &middot;
  <a href="./apps/docs/index.md"><b>Documentation</b></a>
  &middot;
  <a href="https://twitter.com/Patrimoine360"><b>Twitter</b></a>
</p>

---

Patrimoine360 Core est le socle public AGPL de Patrimoine360. Il aide les
organisations à remplacer les fichiers dispersés par un référentiel commun
pour savoir quels biens elles possèdent, où ils se trouvent, qui en est
responsable et quand une action doit être menée.

Le produit vise en priorité les organisations d'Afrique de l'Ouest qui gèrent
des sites, des locaux, du mobilier, des véhicules, du matériel informatique ou
des équipements techniques.

## Fonctionnalités Core

- **Tableau de bord** : indicateurs de patrimoine, biens récents, sites,
  affectations, réservations et rappels.
- **Sites et locaux** : hiérarchie de lieux, informations de localisation,
  notes, activité et rattachement des biens.
- **Biens et équipements** : inventaire, catégories, tags, images, états,
  valeurs, numéros de série et champs personnalisés.
- **QR codes et codes-barres** : génération, impression et lecture depuis le
  web ou l'application compagnon.
- **Responsables et affectations** : attribution d'un bien à un collaborateur,
  historique de garde et restitution.
- **Réservations** : planification, sortie, retour, retour partiel,
  annulation, calendrier et prévention des conflits.
- **Rappels** : échéances liées aux biens, notifications et suivi des actions.
- **Rapports simples** : inventaire, activité, utilisation, réservations,
  retards et affectations, avec exports.
- **Import et export** : intégration de données en masse et extraction pour
  analyse.
- **Gestion d'équipe** : organisations, membres et permissions de base.
- **Application compagnon** : consultation, scan et opérations terrain sur
  les fonctions Core compatibles.

## Hors périmètre

Ce dépôt public ne contient pas les extensions propriétaires Patrimoine360
Enterprise : contrats et prestataires, fiches de visite, travaux et
maintenance avancée, analyses consolidées, import CNPS spécialisé, RBAC
géographique avancé, SSO Enterprise et notifications WhatsApp.

## État technique

Le projet est un fork maintenu de Shelf.nu. Les noms techniques historiques
comme `@shelf/database`, certains chemins internes et des identifiants mobiles
sont conservés temporairement pour éviter une migration destructive. Ils ne
définissent plus l'identité publique du produit.

| Couche | Technologie actuelle |
| --- | --- |
| Application web | React Router 7, React 19, Hono |
| Langage | TypeScript |
| Base de données | PostgreSQL via Supabase |
| ORM | Prisma 6 |
| Interface | Tailwind CSS et composants Radix UI |
| Tâches asynchrones | pg-boss |
| Monorepo | pnpm et Turborepo |
| Tests | Vitest et Playwright |
| Application mobile | Expo et React Native |

La migration vers une authentification et un stockage entièrement autonomes
est une cible du PRD, pas une capacité déjà livrée.

## Démarrage local

### Prérequis

- Node.js `>= 22.20.0`
- pnpm `9.15.9`
- Un projet Supabase pour l'architecture actuelle

```bash
git clone https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE.git
cd PATRIMOINE360-CORE
pnpm install --frozen-lockfile
cp .env.example .env
```

Renseignez les variables de `.env`, puis lancez :

```bash
pnpm webapp:setup
pnpm webapp:dev
```

L'application est ensuite accessible à l'adresse indiquée par le serveur de
développement, généralement `https://localhost:3000`.

## Commandes principales

| Commande | Usage |
| --- | --- |
| `pnpm webapp:dev` | Démarrer l'application web |
| `pnpm webapp:build` | Construire l'application |
| `pnpm webapp:test -- --run` | Exécuter les tests web |
| `pnpm webapp:validate` | Génération Prisma, tests, lint et typecheck |
| `pnpm db:generate` | Générer le client Prisma |
| `pnpm db:prepare-migration` | Préparer une migration |
| `pnpm db:deploy-migration` | Appliquer les migrations |
| `pnpm docs:dev` | Démarrer la documentation |
| `pnpm companion:dev` | Démarrer l'application compagnon |

`pnpm db:reset` est destructif et ne doit pas être utilisé sans sauvegarde ni
validation explicite.

## Structure

```text
apps/
  webapp/       Application web et API
  companion/    Application mobile compagnon
  docs/         Documentation développeur
packages/
  database/     Schéma Prisma, migrations et client partagé
tooling/
  typescript/   Configurations TypeScript partagées
docs/           Décisions produit, périmètre et audits
```

## Contribuer

Les contributions au Core sont les bienvenues. Consultez
[`CONTRIBUTING.md`](./CONTRIBUTING.md) avant d'ouvrir une pull request.

Toute proposition doit rester générique et communautaire. Une fonctionnalité
réservée à un client, une intégration propriétaire ou un module Enterprise ne
doit pas être ajouté à ce dépôt.

## Licence et attribution

Patrimoine360 Core est distribué sous licence
[GNU AGPL v3](./LICENSE). Le projet est dérivé de Shelf.nu, également publié
sous AGPL-3.0. Les mentions d'origine et de modification sont précisées dans
[`NOTICE.md`](./NOTICE.md).

La bannière actuelle est provisoire et sera remplacée lors de la finalisation
de l'identité visuelle.
