# Automatisation GitHub Projects

## Statut

Ce document couvre le moteur de publication idempotente introduit en phase 3.
Les workflows GitHub Actions seront ajoutés dans une phase séparée.

## Commandes

Valider un plan sans effet de bord :

```bash
pnpm project:validate planning/phases/core-ghp-03.yml
```

Simuler une publication :

```bash
pnpm project:publish --dry-run planning/phases/core-ghp-03.yml
```

Publier dans GitHub :

```bash
PROJECT_OWNER=SREWA-DIGITAL \
PROJECT_NUMBER=11 \
GH_TOKEN=<token> \
pnpm project:publish planning/phases/core-ghp-03.yml
```

Sous PowerShell :

```powershell
$env:PROJECT_OWNER = "SREWA-DIGITAL"
$env:PROJECT_NUMBER = "11"
$env:GH_TOKEN = "<token>"
pnpm project:publish planning/phases/core-ghp-03.yml
```

## Règles

- Le plan YAML doit être valide avant toute publication.
- Le moteur retrouve une issue existante avec le marqueur `patrimoine360-task-id`.
- Une relance du même plan ne crée pas de doublon.
- Le mode `--dry-run` ne lit pas GitHub et n'écrit rien.
- La publication réelle nécessite `GH_TOKEN` ou `GITHUB_TOKEN`.
- Le Project est résolu avec `PROJECT_OWNER` et `PROJECT_NUMBER`.
- Les champs Project sont résolus par leur nom, pas par des IDs propres à SREWA-DIGITAL.

## Limites

- Le workflow GitHub Actions n'est pas encore ajouté.
- La synchronisation automatique des statuts appartient à une phase ultérieure.
- Les dépendances entre plans ne sont pas encore prises en charge.
