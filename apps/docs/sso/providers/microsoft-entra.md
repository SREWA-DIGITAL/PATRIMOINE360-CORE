# Configurer le SSO avec Microsoft Entra

Patrimoine360 peut être connecté à Microsoft Entra via SAML.

## Étape 1 : créer ou enregistrer une application Enterprise [#](#etape-1--creer-ou-enregistrer-une-application-enterprise)

Ouvrez le tableau de bord Microsoft Entra puis accédez à la page
[Overview](https://entra.microsoft.com/#view/Microsoft_AAD_IAM/TenantOverview.ReactView?Microsoft_AAD_IAM_legacyAADRedirect=true).

Cliquez sur _Add_, puis sur _Enterprise application_.

![step-1](../../img/microsoft-entra-step-1.png)

## Étape 2 : choisir la création d'une application personnalisée [#](#etape-2--choisir-la-creation-dune-application-personnalisee)

Vous allez utiliser le mode de création d'application Enterprise personnalisée.

![step-2](../../img/microsoft-entra-step-2.png)

## Étape 3 : renseigner les détails de l'application [#](#etape-3--renseigner-les-details-de-lapplication)

Dans la fenêtre _Create your own application_, saisissez un nom d'affichage
pour Patrimoine360. C'est le nom que verront les utilisateurs Entra au moment
de se connecter.

Choisissez ensuite la troisième option :
_Integrate any other application you don't find in the gallery (Non-gallery)_.

![step-3](../../img/microsoft-entra-step-3.png)

## Étape 4 : ouvrir l'option de configuration SSO [#](#etape-4--ouvrir-loption-de-configuration-sso)

Avant d'affecter les utilisateurs et les groupes, configurez les détails SAML
qui permettront à Patrimoine360 d'accepter les demandes de connexion venant de
Microsoft Entra.

![step-4](../../img/microsoft-entra-step-4.png)

## Étape 5 : sélectionner la méthode SAML [#](#etape-5--selectionner-la-methode-saml)

Patrimoine360 s'appuie sur le protocole standard SAML 2.0.

![step-5](../../img/microsoft-entra-step-5.png)

## Étape 6 : renseigner la configuration SAML de base [#](#etape-6--renseigner-la-configuration-saml-de-base)

Ajoutez les informations suivantes dans la configuration du fournisseur de
service :

![step-6-1](../../img/microsoft-entra-step-6-1.png)
![step-6-2](../../img/microsoft-entra-step-6-2.png)

| Détail      | Valeur                                                               |
| ----------- | -------------------------------------------------------------------- |
| ACS URL     | `https://nmmqcuiasekdacmhwsxk.supabase.co/auth/v1/sso/saml/acs`      |
| Entity ID   | `https://nmmqcuiasekdacmhwsxk.supabase.co/auth/v1/sso/saml/metadata` |
| Relay State | `https://app.shelf.nu/oauthcallback`                                 |

## Étape 7 : configurer le mapping des attributs [#](#etape-7--configurer-le-mapping-des-attributs)

Le mapping d'attributs permet à Patrimoine360 de récupérer les informations
nécessaires sur les utilisateurs Microsoft Entra.

### Étape 7.1 : supprimer les claims additionnels inutiles

Ne conservez que les claims attendus, en gardant notamment `mail`.

![step-7-1](../../img/microsoft-entra-step-7-1.png)

### Étape 7.2 : ajouter les attributs attendus

| Nom           | Attribut source      | Requis |
| ------------- | -------------------- | ------ |
| firstname     | `user.givenname`     | oui    |
| lastname      | `user.surname`       | oui    |
| mobilephone   | `user.mobilephone`   | non    |
| streetaddress | `user.streetaddress` | non    |
| city          | `user.city`          | non    |
| stateprovince | `user.state`         | non    |
| postalcode    | `user.postalcode`    | non    |
| country       | `user.country`       | non    |

Exemple d'ajout pour `firstname` :

![step-7-example](../../img/microsoft-entra-step-7-2.png)

### Étape 7.3 : ajouter les claims de groupe

Ajoutez ensuite un claim de groupe pour permettre la remontée des groupes Entra
dans Patrimoine360.

> [!NOTE]
> L'affectation métier viendra ensuite. À ce stade, il faut seulement s'assurer
> que Microsoft Entra renvoie bien l'information de groupe.

![step-7-example](../../img/microsoft-entra-step-7-3.png)

## Étape 8 : récupérer l'URL de métadonnées et la transmettre [#](#etape-8--recuperer-lurl-de-metadonnees-et-la-transmettre)

Pour que Patrimoine360 puisse se connecter à votre application Enterprise,
transmettez à votre équipe d'exploitation :

- le **domaine** utilisé par les utilisateurs pour se connecter ;
- l'**App Federation Metadata URL**, disponible dans la section
  _SAML Certificates_.

![step-8](../../img/microsoft-entra-step-8.png)

Ne testez pas la connexion avant confirmation de la prise en compte côté
plateforme.

## Étape 9 : attendre la confirmation [#](#etape-9--attendre-la-confirmation)

Une fois la configuration envoyée, attendez la confirmation d'activation du
paramétrage côté plateforme. Vous pouvez profiter de ce délai pour préparer les
groupes et les utilisateurs.

## Étape 10 : créer les groupes et affecter les utilisateurs [#](#etape-10--creer-les-groupes-et-affecter-les-utilisateurs)

Patrimoine360 s'appuie sur des groupes pour gérer les rôles d'accès par espace
de travail.

Créez trois groupes par espace de travail :

- groupe administrateur ;
- groupe self-service ;
- groupe utilisateur de base.

> [!NOTE]
> Un utilisateur ne devrait pas appartenir à plusieurs groupes pour une même
> application afin d'éviter des comportements inattendus.

### Étape 10.1 : créer les groupes

Allez dans l'interface `Groups` de Microsoft Entra puis cliquez sur
_New group_.

![step 10.1](../../img/microsoft-entra-step-8-1.png)

Vous pouvez ensuite affecter les membres aux groupes créés.

### Étape 10.2 : donner l'accès à l'application Patrimoine360

Revenez sur votre application Enterprise Patrimoine360, ouvrez
_Users and Groups_, puis cliquez sur _Add user/group_ pour sélectionner les
groupes concernés.

![Step 10.2](../../img/microsoft-entra-step-8-2.png)

## Étape 11 : mapper les groupes Entra dans Patrimoine360 [#](#etape-11--mapper-les-groupes-entra-dans-patrimoine360)

> [!NOTE]
> Cette étape ne peut être finalisée qu'après confirmation de l'activation SSO.
>
> Le propriétaire d'un espace de travail ne doit pas être uniquement un compte
> SSO. Conservez un compte standard de secours pour l'administration.

Une fois les groupes prêts, ajoutez leurs identifiants dans les paramètres de
l'espace de travail Patrimoine360 correspondant.

Vous pouvez récupérer l'identifiant d'un groupe dans Entra via son _Object ID_.

> [!IMPORTANT]
> Les valeurs saisies doivent correspondre exactement aux groupes configurés.

![step-9](../../img/google-workspace-step-9.png)
