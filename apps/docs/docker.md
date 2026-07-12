# Docker

> [!IMPORTANT]
> Le chemin Docker actuel pour Patrimoine360 Core lance l'application et une
> base PostgreSQL locale, mais ne fournit pas encore un remplacement complet de
> Supabase Storage. Le stockage de fichiers reste donc une dépendance externe
> explicite.

## Stack Community locale

Une stack compose racine est disponible :

- [docker/docker-compose.yml](/C:/dev/patrimoine-360/patrimoine360-core/docker/docker-compose.yml)
- [docker/core.env.example](/C:/dev/patrimoine-360/patrimoine360-core/docker/core.env.example)
- [docker/core.host.env.example](/C:/dev/patrimoine-360/patrimoine360-core/docker/core.host.env.example)

Elle fournit :

- un conteneur PostgreSQL local ;
- la webapp Patrimoine360 Core construite depuis
  `apps/webapp/Dockerfile.image`.

Elle ne fournit pas encore :

- un MinIO intégré ;
- un remplacement self-hosted déjà branché pour Supabase Storage.

## Démarrage rapide

```bash
cp docker/core.env.example docker/core.env
cp docker/core.host.env.example docker/core.host.env
pnpm docker:core:up
```

Puis, depuis la racine du dépôt :

```bash
pnpm db:deploy-migration:docker
pnpm db:seed:core:docker
```

## Rôle des deux fichiers d'environnement

- `docker/core.env` alimente le conteneur applicatif ;
- `docker/core.host.env` alimente les commandes Prisma exécutées depuis
  l'hôte contre PostgreSQL local.

## Prérequis

Avant d'utiliser Docker :

1. préparer votre environnement avec [local-development](./local-development.md)
2. configurer Supabase avec [supabase-setup](./supabase-setup.md)

Le runtime Core a encore besoin d'un backend compatible pour le stockage et
pour certaines variables de plateforme.

## Lancement manuel via `docker run`

```bash
docker run -d \
  --name "patrimoine360-core" \
  -e "DATABASE_URL=postgres://USER:PASSWORD@HOST:6543/DB_NAME?pgbouncer=true" \
  -e "DIRECT_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME" \
  -e 'SUPABASE_ANON_PUBLIC=your-anon-public-key' \
  -e 'SUPABASE_SERVICE_ROLE=your-service-role-key' \
  -e 'SUPABASE_URL=https://your-instance-name.supabase.co' \
  -e 'SESSION_SECRET=super-duper-s3cret' \
  -e 'SERVER_URL=http://localhost:3000' \
  -e 'BETTER_AUTH_SECRET=replace-with-a-long-random-secret' \
  -e 'BETTER_AUTH_URL=http://localhost:3000' \
  -e 'BETTER_AUTH_BASE_PATH=/api/auth' \
  -e 'EMAIL_PROVIDER=brevo' \
  -e 'BREVO_API_KEY=xkeysib-your-brevo-api-key' \
  -e 'BREVO_SENDER_EMAIL=support@your-domain.com' \
  -e 'BREVO_SENDER_NAME=Patrimoine360' \
  -e 'EMAIL_REPLY_TO=support@your-domain.com' \
  -e 'EMAIL_REPLY_TO_NAME=Support Patrimoine360' \
  -e 'BREVO_TIMEOUT_SECONDS=30' \
  -e 'MAPTILER_TOKEN=your-maptiler-token' \
  -e 'INVITE_TOKEN_SECRET=another-super-duper-s3cret' \
  -p 3000:8080 \
  --restart unless-stopped \
  ghcr.io/srewa-digital/patrimoine360-core:staging
```

Remplacez les placeholders par vos vraies valeurs :

- `USER`, `PASSWORD`, `HOST`, `DB_NAME`
- clés Supabase
- secrets Better Auth
- configuration Brevo

## Limite assumée du Core aujourd'hui

Le chemin Docker est volontairement honnête :

- PostgreSQL peut tourner localement ;
- le stockage reste externe ;
- la frontière Community / Enterprise n'est pas mélangée dans cette stack.

## Staging et Dockploy

Pour les environnements staging limités en ressources, préférez le flux GHCR
documenté dans
[DEPLOIEMENT-STAGING-DOCKPLOY.md](/C:/dev/patrimoine-360/patrimoine360-core/docs/DEPLOIEMENT-STAGING-DOCKPLOY.md) :

1. build de l'image dans GitHub Actions ;
2. push vers GHCR ;
3. pull de l'image finie par Dockploy.

## Développement autour des Dockerfiles

Attention au Dockerfile ciblé :

- `apps/webapp/Dockerfile` pour certains chemins Fly.io ;
- `apps/webapp/Dockerfile.image` pour l'image GHCR et la stack locale.

### Construire l'image locale

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag patrimoine360-core-local \
  --file apps/webapp/Dockerfile.image .
```

### Exécuter l'image construite localement

```bash
docker run -d \
  --name "patrimoine360-core" \
  -e DATABASE_URL="your-database-url" \
  -e DIRECT_URL="your-direct-url" \
  -e SUPABASE_URL="your-supabase-url" \
  patrimoine360-core-local
```

## ARM64

Le support ARM64 est possible.

### Linux

```bash
docker run -it --rm --entrypoint /usr/bin/uname ghcr.io/srewa-digital/patrimoine360-core:staging -a
```

### macOS Apple Silicon

```bash
docker run -it --rm --platform linux/arm64 --entrypoint /usr/bin/uname ghcr.io/srewa-digital/patrimoine360-core:staging -a
```
