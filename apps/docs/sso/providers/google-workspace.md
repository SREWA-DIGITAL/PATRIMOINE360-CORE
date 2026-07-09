# Configurer le SSO avec Google Workspace

Patrimoine360 peut être connecté à Google Workspace via SAML.

## Étape 1 : ouvrir la console Google Workspace [#](#etape-1--ouvrir-la-console-google-workspace)

![step-1](../../img/google-workspace-step-1.png)

## Étape 2 : choisir l'ajout d'une application SAML personnalisée [#](#etape-2--choisir-lajout-dune-application-saml-personnalisee)

Depuis le bouton _Add app_, choisissez _Add custom SAML app_.

![step-2](../../img/google-workspace-step-2.png)

## Étape 3 : renseigner les détails de l'application [#](#etape-3--renseigner-les-details-de-lapplication)

Les informations saisies ici servent surtout à l'affichage dans Google
Workspace. Vous pouvez choisir les valeurs de votre choix et ajouter une
description si besoin.

![step-3](../../img/google-workspace-step-3.png)

## Étape 4 : télécharger les métadonnées IdP [#](#etape-4--telecharger-les-metadonnees-idp)

Cliquez sur _DOWNLOAD METADATA_ puis enregistrez le fichier téléchargé.

![step-4](../../img/google-workspace-step-4.png)

Ce fichier doit ensuite être transmis à votre contact support ou à votre
équipe d'exploitation Patrimoine360 pour finaliser la configuration SSO.

> [!IMPORTANT]
> Vérifiez que le certificat affiché à l'écran reste valide au moins un an.
> Notez sa date d'expiration afin d'anticiper son renouvellement sans coupure.

## Étape 5 : ajouter les informations du fournisseur de service [#](#etape-5--ajouter-les-informations-du-fournisseur-de-service)

Renseignez les éléments suivants sur l'écran de configuration suivant :

| Détail         | Valeur                                                               |
| -------------- | -------------------------------------------------------------------- |
| ACS URL        | `https://nmmqcuiasekdacmhwsxk.supabase.co/auth/v1/sso/saml/acs`      |
| Entity ID      | `https://nmmqcuiasekdacmhwsxk.supabase.co/auth/v1/sso/saml/metadata` |
| Name ID format | PERSISTENT                                                           |
| Name ID        | _Basic Information > Primary email_                                  |

![step-5](../../img/google-workspace-step-5.png)

## Étape 6 : configurer le mapping des attributs [#](#etape-6--configurer-le-mapping-des-attributs)

Le mapping d'attributs permet à Patrimoine360 de récupérer les informations
utiles sur vos utilisateurs à chaque connexion.

Tous les attributs affichés dans l'exemple sont requis. En cas de doute,
reproduisez la configuration montrée dans la capture.

![step-6](../../img/google-workspace-step-6.png)

> [!NOTE]
> Vous reviendrez sur cette étape plus tard, une fois les groupes créés et les
> utilisateurs affectés.

## Étape 7 : attendre la confirmation d'activation [#](#etape-7--attendre-la-confirmation-dactivation)

Une fois l'application Google Workspace configurée, transmettez le fichier de
métadonnées à votre contact d'exploitation Patrimoine360.

Les informations doivent être injectées côté plateforme avant que le SSO soit
actif de bout en bout.

Pendant ce délai, vous pouvez continuer avec la configuration des groupes.

## Étape 8 : créer les groupes et affecter les utilisateurs [#](#etape-8--creer-les-groupes-et-affecter-les-utilisateurs)

Patrimoine360 s'appuie sur des groupes pour attribuer les accès et les rôles
dans chaque espace de travail.

Pour chaque espace de travail, créez trois groupes :

- groupe administrateur ;
- groupe self-service ;
- groupe utilisateur de base.

### 8.1 Créer les groupes dans Google Workspace [#](#81-creer-les-groupes-dans-google-workspace)

Depuis l'administration Google Workspace, allez dans `Directory > Groups >
Create group`.

![step-8.1](../../img/google-workspace-step-8-1.png)

Renseignez le nom, l'adresse e-mail et marquez le groupe comme groupe de
sécurité. Créez les groupes nécessaires pour chaque espace de travail.

> [!NOTE]
> Google Workspace renvoie les noms de groupes plutôt que leurs identifiants au
> moment de la connexion. Il est donc recommandé d'utiliser des noms en
> minuscules et sans espaces pour limiter les erreurs de correspondance.

### 8.2 Affecter les membres aux groupes [#](#82-affecter-les-membres-aux-groupes)

Une fois les groupes créés, affectez-y les membres de votre organisation. Il
est recommandé qu'un utilisateur n'appartienne qu'à un seul groupe pour un
même espace de travail.

### 8.3 Autoriser les groupes à accéder à l'application [#](#83-autoriser-les-groupes-a-acceder-a-lapplication)

Vous pouvez définir quels comptes Google Workspace ont accès à Patrimoine360.
Seuls les utilisateurs autorisés via les groupes pourront ensuite se connecter.

Cette configuration se fait depuis la carte _User access_.

![step-8.3](../../img/google-workspace-step-8-3.png)

Les changements peuvent mettre quelques minutes à se propager dans Google.

### 8.4 Mapper les groupes dans les attributs de l'application [#](#84-mapper-les-groupes-dans-les-attributs-de-lapplication)

Ajoutez ensuite les groupes créés aux attributs renvoyés par l'application.

![step-8.4](../../img/google-workspace-step-8-4.png)

Le nom de l'attribut d'application doit être `groups`.

## Étape 9 : mapper les groupes Google Workspace dans Patrimoine360 [#](#etape-9--mapper-les-groupes-google-workspace-dans-patrimoine360)

Une fois les groupes prêts, ajoutez leurs noms dans les paramètres de l'espace
de travail Patrimoine360 concerné.

Si vous gérez plusieurs espaces de travail, répétez l'opération pour chacun.

> [!IMPORTANT]
> Ces champs sont sensibles à la casse. Le nom doit être strictement identique
> à celui configuré dans Google Workspace.

![step-9](../../img/google-workspace-step-9.png)

## Étape 10 : tester la connexion SSO [#](#etape-10--tester-la-connexion-sso)

Demandez ensuite à un utilisateur concerné de tester la connexion :

- déconnexion éventuelle du compte Google ;
- reconnexion ;
- saisie du domaine de l'organisation sur la page de connexion SSO.

Si la connexion ne fonctionne pas correctement, rapprochez-vous de votre équipe
de support ou d'exploitation.
