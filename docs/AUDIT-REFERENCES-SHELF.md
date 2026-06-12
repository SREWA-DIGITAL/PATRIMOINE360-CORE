# Audit des références historiques Shelf

Date de l'audit : 12 juin 2026

## Objectif

Séparer l'identité publique Patrimoine360 Core des références héritées du
projet d'origine, sans casser le monorepo, les migrations, l'application mobile
ni la synchronisation avec `upstream`.

L'audit initial a identifié 101 fichiers suivis contenant au moins une
référence directe au nom, aux domaines ou aux canaux communautaires de
l'ancien projet, hors lockfile.

## Références remplacées dans ce lot

- README, contribution, code de conduite et notice de licence.
- Badges, liens GitHub, documentation et réseaux sociaux publics.
- Modèles d'issues et descriptions communautaires.
- Identité et navigation du portail de documentation.
- Références visibles dans les surfaces Core sélectionnées.
- Configuration de nettoyage GHCR et validation documentaire.
- Liens Discord, qui ne font pas partie des canaux Patrimoine360.

## Références conservées volontairement

| Catégorie | Exemples | Motif |
| --- | --- | --- |
| Attribution et provenance | URL du projet d'origine, remote `upstream`, historique du fork | Obligations de licence et traçabilité |
| Packages du monorepo | `@shelf/webapp`, `@shelf/database`, `@shelf/docs` | Renommage transversal nécessitant une migration dédiée |
| Symboles internes | `ShelfError`, `makeShelfError`, `shelf.config.ts` | API interne largement utilisée, sans impact sur l'identité publique |
| Base de données | noms de migrations, colonnes historiques, commentaires de compatibilité | Ne pas réécrire l'historique ni risquer une divergence Prisma |
| Mobile natif | projet Xcode, bundle IDs, schémas de deep link | Migration de signature et de distribution à planifier séparément |
| Compatibilité API | en-tête `x-shelf-organization` | Contrat consommé par des clients existants ; remplacement avec période de transition |
| Outils de sécurité | agent et variables `SHELF_SEC_REVIEW_*` | Identifiants d'automatisation ; renommage coordonné requis |
| Références historiques utiles | liens vers une migration ou une pull request amont précise | Source technique qui ne peut pas être remplacée par une URL Core fictive |

## Règles pour les prochains changements

1. Aucun nouveau texte visible ne doit présenter l'ancien nom comme le produit
   courant.
2. Les nouveaux liens publics doivent cibler
   `SREWA-DIGITAL/PATRIMOINE360-CORE`.
3. Aucun canal Discord historique ne doit être réintroduit.
4. Les fonctions documentées dans le README Core doivent être disponibles sans
   module Enterprise.
5. Les identifiants techniques conservés ne doivent être renommés que dans un
   lot de migration dédié avec tests, plan de compatibilité et revue du dépôt
   Enterprise.
6. Les mentions d'attribution et l'URL `upstream` ne doivent pas être
   supprimées.

## Hors périmètre de cet audit

Cet audit n'introduit aucun module Enterprise et ne modifie pas les contrats,
fiches de visite, travaux, imports clients spécialisés, RBAC géographique,
SSO privé, WhatsApp ou mécanismes de licence propriétaire.
