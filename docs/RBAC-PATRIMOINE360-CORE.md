# RBAC Patrimoine360 Core

Date : 2026-06-24
Dépôt cible : `SREWA-DIGITAL/patrimoine360-core`
Statut : Décision de cadrage et matrice Core validées

## Objet

Clarifier comment les rôles et permissions du Core Patrimoine360 se projettent
sur la matrice RBAC du PRD, sans faire semblant que l'accès géographique
Enterprise est déjà disponible dans le Core.

## Sources prises en compte

- `C:\Users\Tutu\Downloads\PATRIMOINE360_PRD.md`
- `packages/database/prisma/schema.prisma`
- `apps/webapp/app/utils/roles.server.ts`
- `apps/webapp/app/utils/permissions/permission.data.ts`
- `apps/webapp/app/utils/permissions/permission.validator.server.ts`

## Observation réelle du Core actuel

Le Core actuel utilise deux niveaux de rôles :

- rôle plateforme global : `Roles.ADMIN`
- rôles d'organisation : `OrganizationRoles.OWNER`, `ADMIN`, `BASE`,
  `SELF_SERVICE`

Le contrôle d'accès réel est ensuite affiné par :

- la map `Role2PermissionMap` ;
- le helper serveur `requirePermission()` ;
- deux overrides d'organisation :
  `selfServiceCanSeeBookings`, `selfServiceCanSeeCustody`,
  `baseUserCanSeeBookings`, `baseUserCanSeeCustody`.

## Décision courte

Dans le Core Patrimoine360 :

- `Roles.ADMIN` est l'équivalent du `SUPER_ADMIN` du PRD ;
- `OrganizationRoles.OWNER` et `OrganizationRoles.ADMIN` constituent le rôle
  `ADMIN` du PRD ;
- `OrganizationRoles.SELF_SERVICE` et `OrganizationRoles.BASE` restent des
  rôles opérationnels Core transitoires ;
- les rôles PRD `PILOTE_GRM`, `EVALUATEUR_CIPM` et la vraie granularité
  `RESPONSABLE_SITE` dépendent de l'accès géographique Enterprise et ne doivent
  pas être présentés comme complètement implémentés dans le Core.

## Matrice de projection Core -> PRD

| Référence PRD      | État dans le Core      | Source technique actuelle                              | Décision                                         |
| ------------------ | ---------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `SUPER_ADMIN`      | Disponible             | `Roles.ADMIN`                                          | Supporté                                         |
| `ADMIN`            | Disponible             | `OrganizationRoles.OWNER` ou `OrganizationRoles.ADMIN` | Supporté                                         |
| `PILOTE_GRM`       | Partiel / non finalisé | Aucun rôle natif dédié                                 | Réservé à l'Enterprise ou à une future extension |
| `EVALUATEUR_CIPM`  | Non disponible         | Aucun rôle natif dédié                                 | Enterprise                                       |
| `RESPONSABLE_SITE` | Partiel                | approximation possible via `SELF_SERVICE`              | Ne pas afficher comme pleinement implémenté      |
| `LECTEUR`          | Partiel                | approximation possible via `BASE`                      | Ne pas afficher comme pleinement implémenté      |

## Lecture métier par rôle Core

### 1. `SUPER_ADMIN`

- Porteur technique actuel : `Roles.ADMIN`
- Portée : globale plateforme
- Usage Core : administration transverse, dashboard admin, supervision

### 2. `ADMIN`

- Porteurs techniques actuels : `OrganizationRoles.OWNER` et `ADMIN`
- Portée : une organisation donnée
- Capacités observées :
  - gérer sites ;
  - gérer biens ;
  - gérer affectations ;
  - gérer réservations ;
  - gérer rappels ;
  - gérer rapports ;
  - gérer utilisateurs d'organisation ;
  - gérer paramètres d'organisation.

### 3. `SELF_SERVICE`

- Rôle technique Core existant
- Positionnement : rôle opérationnel terrain
- Capacités observées :
  - lire biens, kits, réservations et QR ;
  - prendre / relâcher certaines affectations ;
  - créer et opérer ses réservations ;
  - check-in / check-out ;
  - accès élargi possible aux affectations et réservations si
    l'organisation l'autorise.

Décision :

- Ce rôle peut servir de base future pour un `RESPONSABLE_SITE` limité ;
- il ne doit pas encore être renommé officiellement en `RESPONSABLE_SITE`,
  car le filtrage par site ou zone n'existe pas encore dans le Core.

### 4. `BASE`

- Rôle technique Core existant
- Positionnement : lecteur opérationnel limité
- Capacités observées :
  - lecture des biens ;
  - lecture et gestion limitée de réservations ;
  - pas de gestion des sites ;
  - pas de rappels ;
  - pas de rapports ;
  - pas de gestion d'utilisateurs.

Décision :

- Ce rôle peut servir de base future à un `LECTEUR` enrichi ;
- il ne doit pas être présenté comme l'équivalent complet du `LECTEUR` PRD
  tant que la matrice de consultation n'est pas alignée.

## Garde-fous retenus

- Ne pas renommer les rôles techniques Core en rôles PRD finaux tant que la
  portée fonctionnelle ne correspond pas réellement.
- Conserver `OWNER` et `ADMIN` comme seule base du rôle `ADMIN` Patrimoine360
  côté Core.
- Réserver `PILOTE_GRM`, `EVALUATEUR_CIPM` et l'accès géographique avancé à
  l'Enterprise.
- Ne pas prétendre que `BASE` ou `SELF_SERVICE` couvrent déjà toute la matrice
  PRD.

## Impacts pour la suite

- Phase `8G` : revoir les flux Core visibles pour refléter ces rôles avec plus
  de cohérence produit.
- Enterprise : introduire les vrais rôles métiers PRD avec `SiteUserAccess` ou
  mécanisme équivalent.
- UI : si des labels métiers sont affichés, ils doivent indiquer qu'il s'agit
  d'une projection Core partielle et non d'une implémentation RBAC complète du
  PRD.

## Conclusion

Le Core dispose déjà d'un RBAC fonctionnel, mais sa sémantique réelle reste
technique et héritée de Shelf. La bonne trajectoire consiste à officialiser :

- `SUPER_ADMIN` via `Roles.ADMIN` ;
- `ADMIN` via `OWNER` / `ADMIN` ;
- `BASE` et `SELF_SERVICE` comme rôles Core transitoires ;
- les rôles métier PRD avancés comme dépendants de l'Enterprise.
