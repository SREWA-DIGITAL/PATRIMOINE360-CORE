# Préparation du lot Enterprise privé

Date de création : 2026-07-09
Dépôt cible : `SREWA-DIGITAL/patrimoine360-enterprise`
Statut : Actif

## Objectif

Transformer le volet Enterprise du PRD en backlog exécutable, ordonné par lots
cohérents, sans introduire de module privé dans `patrimoine360-core`.

Ce document sert de point de passage entre :

- le socle générique déjà stabilisé dans Core ;
- les extensions privées à implémenter dans Enterprise ;
- les synchronisations futures `Core -> Enterprise`.

## Rappels de frontière

- sens autorisé : `Shelf.nu upstream -> Patrimoine360 Core -> Patrimoine360 Enterprise`
- Core conserve le socle générique, public et distribuable ;
- Enterprise implémente les adaptateurs, modules et règles privés ;
- un besoin mixte doit d'abord produire un contrat réutilisable dans Core ;
- aucune migration, clé, intégration client ou règle commerciale privée ne doit
  revenir massivement de Enterprise vers Core.

Références utiles :

- [RELEASE-CORE-ET-SYNCHRO-ENTERPRISE.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/RELEASE-CORE-ET-SYNCHRO-ENTERPRISE.md)
- [MATRICE-CORE-ENTERPRISE.md](/C:/dev/patrimoine-360/docs/MATRICE-CORE-ENTERPRISE.md)
- [core-enterprise-boundary.md](/C:/dev/patrimoine-360/.codex/core-enterprise-boundary.md)

## Ordre recommandé des lots Enterprise

### Lot E0 - Garde-fou de licence

Objectif :
poser la porte d'entrée commerciale et technique des fonctions privées.

Périmètre :

- activation des modules Enterprise par licence ou feature flag privé ;
- convention unique pour masquer routes, menus et actions privées ;
- journalisation minimale des vérifications de licence ;
- comportement dégradé explicite si la licence manque ou expire.

Dépendances Core :

- Better Auth et organisation Core ;
- base de rôles et de permissions Core ;
- configuration d'environnement déjà stabilisée.

Sortie attendue :

- tous les modules Enterprise peuvent être branchés derrière un même garde-fou ;
- aucune route privée n'est visible sans contrat de licence explicite.

### Lot E1 - SSO et provisioning

Objectif :
ajouter l'accès entreprise fédérable sans casser le chemin Core standard.

Périmètre :

- SSO SAML/OIDC ;
- mapping des utilisateurs, domaines et groupes ;
- provisioning ou rattachement à une organisation ;
- règles de fallback admin local non-SSO.

Dépendances :

- Lot E0 ;
- Better Auth et les flux d'identité déjà posés dans Core ;
- conventions RBAC Core pour préparer le mapping Enterprise.

Point de passage Core -> Enterprise :

- conserver dans Core uniquement les points d'extension auth génériques ;
- implémenter dans Enterprise la configuration IdP, le mapping avancé et les
  règles commerciales associées.

### Lot E2 - Contrats et prestataires

Objectif :
ouvrir le premier module métier privé à forte valeur, sur la base des sites et
des organisations déjà gérés par Core.

Périmètre :

- contrats ;
- prestataires ;
- corps de métier ;
- historique contractuel et suivi de performance ;
- pièces jointes et décisions contractuelles privées.

Dépendances :

- Lot E0 ;
- sites, biens, organisations et utilisateurs Core ;
- extension Prisma ou schéma privé côté Enterprise.

Point de passage Core -> Enterprise :

- Core garde les références génériques `site`, `organization`, `user` ;
- Enterprise ajoute les modèles `Contrat`, `CorpsDeMetier`,
  `HistoriqueContrat` et la logique de pilotage associée.

### Lot E3 - Fiches de visite

Objectif :
mettre en place le flux d'inspection métier sur les sites avec calculs et
constats privés.

Périmètre :

- fiche de visite ;
- lignes d'évaluation par corps de métier ;
- constats, recommandations et urgences ;
- acteurs métier privés de type `Pilote GRM` ou `Evaluateur CIPM`.

Dépendances :

- Lot E2 pour réutiliser les corps de métier ;
- sites et utilisateurs Core ;
- conventions de pièce jointe et d'audit existantes.

Point de passage Core -> Enterprise :

- Core fournit les entités de base `site`, `asset`, `organization`, `user` ;
- Enterprise porte le formulaire métier, les calculs de score et les rôles
  opérationnels avancés.

### Lot E4 - Travaux et maintenance

Objectif :
relier les actions correctives aux contrats et aux visites sans encombrer Core
avec des workflows propriétaires.

Périmètre :

- demandes de travaux ;
- suivi d'avancement ;
- budget, prestataire, bons de commande ;
- pièces jointes, preuves et historique de progression.

Dépendances :

- Lot E2 ;
- Lot E3 ;
- conventions de stockage et de fichiers déjà disponibles.

Point de passage Core -> Enterprise :

- Core garde les mécanismes génériques de fichier et d'affectation ;
- Enterprise implémente les statuts travaux, la logique budgétaire et les
  liaisons `contrat <-> visite <-> travaux`.

### Lot E5 - Dashboard avance

Objectif :
exposer la valeur consolidée une fois les données métier privées stabilisées.

Périmètre :

- indicateurs multi-sites ;
- synthèse contrats, visites et travaux ;
- vues exécutives et alertes consolidées ;
- filtres géographiques ou organisationnels privés.

Dépendances :

- Lots E2, E3 et E4 ;
- conventions de seed, reporting et permissions.

Point de passage Core -> Enterprise :

- Core conserve les primitives UI et data génériques ;
- Enterprise compose les KPI propriétaires, les agrégats et les lectures
  exécutives.

### Lot E6 - Import / export Excel CNPS

Objectif :
industrialiser le cas métier CNPS après stabilisation des modèles privés.

Périmètre :

- mapping Excel métier ;
- import assisté et contrôles de conformité ;
- export format métier ;
- gestion des erreurs, rejets et journal d'import.

Dépendances :

- Lots E2, E3, E4 et E5 ;
- schémas privés stabilisés ;
- conventions de fichiers et de traces.

Point de passage Core -> Enterprise :

- Core peut garder des utilitaires d'import/export génériques si réutilisables ;
- Enterprise contient les formats CNPS, les mappings métier et les règles
  spécifiques.

### Lot E7 - Notifications WhatsApp

Objectif :
ajouter la couche de notification privée seulement quand les événements métier
et les règles de licence sont stables.

Perimetre :

- envoi WhatsApp sur événements sélectionnés ;
- templates privés ;
- journalisation d'envoi et reprise d'erreur ;
- règles d'opt-in, quotas et priorités métier.

Dépendances :

- Lot E0 ;
- événements stabilisés des lots E2 à E5 ;
- politique de notifications e-mail déjà posée dans Core.

Point de passage Core -> Enterprise :

- Core conserve le catalogue d'e-mails transactionnels et les abstractions de
  notification réutilisables ;
- Enterprise ajoute le provider WhatsApp, les templates et les règles de
  déclenchement privées.

## Résumé de priorisation

1. `Licence`
2. `SSO`
3. `Contrats`
4. `Fiches de visite`
5. `Travaux`
6. `Dashboard avance`
7. `Excel CNPS`
8. `WhatsApp`

Pourquoi cet ordre :

- `Licence` et `SSO` sécurisent l'accès et la commercialisation ;
- `Contrats`, `Fiches de visite` puis `Travaux` construisent la chaîne métier ;
- `Dashboard avance` arrive une fois la donnée fiable ;
- `Excel CNPS` et `WhatsApp` se branchent en dernier sur des modèles déjà
  stables.

## Conventions de lot pour le dépôt Enterprise

Chaque lot Enterprise doit inclure les sections suivantes :

- objectif métier ;
- périmètre exact et hors périmètre ;
- prérequis Core et point de synchronisation source ;
- extension Prisma ou schéma privé concerné ;
- variables, secrets et intégrations externes ;
- rôles et permissions spécifiques ;
- jeux de données de démo ou seed privé ;
- tests attendus : unitaires, intégration, smoke ;
- stratégie de déploiement et rollback ;
- critères de fin du lot.

## Contrats Core à surveiller avant implémentation Enterprise

Avant d'ouvrir un lot privé, vérifier que Core fournit déjà ou peut fournir sans
pollution privée :

- authentification Better Auth et rattachement organisationnel ;
- fichiers, pièces jointes et stockage ;
- points d'extension notification ;
- primitives RBAC génériques ;
- socle Docker, CI, migrations et release ;
- entites publiques `Organization`, `Site`, `Asset`, `User`, `Booking`,
  `Reminder`, `Audit`.

Si un lot Enterprise dépend d'un contrat absent dans Core :

1. documenter l'écart ;
2. porter d'abord le socle générique dans Core ;
3. synchroniser ensuite vers Enterprise ;
4. terminer l'adaptateur privé dans Enterprise.

## Définition de prêt pour le dépôt Enterprise

Le lot Enterprise privé est considéré prêt quand :

- chaque module a un ordre d'implémentation explicite ;
- les dépendances inter-modules sont connues ;
- la frontière Core / Enterprise est claire pour chaque lot ;
- les points de passage Core à synchroniser sont identifiés ;
- le dépôt Enterprise peut ouvrir ses branches sans dépendance implicite au
  dépôt Core.
