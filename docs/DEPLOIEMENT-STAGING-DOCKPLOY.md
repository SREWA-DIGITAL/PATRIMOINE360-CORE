# Runbook deploiement staging avec GHCR et Dockploy

Date de creation : 2026-06-26
Depot cible : `SREWA-DIGITAL/patrimoine360-core`
Statut : Actif

## Objectif

Deployer `patrimoine360-core` en `staging` sans builder sur le serveur cible.

Le principe retenu est :

1. GitHub Actions build l'image Docker.
2. GitHub pousse l'image vers GHCR.
3. Dockploy tire l'image deja construite et la demarre.

Ce flux evite les builds lents sur le serveur et reduit fortement les risques
de saturation CPU/RAM pendant un deploiement.

## Image de reference

Le workflow GHCR est defini dans
[.github/workflows/build.yml](/C:/dev/patrimoine-360/patrimoine360-core/.github/workflows/build.yml).

Pour la branche `staging`, il publie des tags du type :

- `ghcr.io/srewa-digital/patrimoine360-core:staging`
- `ghcr.io/srewa-digital/patrimoine360-core:staging-<sha>`

Le Dockerfile utilise pour GHCR est
[apps/webapp/Dockerfile.image](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/Dockerfile.image).

## Pourquoi cette option

- le serveur staging ne build plus le monorepo ;
- le temps long de `turbo build` et `react-router build` est deplace vers GitHub
  Actions ;
- Dockploy fait seulement `pull + run`, donc le deploiement est plus stable ;
- on garde un tag immuable par commit (`staging-<sha>`) et un tag pratique
  (`staging`) pour les mises a jour simples.

## Preconditions

Avant le premier deploiement staging, verifier :

1. La branche `staging` existe dans le depot distant.
2. GitHub Actions est actif sur le repo.
3. GHCR est accessible depuis Dockploy.
4. La base staging et le storage staging sont deja provisionnes.
5. Les variables Better Auth, Brevo et Supabase/PostgreSQL sont pretes.

## Variables d'environnement minimales

Utiliser comme base
[.env.example](/C:/dev/patrimoine-360/patrimoine360-core/.env.example).

Le minimum utile en staging est :

```env
DATABASE_URL=postgres://...
DIRECT_URL=postgres://...
SESSION_SECRET=...
SERVER_URL=https://staging.votre-domaine.tld

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_PUBLIC=...
SUPABASE_SERVICE_ROLE=...

BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://staging.votre-domaine.tld
BETTER_AUTH_BASE_PATH=/api/auth

EMAIL_PROVIDER=brevo
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=Patrimoine360
EMAIL_REPLY_TO=...
EMAIL_REPLY_TO_NAME=Support Patrimoine360

INVITE_TOKEN_SECRET=...
SUPPORT_EMAIL=support@votre-domaine.tld
ADMIN_EMAIL=admin@votre-domaine.tld
LICENSE_TYPE=core
ENABLE_PREMIUM_FEATURES=false
```

Notes importantes :

- `SERVER_URL` et `BETTER_AUTH_URL` doivent pointer vers l'URL publique
  `staging` exacte ;
- le conteneur ecoute sur le port `8080` ;
- aucun override de commande n'est requis, l'image lance deja
  `./build/server/index.js` via
  [docker-entrypoint.sh](/C:/dev/patrimoine-360/patrimoine360-core/apps/webapp/docker-entrypoint.sh).

## Configuration GHCR pour Dockploy

Si le package GHCR est prive, Dockploy doit disposer d'identifiants de lecture.

Option recommandee :

- creer un token GitHub dedie avec `read:packages` ;
- configurer ce token comme identifiant de registre prive dans Dockploy ;
- utiliser `ghcr.io` comme registre.

Exemple de parametrage registre dans Dockploy :

- Registry: `ghcr.io`
- Username: votre utilisateur ou organisation GitHub
- Password / Token: PAT avec `read:packages`

## Configuration de l'application dans Dockploy

Creer l'application staging a partir d'une image existante :

- Source: `Image`
- Image: `ghcr.io/srewa-digital/patrimoine360-core:staging`
- Port interne: `8080`
- Healthcheck path: `/healthcheck`
- Restart policy: `unless-stopped`

Points de vigilance :

- ne pas demander a Dockploy de build depuis le repo ;
- ne pas surcharger l'entrypoint ;
- ne pas monter de volume applicatif inutile, l'app est stateless ;
- la persistance reste dans PostgreSQL et Supabase Storage.

## Procedure premier deploiement

### 1. Appliquer les migrations staging

Depuis le depot local :

```powershell
cd C:\dev\patrimoine-360\patrimoine360-core
pnpm db:deploy-migration:staging
```

Cette etape est a faire avant le premier lancement de la nouvelle image si le
schema staging n'est pas deja a jour.

### 2. Publier l'image staging

Pousser la branche `staging` :

```powershell
git checkout staging
git push origin staging
```

Attendre la fin du workflow
[.github/workflows/build.yml](/C:/dev/patrimoine-360/patrimoine360-core/.github/workflows/build.yml).

### 3. Verifier le package GHCR

Confirmer qu'une image `staging` est disponible :

- `ghcr.io/srewa-digital/patrimoine360-core:staging`
- ou un tag immuable `staging-<sha>`

### 4. Deployer dans Dockploy

Dans Dockploy :

1. ouvrir l'application `staging` ;
2. verifier l'image `ghcr.io/srewa-digital/patrimoine360-core:staging` ;
3. verifier les variables d'environnement ;
4. lancer le redeploiement.

## Procedure de mise a jour normale

Pour les versions suivantes :

1. merger les changements vers `staging` ;
2. pousser `staging` sur GitHub ;
3. attendre la publication GHCR ;
4. relancer le redeploiement Dockploy ;
5. verifier le healthcheck et le login.

## Verification post-deploiement

Verifier dans cet ordre :

1. `GET /healthcheck` repond `200`.
2. la page `/login` charge correctement.
3. un compte de test peut se connecter.
4. les emails Better Auth partent via Brevo.
5. un upload fichier simple fonctionne.
6. les pages critiques Core se chargent sans erreur serveur.

## Ce qu'il ne faut pas faire

- ne pas builder l'image sur le serveur Dockploy si on veut un staging stable ;
- ne pas deployer une image non publiee sur GHCR ;
- ne pas oublier les migrations Prisma ;
- ne pas reutiliser aveuglement les variables `localhost` en staging ;
- ne pas supposer que Supabase Auth existe encore sur le flux principal.

## Strategie recommandee

Pour un staging fluide et repetable :

- branche de reference : `staging`
- image de reference : `ghcr.io/srewa-digital/patrimoine360-core:staging`
- deploiement : Dockploy en mode `pull image`
- migration : `pnpm db:deploy-migration:staging` avant rollout si schema modifie

## Resultat attendu

Quand ce runbook est respecte :

- GitHub build l'image a la place du serveur ;
- Dockploy ne subit plus la lourdeur du build monorepo ;
- le staging se redeploie avec beaucoup moins de friction ;
- on garde un chemin propre pour evoluer ensuite vers production.
