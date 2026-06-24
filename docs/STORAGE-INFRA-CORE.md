# Storage et infrastructure Core

Date : 2026-06-24  
Dépôt cible : `patrimoine360-core`  
Phase liée : [PLAN-OPERATIONNEL-PHASES-8-9.md](./PLAN-OPERATIONNEL-PHASES-8-9.md)

## Décision

Le Core Patrimoine360 conserve officiellement, à ce stade, la pile suivante :

- Better Auth pour l'authentification ;
- Brevo pour les emails transactionnels ;
- PostgreSQL fourni par un projet Supabase ;
- Storage applicatif fourni par Supabase Storage.

La bascule vers MinIO n'est pas abandonnée, mais elle n'est pas encore la
trajectoire supportée du Core Community. Elle devient un chantier ultérieur,
préparé par la phase 8H et à exécuter proprement en phase 9D.

## Ce qui est supporté aujourd'hui

### Stack locale et Community de référence

Le setup officiellement documenté du Core repose sur un projet Supabase externe
qui fournit :

- la base PostgreSQL ;
- les buckets de fichiers ;
- les URL storage déjà attendues par le runtime.

La webapp Patrimoine360, elle, porte :

- les sessions et parcours Better Auth ;
- l'envoi des emails via Brevo ;
- les services métier Core ;
- l'abstraction storage côté code, encore branchée sur l'implémentation
  Supabase.

### Variables d'environnement à conserver

Tant que le provider storage MinIO n'est pas implémenté dans le runtime Core,
les variables suivantes restent nécessaires et normales :

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_PUBLIC`
- `SUPABASE_SERVICE_ROLE`
- `SESSION_SECRET`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_BASE_PATH`
- `EMAIL_PROVIDER`
- `BREVO_API_KEY`

## Ce qui n'est pas encore supporté comme cible officielle

Les points suivants ne doivent pas être vendus comme déjà disponibles dans le
Core :

- un `docker/docker-compose.yml` Community complet ;
- un provider MinIO branché dans le runtime applicatif ;
- une installation totalement autonome sans dépendance Supabase côté storage ;
- une stack on-prem prête à l'emploi avec `app + postgres + minio`.

## Lecture Docker actuelle

Le dépôt contient aujourd'hui des Dockerfiles applicatifs, notamment :

- `apps/webapp/Dockerfile`
- `apps/webapp/Dockerfile.image`

Ils servent à construire l'application, mais ils ne fournissent pas encore à
eux seuls une stack Community complète. En pratique :

- le conteneur app démarre la webapp ;
- PostgreSQL et Storage doivent encore être fournis à l'extérieur ;
- le chemin le plus réaliste aujourd'hui reste Supabase pour ces dépendances.

## Contrat de transition vers MinIO

La future bascule MinIO devra être traitée comme une évolution technique
explicite, pas comme une simple variation de configuration.

Avant de déclarer MinIO supporté dans Core, il faudra au minimum :

1. ajouter un vrai provider storage générique côté runtime ;
2. brancher ce provider sans casser les URLs et usages existants ;
3. définir les variables d'environnement cibles du mode MinIO ;
4. produire une stack `docker/docker-compose.yml` Community ;
5. documenter les buckets, politiques d'accès, signatures d'URL et migration
   des médias.

## Décision de périmètre

### Reste dans la phase 8H

- clarifier la dépendance storage restante ;
- aligner `.env.example` ;
- aligner la doc de setup local ;
- cadrer honnêtement ce que Docker couvre aujourd'hui et ce qu'il ne couvre
  pas encore.

### Part en phase 9D

- création du dossier racine `docker/` ;
- `docker-compose.yml` Community ;
- démarrage coordonné `app + postgres + minio` ;
- trajectoire on-prem reproductible.

## Conclusion

La décision 8H est donc volontairement pragmatique :

- on ne force pas MinIO trop tôt ;
- on assume Supabase Storage comme dépendance restante du Core ;
- on documente clairement la dette technique restante ;
- on prépare une future sortie propre vers Docker Community et MinIO en phase
  9D.
