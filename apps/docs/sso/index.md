# Activer le SSO

Patrimoine360 Core permet d'activer le single sign-on (SSO) pour renforcer la
sécurité des accès et simplifier l'onboarding comme l'offboarding des équipes.
Les administrateurs peuvent imposer l'usage d'un fournisseur d'identité pour
les connexions de leur organisation.

Dans le Core actuel, le SSO reste une capacité réservée aux déploiements
Enterprise ou aux environnements explicitement configurés pour cela.

## Mise en place et limites [#](#mise-en-place-et-limites)

Patrimoine360 s'appuie sur des fournisseurs d'identité compatibles SAML 2.0.
Des guides sont fournis pour les cas les plus courants :

- [Google Workspace](./providers/google-workspace.md)
- [Microsoft Entra](./providers/microsoft-entra.md)
- Okta

Les comptes qui se connectent via SSO ont quelques particularités. Les points
ci-dessous résument le comportement attendu lorsque le SSO est activé.

> [!IMPORTANT]
> Lors de l'activation du SSO pour votre organisation, vous devez conserver au
> moins un utilisateur non SSO comme propriétaire administratif de secours.
> Ce compte sert uniquement aux rares opérations de maintenance liées à la
> configuration SSO.

### Activer le SSO pour une organisation [#](#activer-le-sso-pour-une-organisation)

- les invitations d'espace de travail ne sont pas limitées aux seuls membres
  du fournisseur d'identité ;
- un utilisateur SSO ne reçoit pas d'espace de travail personnel par défaut ;
- un utilisateur SSO ne peut pas modifier ou réinitialiser son mot de passe
  dans l'application, car l'accès est piloté par le fournisseur d'identité ;
- un utilisateur SSO ne gère pas lui-même un abonnement individuel ;
- si l'adresse `huis@zaans.com` est déjà liée à un compte SSO, cette même
  adresse ne peut plus être recréée comme compte standard ;
- si un utilisateur standard existe déjà avec cette adresse, la connexion SSO
  doit être traitée avec prudence et éventuellement reprise par
  l'administrateur ;
- un utilisateur SSO ne voit que les organisations qui lui sont attribuées via
  les groupes remontés par le fournisseur d'identité.

### Désactiver le SSO pour une équipe [#](#desactiver-le-sso-pour-une-equipe)

- vous pouvez bloquer l'accès d'un utilisateur en le supprimant ou en le
  désactivant dans votre fournisseur d'identité ;
- vous pouvez ensuite le retirer des espaces de travail dans Patrimoine360 ;
- les affectations et réservations portées par cet utilisateur doivent alors
  être réattribuées si nécessaire.

## Pour les développeurs [#](#pour-les-developpeurs)

Si vous hébergez vous-même Patrimoine360 et souhaitez activer le SSO, référez-
vous à la documentation Supabase pour l'ajout de fournisseurs SAML :
[https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml)

### Mapping des attributs [#](#mapping-des-attributs)

Pour qu'un utilisateur SSO puisse se connecter correctement, il faut mapper les
attributs attendus conformément à la documentation Supabase :
[https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml?queryGroups=language&language=js#understanding-attribute-mappings](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml?queryGroups=language&language=js#understanding-attribute-mappings)

Un exemple de mapping d'attributs est disponible dans le dépôt :
[../../sso/attributes.json](../../sso/attributes.json)
