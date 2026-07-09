# Docker

> [!NOTE]
> The Docker configuration for shelf.nu is an effort powered by people within the community, done by [@anatolinicolae](https://github.com/anatolinicolae). Shelf Asset Management Inc. does not yet provide official support for Docker, but we will accept fixes and documentation at this time. Use at your own risk.

> [!IMPORTANT]
> The current Docker path builds and runs the application container only.
> It does not yet provide a fully self-hosted Core stack with bundled storage.
> For Patrimoine360 Core today, Docker can now launch the webapp with a local
> PostgreSQL service, but file storage still expects explicit Supabase
> configuration.

## Community Compose Stack

A root compose stack is now available for local Core exploitation:

- [docker/docker-compose.yml](/C:/dev/patrimoine-360/patrimoine360-core/docker/docker-compose.yml)
- [docker/core.env.example](/C:/dev/patrimoine-360/patrimoine360-core/docker/core.env.example)

This stack provides:

- a local PostgreSQL container;
- the Patrimoine360 Core webapp built from `apps/webapp/Dockerfile.image`.

It still does **not** provide:

- a MinIO runtime integrated in Core;
- a self-hosted replacement for Supabase Storage already wired in the app.

### Quick start

```bash
cp docker/core.env.example docker/core.env
cp docker/core.host.env.example docker/core.host.env
pnpm docker:core:up
```

Then apply migrations and the minimal Core seed from the repository root:

```bash
pnpm db:deploy-migration:docker
pnpm db:seed:core:docker
```

The split between `core.env` and `core.host.env` is intentional:

- `docker/core.env` feeds the application container;
- `docker/core.host.env` feeds Prisma commands launched from the host against
  the local PostgreSQL container on `127.0.0.1:5432`.

## Prerequisites

> [!IMPORTANT]
> If you want to run shelf via docker, there are still some prerequisites you need to meet. The current Docker setup does not yet self-host PostgreSQL or file storage for you. You still need to configure an external Supabase project, run migrations against that database, and keep Supabase Storage available for runtime uploads.

1. [Local Development Guide](./local-development.md) - Setup your development environment
2. [Supabase Setup Guide](./supabase-setup.md) - Configure your database and current Core storage/auth prerequisites

This will make sure you have a database and storage backend that the current
Core runtime can connect to.

## Instructions

1. Make sure you have Docker installed on your machine
2. Use the `docker run` command and replace your environment variables:

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

> [!NOTE]
> Replace the placeholder values with your actual configuration:
>
> - `USER`, `PASSWORD`, `HOST`, `DB_NAME` - Your Supabase database details
> - `your-anon-public-key`, `your-service-role-key` - From Supabase API settings
> - `your-instance-name` - Your Supabase project reference
> - Better Auth and Brevo values are required for the active Core auth/email path
> - Other tokens and secrets as needed

`DATABASE_URL` and `DIRECT_URL` are mandatory when using Supabase Cloud. Learn more in the [Supabase Setup Guide](./supabase-setup.md).

The compose stack is intentionally honest about the current Core boundary:
PostgreSQL can be local, but storage remains an explicit external dependency
until a dedicated provider path is implemented.

For Patrimoine360 Core staging deployments where server resources are limited,
prefer the GHCR image flow documented in
[`docs/DEPLOIEMENT-STAGING-DOCKPLOY.md`](/C:/dev/patrimoine-360/patrimoine360-core/docs/DEPLOIEMENT-STAGING-DOCKPLOY.md):
build the image in GitHub Actions from `apps/webapp/Dockerfile.image`, push it
to GHCR, then let Dockploy pull and run the finished image instead of building
on the target server.

## Development

> [!CAUTION]
> During development involving Dockerfile changes, make sure to **address the correct Dockerfile** in your builds:
>
> - Fly.io will be built via `apps/webapp/Dockerfile`
> - ghcr.io will be built via `apps/webapp/Dockerfile.image`

By default both Fly.io and Docker will build via `apps/webapp/Dockerfile` unless specifically instructed. Learn more [about Fly.io Config](https://fly.io/docs/reference/configuration/#specify-a-dockerfile) and [Docker image builds](https://docs.docker.com/reference/cli/docker/image/build/#file).

In order to build a local Docker image just as the one we provide for self-hosting, you'll have to build `apps/webapp/Dockerfile.image` using buildx as follows:

```bash
docker buildx build \
   --platform linux/amd64,linux/arm64 \
   --tag patrimoine360-core-local \
   --file apps/webapp/Dockerfile.image .
```

Then running the locally-built image should be as simple as:

```bash
docker run -d \
   --name "patrimoine360-core" \
   -e DATABASE_URL="your-database-url" \
   -e DIRECT_URL="your-direct-url" \
   -e SUPABASE_URL="your-supabase-url" \
   patrimoine360-core-local
```

### ARM processors

You can also run shelf on ARM64 processors.

1. Linux / Pine A64

   ```bash
   docker run -it --rm --entrypoint /usr/bin/uname ghcr.io/srewa-digital/patrimoine360-core:staging -a
   # Expected output: Linux ... aarch64 GNU/Linux
   ```

2. MacOS / M1 Max

   ```bash
   docker run -it --rm --platform linux/arm64 --entrypoint /usr/bin/uname ghcr.io/srewa-digital/patrimoine360-core:staging -a
   # Expected output: Linux ... aarch64 GNU/Linux
   ```
