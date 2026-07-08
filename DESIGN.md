# Patrimoine360 Core - Design System

Ce document décrit la charte graphique appliquée à Patrimoine360 Core. Il sert de référence pour les écrans web, les emails et les assets statiques.

## Identité Visuelle

Patrimoine360 adopte une direction premium, patrimoniale, institutionnelle et moderne. L'interface doit transmettre la confiance, la stabilité, la gestion rigoureuse et une vision globale des actifs.

Le logo associe un symbole doré à une typographie fine. La combinaison bleu nuit + or doit rester sobre : le bleu structure l'interface, l'or sert d'accent.

## Logos

Les assets de marque servis par l'application web sont placés ici :

`apps/webapp/public/static/images/brand/`

Fichiers sources fournis :

- `patrimoine360-logo-bg-blue.jpeg` : logo officiel sur fond bleu nuit, `1600 x 1600`.
- `patrimoine360-logo-bg-white.jpeg` : logo officiel sur fond blanc, `1600 x 1600`.

Fichiers applicatifs générés et utilisés :

- `patrimoine360-wordmark.png` : mot-symbole horizontal, utilisé dans la barre latérale, l'en-tête mobile et les emails.
- `patrimoine360-icon-512.png` : icône PWA principale, `512 x 512`.
- `patrimoine360-icon-192.png` : icône PWA secondaire et favicon, `192 x 192`.

Les chemins sont centralisés dans `apps/webapp/app/config/shelf.config.ts`.

## Palette

| Usage | Couleur | HEX | RGB |
| --- | ---: | ---: | ---: |
| Bleu nuit principal | Bleu nuit | `#08233B` | `rgb(8, 35, 59)` |
| Bleu texte | Bleu encre | `#092339` | `rgb(9, 35, 57)` |
| Or principal | Or patrimoine | `#B19974` | `rgb(177, 153, 116)` |
| Or clair / sable | Or sable | `#C5B69F` | `rgb(197, 182, 159)` |
| Blanc | Blanc principal | `#FEFEFE` | `rgb(254, 254, 254)` |
| Blanc froid | Blanc premium | `#F3F5F6` | `rgb(243, 245, 246)` |
| Gris chaud | Gris pierre | `#A19B8C` | `rgb(161, 155, 140)` |
| Gris texte | Gris institutionnel | `#5B5F5C` | `rgb(91, 95, 92)` |

## Utilisation

Sur fond clair :

- titres : `#092339`
- textes secondaires : `#5B5F5C`
- boutons principaux : fond `#08233B`, texte `#FEFEFE`
- accents et pictogrammes : `#B19974`

Sur fond bleu nuit :

- titres : `#FEFEFE`
- paragraphes : `#F3F5F6`
- accents, chiffres et icônes : `#B19974`
- bordures : `rgba(177, 153, 116, 0.32)`

## Typographie

Le logo est fin, géométrique et moderne. L'application conserve `Inter`, déjà embarquée dans le projet, avec une pile compatible :

```css
font-family: "Avenir Next", "Montserrat", "Inter", sans-serif;
```

Les interfaces métier doivent rester lisibles et denses. Les grands effets typographiques sont réservés aux pages publiques ou marketing.

## PWA

Le manifest utilise deux icônes PNG :

- `192 x 192` pour les navigateurs et raccourcis standards.
- `512 x 512` pour l'installation PWA et les écrans haute résolution.

La couleur de thème PWA est `#08233B`, alignée sur le bleu nuit principal.

## Exemples de saisie

Les placeholders visibles doivent utiliser des exemples cohérents avec le contexte ivoirien quand un domaine est affiché :

- Email : `utilisateur@organisation.ci`
- Domaine SSO : `organisation.ci`
- URL : `https://exemple.ci`

Éviter les domaines génériques `.com` dans les placeholders visibles, sauf contrainte technique explicite.
