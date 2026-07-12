# Configuration de l'application - `shelf.config.ts`

Ce fichier centralise les options de configuration qui permettent d'ajuster
certaines fonctions de Patrimoine360 Core.

```ts
// shelf.config.ts
import {
  DISABLE_SIGNUP,
  DISABLE_SSO,
  ENABLE_PREMIUM_FEATURES,
  FREE_TRIAL_DAYS,
  SEND_ONBOARDING_EMAIL,
} from "~/utils/env";
import { Config } from "./types";

export const config: Config = {
  sendOnboardingEmail: SEND_ONBOARDING_EMAIL || false,
  enablePremiumFeatures: ENABLE_PREMIUM_FEATURES || false,
  freeTrialDays: Number(FREE_TRIAL_DAYS || 7),
  disableSignup: DISABLE_SIGNUP || false,
  disableSSO: DISABLE_SSO || false,
  logoPath: {
    fullLogo: "/static/images/logo-full-color(x2).png",
    symbol: "/static/images/shelf-symbol.png",
  },
  faviconPath: "/static/favicon.ico",
  emailPrimaryColor: "#EF6820",
  showHowDidYouFindUs: SHOW_HOW_DID_YOU_FIND_US || false,
};
```

## Options principales

### `sendOnboardingEmail`

Détermine si l'e-mail d'onboarding est envoyé aux nouveaux utilisateurs depuis
`routes/_welcome+/onboarding.tsx`.

- valeur par défaut : `false`
- variable d'environnement : `SEND_ONBOARDING_EMAIL`

```ts
sendOnboardingEmail: true;
```

### `enablePremiumFeatures`

Active ou désactive les fonctions premium déjà présentes dans le socle
technique. Dans le contexte Core, cette option doit être utilisée avec
prudence selon la frontière Core / Enterprise.

- valeur par défaut : `false`
- variable d'environnement : `ENABLE_PREMIUM_FEATURES`

```ts
enablePremiumFeatures: true;
```

### `collectBusinessIntel`

Contrôle la collecte d'informations complémentaires pendant l'onboarding.
Lorsqu'elle est activée, l'utilisateur peut renseigner :

- comment il a découvert Patrimoine360 ;
- son rôle ;
- la taille de son équipe ;
- le nom de son entreprise ou organisation ;
- d'éventuelles questions de personnalisation.

- valeur par défaut : `false`
- variable d'environnement : `COLLECT_BUSINESS_INTEL`

```ts
collectBusinessIntel: true;
```

Si `COLLECT_BUSINESS_INTEL` n'est pas défini, la compatibilité historique est
conservée via `SHOW_HOW_DID_YOU_FIND_US`.

### `showHowDidYouFindUs`

> [!WARNING]
> Option dépréciée. Préférez `collectBusinessIntel`.

Affiche un champ libre sur l'onboarding pour demander comment l'utilisateur a
découvert Patrimoine360.

- valeur par défaut : `false`
- variable d'environnement : `SHOW_HOW_DID_YOU_FIND_US`

### `freeTrialDays`

Définit la durée d'essai lorsque les fonctions premium sont activées.

- valeur par défaut : `7`
- variable d'environnement : `FREE_TRIAL_DAYS`

```ts
freeTrialDays: 14;
```

### `disableSignup`

Empêche les nouvelles inscriptions sur l'instance. Pratique pour un déploiement
fermé ou privé.

- valeur par défaut : `false`
- variable d'environnement : `DISABLE_SIGNUP`

```ts
disableSignup: true;
```

### `disableSSO`

Désactive le SSO même si des fournisseurs sont configurés.

- valeur par défaut : `false`
- variable d'environnement : `DISABLE_SSO`

```ts
disableSSO: true;
```

### `logoPath`

Définit les chemins des logos utilisés dans l'interface.

- `fullLogo`: `"/static/images/logo-full-color(x2).png"`
- `symbol`: `"/static/images/shelf-symbol.png"`

```ts
logoPath: {
  fullLogo: "/static/images/my-custom-logo.png",
  symbol: "/static/images/my-symbol.png",
};
```

### `faviconPath`

Chemin du favicon de l'application.

- valeur par défaut : `"/static/favicon.ico"`

### `emailPrimaryColor`

Couleur principale utilisée dans les e-mails transactionnels.

- valeur par défaut : `"#EF6820"`

```ts
emailPrimaryColor: "#FF5733";
```

## Variables d'environnement

Exemple :

```bash
SEND_ONBOARDING_EMAIL=true
ENABLE_PREMIUM_FEATURES=false
FREE_TRIAL_DAYS=14
DISABLE_SIGNUP=false
DISABLE_SSO=false
COLLECT_BUSINESS_INTEL=true
```

## Notes

- un redémarrage serveur est nécessaire après modification ;
- les variables d'environnement priment sur les valeurs codées en dur ;
- les chemins logo et favicon sont relatifs à `public/` ;
- les couleurs d'e-mail doivent être en hexadécimal.
