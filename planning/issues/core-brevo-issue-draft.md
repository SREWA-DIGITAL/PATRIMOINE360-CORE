# CORE-BREVO : migrer les emails transactionnels vers Brevo puis sortir Supabase Auth avec Better Auth

## Objectif

Migrer les emails transactionnels de Patrimoine360 Core vers Brevo afin que les
parcours d'authentification et les emails applicatifs ne dépendent plus de
l'envoi d'emails de Supabase, puis remplacer Supabase Auth par Better Auth
derrière l'API Hono avant de reprioriser le reliquat backend Supabase.

## Phases

- [x] CORE-BREVO-01 : pilotage global
- [x] CORE-BREVO-02 : cartographie des flux et dépendances Supabase
- [x] CORE-BREVO-03 : provider Brevo backend
- [x] CORE-BREVO-04 : sortie des emails d'auth du rôle d'émetteur Supabase
- [~] CORE-BREVO-05 : migration des emails applicatifs
- [~] CORE-BREVO-06 : pilotage de la sortie de Supabase Auth vers Better Auth
- [~] CORE-BREVO-06A : cadrage Better Auth
- [ ] CORE-BREVO-06B : installation Better Auth et point d'entrée Hono
- [ ] CORE-BREVO-06C : schéma Better Auth et adaptation Prisma/PostgreSQL
- [ ] CORE-BREVO-06D : coexistence Supabase Auth / Better Auth
- [ ] CORE-BREVO-06E : signup, login et session web
- [ ] CORE-BREVO-06F : OTP, reset password et changement d'email
- [ ] CORE-BREVO-06G : OAuth, mobile auth et middleware de session
- [ ] CORE-BREVO-06H : migration des comptes Supabase existants
- [ ] CORE-BREVO-06I : bascule finale et retrait de Supabase Auth actif
- [ ] CORE-BREVO-06J : repriorisation du reliquat Supabase hors auth

## Références

- `planning/phases/core-brevo.yml`
- `docs/BREVO-CARTOGRAPHIE-ET-ROADMAP.md`
- `apps/docs/supabase-setup.md`

## Critères de succès

- les emails d'authentification sont émis par le backend applicatif via Brevo
- les emails applicatifs convergent vers un point d'entrée backend unique
- Better Auth devient la cible explicite pour remplacer Supabase Auth dans Core
- la bascule auth se fait derrière l'API Hono sans réintroduire Supabase comme émetteur d'emails
- les dépendances Supabase restantes sont documentées et priorisées après la sortie de Supabase Auth
- la séquence `Core -> Enterprise` est explicitée pour la suite

## État actuel à reporter dans GitHub

- provider Brevo backend en place
- point d'entrée backend générique `auth-provider.server.ts` ajouté au-dessus de
  `supabase-auth-provider.server.ts` pour centraliser les opérations Supabase
  Auth restantes
- classification d'erreurs auth déplacée derrière
  `auth-error-classifier.server.ts` au-dessus de
  `supabase-auth-error-classifier.server.ts`
- extraction des codes OTP déplacée derrière des helpers provider auth
  génériques ; le service métier ne lit plus `properties.email_otp`
- lectures SQL `auth.users` et `auth.refresh_tokens` isolées dans
  `auth-state.server.ts`, séparées du provider d'identité Supabase
- `account-details`, `user/service` et `mobile-auth` consomment désormais la
  façade auth au lieu d'appels directs supplémentaires à Supabase Auth
- point d'entrée backend générique `storage-provider.server.ts` ajouté au-dessus
  de `supabase-storage-provider.server.ts` pour les téléchargements d'objets et
  URLs publiques
- résolution d'URL storage déplacée derrière `storage-url-resolver.server.ts`
  au-dessus de `supabase-storage-url-resolver.server.ts`
- classification d'erreurs storage déplacée derrière
  `storage-error-classifier.server.ts` au-dessus de
  `supabase-storage-error-classifier.server.ts`
- `asset.service`, `kit.service` et `move-location-images` réutilisent
  maintenant cette façade storage au lieu d'appels directs supplémentaires à
  Supabase
- `storage.server.ts` s'appuie désormais sur la façade storage ; le direct
  Supabase est recentré sur les seules implémentations backend dédiées
- tags métier ajoutés sur les flux auth, invitation, onboarding, compte,
  booking, audit, équipe et les principaux emails Stripe/feedback
- documentation de migration Brevo et de retrait progressif Supabase rédigée
- pivot `CORE-BREVO-06` acté : la sortie de Supabase Auth passera par Better
  Auth derrière l'API Hono, avec découpage `06A..06J`

## Publication GitHub

- les issues `CORE-BREVO-01` à `CORE-BREVO-06` existent déjà dans GitHub
- le board `Patrimoine360 Delivery` doit maintenant refléter le nouveau découpage
  `CORE-BREVO-06A..06J`
