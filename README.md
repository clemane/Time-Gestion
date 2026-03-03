# Time Gestion

Application web de gestion de notes et de calendrier, conçue comme une PWA offline-first.

## Fonctionnalités

- **Notes** — Editeur riche (TipTap) avec support d'images, tableaux et listes de taches
- **Dossiers** — Organisation hierarchique des notes
- **Categories** — Templates personnalisables avec couleurs et icones
- **Calendrier** — Vues mois, semaine et agenda avec evenements recurrents et rappels
- **Partage** — Partage de notes, dossiers et calendriers entre utilisateurs
- **Offline-first** — Synchronisation automatique via IndexedDB (Dexie.js)
- **PWA** — Installable, service worker, notifications push
- **Themes** — Mode clair/sombre avec couleurs d'accent personnalisables

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | Vue 3, TypeScript, Vite, Pinia, TipTap, Dexie.js |
| Backend | NestJS 11, TypeScript, Prisma, Passport JWT |
| Base de donnees | PostgreSQL 17 |
| Monorepo | pnpm workspaces |

## Structure du projet

```
time-gestion/
├── apps/
│   ├── backend/        # API REST NestJS
│   └── frontend/       # SPA Vue 3 (PWA)
├── packages/
│   └── shared/         # Types TypeScript partages
├── docs/               # Documentation et plans
├── docker-compose.yml  # PostgreSQL de developpement
└── pnpm-workspace.yaml
```

## Prerequis

- Node.js >= 20 (voir `.nvmrc`)
- pnpm >= 10
- Docker (pour PostgreSQL)

## Installation

```bash
# Cloner le depot
git clone https://github.com/<votre-utilisateur>/time-gestion.git
cd time-gestion

# Installer les dependances
pnpm install

# Demarrer PostgreSQL
docker compose up -d

# Configurer l'environnement backend
cp apps/backend/.env.example apps/backend/.env

# Executer les migrations
pnpm --filter backend db:migrate

# Generer le client Prisma
pnpm --filter backend db:generate
```

## Developpement

```bash
# Lancer frontend + backend en parallele
pnpm dev

# Ou separement
pnpm dev:backend    # API sur http://localhost:3333
pnpm dev:frontend   # App sur http://localhost:5173
```

## Build

```bash
pnpm build
```

## Tests

```bash
pnpm test
```

## Licence

Ce projet est prive et n'est pas sous licence open source.
