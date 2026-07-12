# Migration Supabase Auth vers Better Auth

## Portée

Ce document cadre `CORE-BREVO-06H` pour Patrimoine360 Core :

- préparer la migration des comptes existants `auth.users` vers `BetterAuthUser`
- préserver l'accès des comptes email/mot de passe sans reset massif immédiat
- documenter les limites connues avant la bascule finale `06I`

La cible reste la même :

`Supabase Auth -> Better Auth derrière l'API Hono`

## Décisions de migration

### 1. Conserver les identifiants utilisateurs

La migration garde `auth.users.id` comme identifiant source de vérité pour
`BetterAuthUser.id`.

Conséquence :

- la ligne `BetterAuthUser` référence directement `User.id`
- un compte Supabase ne peut être migré automatiquement que si le `User`
  métier correspondant existe déjà avec le même `id`

### 2. Importer les comptes mot de passe dans `BetterAuthAccount`

Les comptes disposant d'un `encrypted_password` Supabase reçoivent une entrée :

- `providerId = "credential"`
- `accountId = user.id`
- `password = encrypted_password`

Better Auth requiert ce compte `credential` pour autoriser la connexion par mot
de passe.

### 3. Supporter temporairement les hash Supabase

Better Auth utilise `scrypt` par défaut. Supabase stocke historiquement des
hash `bcrypt`.

Le Core ajoute donc une vérification compatible legacy dans
`apps/webapp/app/modules/auth/legacy-password-hash.server.ts` :

- hash Better Auth natifs : vérification standard
- hash Supabase `bcrypt` importés : vérification via `bcryptjs`

Cela permet de conserver l'accès après migration, sans imposer un reset
immédiat à tous les utilisateurs existants.

### 4. Laisser les nouveaux mots de passe en hash Better Auth

Les parcours Better Auth déjà en place conservent leur comportement normal :

- nouveaux comptes : hash Better Auth natif
- reset password : hash Better Auth natif
- changement futur de mot de passe : hash Better Auth natif

Autrement dit, seuls les comptes hérités gardent provisoirement leur hash
Supabase importé.

### 5. Ne pas migrer les sessions actives Supabase

Les `auth.refresh_tokens` et sessions actives Supabase ne sont pas recopiés
dans `BetterAuthSession`.

Conséquence opérationnelle :

- la migration des comptes peut être faite avant la bascule finale
- la bascule finale `06I` devra prévoir une reconnexion contrôlée
- les anciens refresh tokens restent un reliquat legacy tant que Supabase Auth
  n'est pas retiré du chemin actif

## Contraintes connues

### Comptes bloquants

Un utilisateur doit être traité manuellement si :

- `auth.users.email` est vide
- aucun `User` métier n'existe avec le même `id`
- un `User` existe par email mais avec un autre `id`
- l'email est déjà possédé par un autre `BetterAuthUser`

### Comptes OAuth

Les identités `auth.identities` non `email` peuvent être importées comme
comptes OAuth Better Auth, mais cela ne suffit pas à lui seul :

- le `providerId` importé doit correspondre au `providerId` réellement utilisé
  par Better Auth
- si la configuration `BETTER_AUTH_SSO_PROVIDERS` utilise un autre identifiant,
  un alignement manuel est nécessaire avant bascule finale

### Comptes SSO

Les comptes SSO restent sensibles car `appMetadata.provider === "sso"` sert
encore de signal métier dans le Core. Les imports SSO/OAuth doivent donc être
validés en staging avant toute exécution en production.

## Scripts disponibles

### Audit

```bash
pnpm --filter @shelf/webapp run auth:audit:supabase-migration
pnpm --filter @shelf/webapp run auth:audit:supabase-migration -- --json
pnpm --filter @shelf/webapp run auth:audit:supabase-migration -- --email user@example.com
```

Le script :

- compte les utilisateurs migrables
- identifie les collisions et comptes bloquants
- liste les comptes `credential` et OAuth prêts à être créés
- remonte les utilisateurs ayant encore des refresh tokens Supabase actifs

### Migration

```bash
pnpm --filter @shelf/webapp run auth:migrate:supabase-to-better-auth
pnpm --filter @shelf/webapp run auth:migrate:supabase-to-better-auth -- --apply
pnpm --filter @shelf/webapp run auth:migrate:supabase-to-better-auth -- --apply --include-oauth
```

Comportement :

- sans `--apply` : dry-run uniquement
- avec `--apply` : insertion des `BetterAuthUser` et comptes `credential`
- avec `--include-oauth` : ajout des comptes OAuth dérivés de
  `auth.identities`

## Validation staging obligatoire

Avant production :

1. exécuter l'audit sur staging
2. corriger les comptes bloquants
3. prendre un backup PostgreSQL
4. exécuter la migration avec `--apply`
5. valider les flux suivants :
   - login email/mot de passe d'un compte migré
   - login OTP Better Auth
   - reset password après migration
   - changement d'email
   - callback OAuth / SSO si concerné
6. vérifier qu'un compte migré avec ancien hash Supabase peut encore se
   connecter

## Rollback / reprise

Depuis le retrait du chemin runtime Supabase Auth, le rollback ne consiste plus
à réactiver un fallback applicatif Supabase. Il doit être piloté de façon
contrôlée par données et environnement :

- supprimer les lignes `BetterAuthAccount` / `BetterAuthUser` créées pour les
  comptes migrés si la validation échoue
- corriger les cas bloquants puis relancer la migration

Le rollback reste coûteux après retrait du chemin actif Supabase, raison pour
laquelle la validation staging et les sauvegardes PostgreSQL restent des
exigences de `06H`.
