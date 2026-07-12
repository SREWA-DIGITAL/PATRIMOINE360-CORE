# Écarts de flux Core Patrimoine360

Date : 2026-06-24
Dépôt cible : `patrimoine360-core`
Phase liée : [PLAN-OPERATIONNEL-PHASES-8-9.md](./PLAN-OPERATIONNEL-PHASES-8-9.md)

## Objet

Ce document fixe les écarts encore assumés entre le Core Patrimoine360 et le
PRD, après fermeture des trous les plus critiques du parcours métier.

Il sert de référence pour distinguer :

- ce qui est déjà disponible dans le Core ;
- ce qui est seulement partiellement aligné ;
- ce qui doit rester hors Core et partir en Enterprise.

## Vue d'ensemble

| Domaine                                  | État Core au 2026-06-24                                                     | Décision                    |
| ---------------------------------------- | --------------------------------------------------------------------------- | --------------------------- |
| Responsables et affectations             | Point d'entrée dédié disponible via `/custody` + rapport `custody-snapshot` | Conserver dans Core         |
| Historique détaillé des affectations     | Vue courante seulement, sans fin d'affectation métier ni notes structurées  | Écart Core documenté        |
| Rappels                                  | Rappels liés aux biens uniquement                                           | Étendre plus tard si besoin |
| Rapports basiques                        | Disponibles dans Core                                                       | Conserver dans Core         |
| Dashboard consolidé et analytics avancés | Non présents dans Core                                                      | Réserver à Enterprise       |
| RBAC géographique fin                    | Non finalisé dans Core                                                      | Réserver à Enterprise       |

## 1. Responsables et affectations

### Disponible dans le Core

- page dédiée `/custody` pour voir les responsables actifs et les affectations
  récentes ;
- rapport simple `Affectations en cours` ;
- gestion des responsables avec compte et sans compte ;
- affectation opérationnelle d'un bien à un responsable.

### Écart restant par rapport au PRD

- pas encore de vrai journal métier complet avec date de fin d'affectation,
  motif, commentaire et historique reconstituable par période ;
- la vue "qui a quoi par site" existe de manière simple via le rapport et la
  page Core, mais pas encore comme cockpit analytique avancé.

### Décision

Le suivi opérationnel courant des affectations reste dans le Core. Le besoin
d'historique enrichi ou de pilotage consolidé pourra être traité dans une phase
ultérieure, sans rebascule vers Supabase Auth.

## 2. Rappels et alertes

### Disponible dans le Core

- rappels liés aux biens ;
- affichage des rappels à venir sur l'accueil ;
- notifications email déjà recadrées autour de Better Auth + Brevo.

### Écart restant par rapport au PRD

- pas de rappels portés directement par un site ou un local ;
- pas encore de couverture métier explicite pour tous les cas PRD
  (`renouvellement contrat`, `visite`, `contrôle réglementaire`) comme types
  dédiés.

### Décision

Le Core garde les rappels sur biens comme socle minimal utile. L'extension
site/local reste ouverte, mais n'est pas bloquante pour clôturer l'abandon de
Supabase Auth.

## 3. Rapports basiques

### Disponible dans le Core

- inventaire des biens ;
- suivi des réservations ;
- biens inactifs ;
- activité et utilisation ;
- affectations en cours.

### Limite volontaire

Les dashboards consolidés multi-entités, analytics premium, benchmarks et
reporting exécutif ne rentrent pas dans le Core.

### Décision

Les rapports utiles au pilotage quotidien restent dans le Core. Les rapports
premium et consolidés restent réservés à Enterprise.

## 4. Dashboard

### Disponible dans le Core

- accueil avec KPIs simples ;
- réservations actives, retards, rappels à venir ;
- responsables actifs ;
- répartition simple par site.

### Écart restant par rapport au PRD

- pas de dashboard avancé de direction ;
- pas de consolidation groupe/pays ou géographique fine ;
- pas de vues analytiques premium.

### Décision

`/home` reste le dashboard basique du Core. Le dashboard métier consolidé du
PRD reste un sujet Enterprise.

## 5. Frontière Core / Enterprise

### Reste dans Core

- authentification Better Auth ;
- emails transactionnels Brevo ;
- biens, lots, sites, réservations, rappels simples, affectations et rapports
  basiques ;
- RBAC Core standard.

### Reste hors Core

- SSO avancé métier ;
- RBAC géographique complet ;
- contrats, fiches de visite, travaux ;
- imports métier avancés ;
- analytics et dashboards premium.

## Conclusion

La phase 8G ne vise pas à rendre tout le PRD exhaustif dans Core. Elle vise à
fermer les trous critiques des flux Core attendus, puis à documenter sans
ambiguïté ce qui reste volontairement partiel ou réservé à Enterprise.
