# Guide de déploiement

Ce guide résume le déploiement de Patrimoine360 Core sur Fly.io avec GitHub
Actions.

## Prérequis

- un environnement local fonctionnel ;
- un projet Supabase configuré ;
- un dépôt GitHub prêt ;
- un compte Fly.io.

## Vue d'ensemble

Le flux de déploiement couvre :

- hébergement Fly.io ;
- pipeline GitHub Actions ;
- séparation staging / production ;
- configuration e-mail ;
- gestion des secrets d'environnement.

## 1. Installer Fly CLI

### macOS / Linux

```bash
curl -L https://fly.io/install.sh | sh
```

### Windows

```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Vérifier

```bash
fly version
```

## 2. S'authentifier

```bash
fly auth signup
# ou
fly auth login
```

## 3. Créer les applications Fly

```bash
fly apps create patrimoine360-core
fly apps create patrimoine360-core-staging
```

Adaptez les noms à votre `fly.toml` si besoin.

## 4. Préparer Supabase pour la production

Le plus sûr est d'utiliser un projet Supabase distinct pour la production.

Ajoutez ensuite les URLs applicatives nécessaires dans la configuration
Supabase concernée, par exemple pour les parcours de réinitialisation.

## 5. Configurer les secrets Fly

Exemple de base :

```bash
fly secrets set SESSION_SECRET=$(openssl rand -hex 32)
fly secrets set SERVER_URL="https://your-production-app.fly.dev"
fly secrets set FINGERPRINT=$(openssl rand -hex 32)
fly secrets set SUPABASE_URL="https://your-production-project.supabase.co"
fly secrets set SUPABASE_SERVICE_ROLE="your-production-service-role-key"
fly secrets set SUPABASE_ANON_PUBLIC="your-production-anon-key"
fly secrets set DATABASE_URL="postgres://user:pass@host:6543/db?pgbouncer=true&connection_limit=1"
fly secrets set DIRECT_URL="postgres://user:pass@host:5432/db"
fly secrets set EMAIL_PROVIDER="brevo"
fly secrets set BREVO_API_KEY="xkeysib-your-brevo-api-key"
fly secrets set BREVO_SENDER_EMAIL="support@yourdomain.com"
fly secrets set BREVO_SENDER_NAME="Patrimoine360"
fly secrets set EMAIL_REPLY_TO="support@yourdomain.com"
fly secrets set EMAIL_REPLY_TO_NAME="Support Patrimoine360"
fly secrets set INVITE_TOKEN_SECRET=$(openssl rand -hex 32)
```

Pour le staging, répétez avec `--app patrimoine360-core-staging`.

## 6. Configurer GitHub Actions

Dans **Settings > Secrets and variables > Actions**, ajoutez au minimum :

```bash
FLY_API_TOKEN=your-fly-api-token
```

Ajoutez aussi les variables nécessaires aux tests si vos workflows les
consomment.

## 7. Déployer

### Déploiement manuel

```bash
fly deploy
fly deploy --app patrimoine360-core-staging
```

### Déploiement automatique

Une fois les workflows prêts :

- un push sur la branche de production déclenche la ligne de production ;
- un push sur la branche de staging déclenche la ligne de staging.

## 8. Domaine personnalisé

```bash
fly certs create yourdomain.com
fly certs create www.yourdomain.com
```

Mettez ensuite à jour :

```bash
fly secrets set SERVER_URL="https://yourdomain.com"
```

## 9. Suivi et maintenance

### Logs

```bash
fly logs
fly logs -f
```

### État de l'application

```bash
fly status
fly checks list
```

### Scaling

```bash
fly scale count 2
fly scale vm shared-cpu-1x
```

## Configuration e-mail

Le Core nécessite une configuration e-mail valide. La cible recommandée est
Brevo.

Si vous utilisez un autre SMTP, adaptez les variables `SMTP_*` ou votre
provider applicatif selon votre architecture.

## Bonnes pratiques de sécurité

- ne jamais committer de secrets ;
- séparer staging et production ;
- faire tourner les secrets régulièrement ;
- utiliser des mots de passe et secrets longs ;
- surveiller les logs et erreurs d'authentification ;
- conserver `pgbouncer=true` sur les chaînes adaptées au runtime.

## Dépannage rapide

### Échec de build

```bash
fly logs --app your-app-name
fly deploy --verbose
```

### Problème de connexion base

- vérifier `DATABASE_URL`
- vérifier `DIRECT_URL`
- vérifier les limites de connexion

### Problème d'authentification

- vérifier les URLs déclarées ;
- vérifier les variables Better Auth ;
- vérifier l'envoi e-mail côté application.

## Outils utiles

```bash
fly info
fly scale show
fly certs list
fly ssh console
```

## Suite

Après le premier déploiement :

1. tester les flux critiques ;
2. inviter les administrateurs nécessaires ;
3. surveiller l'usage et les erreurs ;
4. documenter vos choix d'exploitation internes.
