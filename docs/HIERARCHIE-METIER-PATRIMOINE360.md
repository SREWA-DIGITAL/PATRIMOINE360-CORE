# Hiérarchie métier Patrimoine360

Date : 2026-06-24
Dépôt cible : `SREWA-DIGITAL/patrimoine360-core`
Statut : Décision de cadrage retenue pour le Core

## Objet

Fixer la stratégie de hiérarchie métier Patrimoine360 pour le Core sans
déclencher de migration Prisma prématurée, tout en restant compatible avec le
PRD et avec la frontière Core / Enterprise.

## Sources prises en compte

- `C:\Users\Tutu\Downloads\PATRIMOINE360_PRD.md`
- `packages/database/prisma/schema.prisma`
- `apps/webapp/app/modules/location/service.server.ts`
- `apps/webapp/app/routes/api+/locations.$locationId.tree.tsx`

## Décision courte

Dans le Core Patrimoine360, `Organization` reste l'entité racine de
segmentation fonctionnelle et de sécurité, tandis que `Location` porte toute la
hiérarchie métier en dessous : direction, site, agence, bâtiment, étage, salle
et autres niveaux utiles.

## Règles retenues

### 1. Frontière `Organization` / `Location`

- `Organization` représente le périmètre de travail sélectionné dans
  l'application.
- Tous les biens, réservations, responsables, rappels et permissions Core
  restent scindés par `organizationId`.
- La hiérarchie métier visible par l'utilisateur est portée par l'arbre
  `Location.parentId -> Location.children`.
- Le Core ne crée pas de nouveau modèle `Site` ou `Entité` à ce stade.

### 2. Règle Core pour CNPS

- Une organisation Core peut représenter `CNPS Côte d'Ivoire`.
- Les nœuds de premier niveau dans `Location` peuvent être :
  `Siège social`, `Direction Abidjan`, `Direction Banlieue`.
- Les niveaux descendants peuvent ensuite détailler :
  `Site`, `Bâtiment`, `Étage`, `Salle`.
- La notion de zone `Abidjan / Banlieue` est traitée comme une convention
  métier de hiérarchie ou de libellé, pas comme un nouveau modèle Prisma.

### 3. Règle Core pour NSIA

- En Core, une organisation représente une entité pays, par exemple
  `NSIA Banque Côte d'Ivoire` ou `NSIA Banque Sénégal`.
- La hiérarchie sous cette organisation est portée par `Location` avec la
  séquence type :
  `Région -> Direction -> Agence -> Bâtiment -> Étage -> Salle`.
- Le niveau `Groupe NSIA Banque` ne devient pas une `Organization` Core
  transverse à plusieurs pays.
- La consolidation multi-pays et la lecture transverse du groupe sont réservées
  à l'Enterprise.

### 4. Ce qui reste hors Core

- RBAC géographique avancé multi-zone.
- Consolidation inter-organisations ou inter-pays.
- Vue groupe transverse au-dessus de plusieurs organisations.
- Restrictions d'accès fines par portefeuille de sites pour des rôles métier
  étendus.

## Compatibilité avec le Core actuel

La décision est compatible avec le code existant :

- `Location` possède déjà une relation récursive `parentId`.
- Le service `getLocationHierarchy()` retourne déjà la chaîne des ancêtres.
- Le service `getLocationDescendantsTree()` retourne déjà l'arbre des
  descendants.
- La profondeur maximale autorisée est `12`, ce qui couvre la cible PRD
  `Pays -> Région -> Direction -> Site -> Bâtiment -> Étage -> Salle`.
- Les routes et composants de détail des sites exploitent déjà breadcrumb et
  vue arborescente.

## Impacts pratiques

### Ce qu'on fait maintenant

- On garde `Organization` comme frontière de données, d'authentification et de
  permissions Core.
- On exploite `Location` comme arbre métier unique pour `Sites & Locaux`.
- On documente des profils hiérarchiques Patrimoine360 pour CNPS et NSIA afin
  d'aligner les futures surfaces UI.

### Ce qu'on ne fait pas maintenant

- Pas de renommage physique massif `Location -> Site`.
- Pas d'ajout d'enum Prisma obligatoire pour typer chaque niveau.
- Pas de migration de données liée à la hiérarchie dans cette phase.
- Pas de refonte des filtres géographiques avancés dans le Core.

## Plan de suite

- Phase `8F` : aligner les permissions Patrimoine360 en respectant cette
  frontière `Organization` / `Location`.
- Phase `8G` : corriger les flux Core visibles qui ne reflètent pas encore
  complètement cette hiérarchie.
- Enterprise : ajouter ensuite les vues groupe, l'accès géographique avancé et
  les consolidations inter-pays.

## Conclusion

Le Core n'a pas besoin d'un nouveau modèle hiérarchique pour être aligné avec
le PRD. La bonne trajectoire consiste à conserver le socle actuel
`Organization + Location`, à spécialiser les profils métier CNPS et NSIA au
niveau applicatif, puis à réserver la hiérarchie transverse complexe à
l'Enterprise.
