# Guide de configuration Supabase

Ce guide décrit la configuration Supabase attendue pour Patrimoine360 Core.

Dans l'état actuel du Core :

- Supabase fournit **PostgreSQL** ;
- Supabase fournit **Storage** ;
- l'authentification active passe par **Better Auth** côté application ;
- les e-mails d'authentification applicatifs passent par **Brevo**.

> [!IMPORTANT]
> C'est le chemin officiellement supporté aujourd'hui pour le Core.
> Une pile Docker totalement autonome avec PostgreSQL + MinIO pourra venir plus
> tard, mais ce n'est pas encore la voie standard.

## Prérequis

- un compte [Supabase](https://supabase.com/)
- un fichier `.env` à la racine du monorepo

## 1. Créer le projet Supabase

1. se connecter à Supabase ;
2. créer un nouveau projet ;
3. choisir l'organisation ;
4. renseigner :
   - nom du projet ;
   - mot de passe base de données ;
   - région ;
   - offre adaptée.

## 2. Récupérer les accès base de données

Depuis le bouton **Connect** puis **ORM > Prisma**, récupérez :

```bash
DATABASE_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.supabase.com:5432/postgres"
```

Remplacez `[YOUR-PASSWORD]` par le mot de passe réel.

## 3. Récupérer les clés API

Depuis **Project Settings > API keys**, renseignez :

```bash
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_PUBLIC="your-anon-public-key"
SUPABASE_SERVICE_ROLE="your-service-role-key"
```

## 4. Régler le mode de connexion

Dans **Project Settings > Database**, activez le mode **Transaction** dans la
section de connection pooling.

## 5. Configurer Better Auth

Ajoutez dans `.env` :

```bash
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="https://localhost:3000"
BETTER_AUTH_BASE_PATH="/api/auth"
```

Si vous utilisez le SSO via Better Auth, ajoutez aussi
`BETTER_AUTH_SSO_PROVIDERS`.

## 6. Comprendre la place résiduelle de Supabase Auth

Le chemin actif du Core ne dépend plus du tableau de bord Supabase Auth pour :

- les modèles d'e-mail ;
- le SMTP principal ;
- les réglages OTP applicatifs ;
- la logique d'authentification courante.

Supabase reste nécessaire pour PostgreSQL et Storage, mais n'est plus la source
principale des flux d'authentification du Core.

## 7. Configurer l'envoi d'e-mails applicatifs

Les variables recommandées sont :

```bash
EMAIL_PROVIDER="brevo"
BREVO_API_KEY="xkeysib-your-brevo-api-key"
BREVO_SENDER_EMAIL="support@your-domain.com"
BREVO_SENDER_NAME="Patrimoine360"
EMAIL_REPLY_TO="support@your-domain.com"
EMAIL_REPLY_TO_NAME="Support Patrimoine360"
BREVO_TIMEOUT_SECONDS="30"
```

Les variables `SMTP_*` ne servent que de repli si vous avez besoin d'un
rollback technique.

## 8. Créer les buckets Storage

Tant qu'un provider MinIO natif n'est pas branché dans le Core, ces buckets
Supabase restent nécessaires :

- `profile-pictures`
- `assets`
- `kits`
- `files`

Créez-les depuis **Storage > Buckets** puis appliquez les politiques adaptées à
votre usage serveur.

## 9. Exemple de `.env`

```bash
DATABASE_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.supabase.com:5432/postgres"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_PUBLIC="your-anon-public-key"
SUPABASE_SERVICE_ROLE="your-service-role-key"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="https://localhost:3000"
BETTER_AUTH_BASE_PATH="/api/auth"
SESSION_SECRET="your-super-secret-session-key"
SERVER_URL="https://localhost:3000"
ENABLE_PREMIUM_FEATURES="false"
EMAIL_PROVIDER="brevo"
BREVO_API_KEY="xkeysib-your-brevo-api-key"
BREVO_SENDER_EMAIL="support@your-domain.com"
BREVO_SENDER_NAME="Patrimoine360"
EMAIL_REPLY_TO="support@your-domain.com"
EMAIL_REPLY_TO_NAME="Support Patrimoine360"
MAPTILER_TOKEN="your-maptiler-token"
GEOCODING_USER_AGENT="Your App Name (https://yoursite.com)"
INVITE_TOKEN_SECRET="your-invite-token-secret"
```

## 10. Générer les secrets

```bash
openssl rand -hex 32
```

À utiliser pour :

- `SESSION_SECRET`
- `INVITE_TOKEN_SECRET`
- `BETTER_AUTH_SECRET`

## 11. Géocodage

Le Core s'appuie sur [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)
pour transformer les adresses en coordonnées.

- aucun API key n'est requis ;
- `GEOCODING_USER_AGENT` doit être renseigné ;
- pour un fort volume, il faut envisager une alternative commerciale ou une
  instance dédiée.

## Vérification

Une fois la configuration terminée, vous devez pouvoir lancer :

```bash
pnpm webapp:setup
pnpm webapp:dev
```

Avec SSL :

- `https://localhost:3000`

Sans SSL :

- `http://localhost:3000`

## Dépannage rapide

- erreur de connexion : vérifier `DATABASE_URL` et `DIRECT_URL`
- erreur auth : vérifier les variables `BETTER_AUTH_*`
- erreur upload : vérifier les buckets et leurs politiques
- erreur e-mail : vérifier Brevo et les variables `BREVO_*`

## Suite

Pour la production ou le staging, poursuivez avec
[deployment](./deployment.md). Pour la pile locale communautaire, voir aussi
[docker](./docker.md).
