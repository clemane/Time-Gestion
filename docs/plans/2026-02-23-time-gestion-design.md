# Time Gestion - Design Document

## Vision

Application combinant la gestion de notes (style Apple Notes) avec un calendrier complet. Notes riches avec catégories-templates personnalisables, listes à cocher, calendrier multi-vues, partage entre utilisateurs. Offline-first PWA optimisée pour mobile.

## Stack technique

- **Frontend** : Vue 3 + TypeScript + Vite + PWA (vite-plugin-pwa)
- **Backend** : NestJS + TypeScript
- **Base de données** : PostgreSQL (via Prisma ou TypeORM)
- **Store local** : IndexedDB via Dexie.js
- **State management** : Pinia
- **Éditeur riche** : TipTap (ProseMirror)
- **Monorepo** : pnpm workspaces

## Structure du projet

```
time-gestion/
├── apps/
│   ├── frontend/          # Vue 3 + Vite + PWA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── views/
│   │   │   ├── stores/        # Pinia
│   │   │   ├── composables/
│   │   │   ├── db/            # Dexie.js (IndexedDB)
│   │   │   ├── sync/          # Logique de sync offline
│   │   │   └── types/
│   │   └── public/
│   └── backend/           # NestJS
│       └── src/
│           ├── auth/
│           ├── notes/
│           ├── categories/
│           ├── events/
│           ├── calendars/
│           ├── sharing/
│           └── sync/
├── packages/
│   └── shared/            # Types TS partagés front/back
├── package.json           # Workspace root (pnpm)
└── docker-compose.yml     # PostgreSQL
```

## Modèle de données

### Users
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| email | string | Unique, login |
| passwordHash | string | Bcrypt |
| displayName | string | Nom affiché |
| avatarUrl | string? | Photo de profil |
| createdAt | timestamp | |

### Folders
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → Users |
| parentId | UUID? | FK → Folders (hiérarchie) |
| name | string | |
| sortOrder | int | |
| updatedAt | timestamp | |
| deletedAt | timestamp? | Soft delete |

### Categories (Templates de notes)
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → Users (créateur) |
| name | string | Ex: "Liste de courses", "Journal" |
| icon | string? | Icône optionnelle |
| style | JSON | `{ backgroundColor, lineStyle, fontFamily, ... }` |
| defaultContent | JSON? | Contenu TipTap initial optionnel |
| isDefault | boolean | Template système |
| sortOrder | int | Ordre d'affichage |
| updatedAt | timestamp | |
| deletedAt | timestamp? | Soft delete |

### Notes
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → Users (propriétaire) |
| folderId | UUID? | FK → Folders |
| categoryId | UUID? | FK → Categories (template) |
| title | string | Titre de la note |
| content | JSON | Contenu TipTap (ProseMirror JSON) |
| isPinned | boolean | Épinglée en haut |
| scheduledDate | date? | Date assignée au calendrier |
| scheduledTime | time? | Heure optionnelle |
| createdAt | timestamp | |
| updatedAt | timestamp | Pour la sync |
| deletedAt | timestamp? | Soft delete |

### Calendars
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → Users (propriétaire) |
| name | string | Ex: "Personnel", "Travail" |
| color | string | Code couleur hex |
| updatedAt | timestamp | |
| deletedAt | timestamp? | Soft delete |

### Events
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| calendarId | UUID | FK → Calendars |
| userId | UUID | FK → Users (créateur) |
| title | string | |
| description | string? | |
| startAt | timestamp | Début |
| endAt | timestamp | Fin |
| allDay | boolean | Toute la journée |
| recurrenceRule | string? | RRULE (RFC 5545) |
| reminderMinutes | int? | Rappel X min avant |
| noteId | UUID? | FK → Notes (lien optionnel) |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| deletedAt | timestamp? | Soft delete |

### Shares
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| resourceType | enum | `NOTE`, `FOLDER`, `CALENDAR` |
| resourceId | UUID | ID de la ressource partagée |
| ownerId | UUID | FK → Users |
| sharedWithId | UUID | FK → Users |
| permission | enum | `READ`, `WRITE` |
| createdAt | timestamp | |

## Éditeur de notes

**TipTap** (ProseMirror) avec les extensions :
- StarterKit (gras, italique, listes, titres, etc.)
- TaskList + TaskItem (listes à cocher)
- Image (upload)
- Table
- Placeholder

Le contenu est stocké en JSON ProseMirror (pas HTML) pour faciliter la sync et le diff.

## Catégories-templates

Les catégories fonctionnent comme des templates visuels et de contenu :
- **Style visuel** : couleur de fond, style de ligne (ligné, grille, vide), police
- **Contenu initial** : optionnel, ex. checklist vide pour "Liste de courses"
- L'utilisateur peut créer/modifier ses propres catégories
- Catégories par défaut fournies : "Note", "Checklist", "Liste de courses"
- Le style JSON contient : `{ backgroundColor, lineStyle, fontFamily, fontSize }`

## Calendrier

### Vues
- **Vue mois** : grille mensuelle avec indicateurs sur les jours ayant des événements/notes
- **Vue semaine** : grille horaire 7 jours
- **Vue agenda** : liste chronologique défilante des événements/notes datées

### Événements
- Titre, description, date début/fin, journée entière
- Récurrence via RRULE (RFC 5545) : quotidien, hebdomadaire, mensuel, annuel, personnalisé
- Rappels : notification X minutes avant l'événement
- Lien optionnel avec une note
- Organisation par calendriers (Personnel, Travail, etc.) avec couleurs

### Notes datées
- Les notes avec `scheduledDate` apparaissent dans le calendrier
- Affichées différemment des événements (icône note vs icône événement)

## Sync offline-first

### Architecture
1. **IndexedDB** (Dexie.js) = store principal côté client
2. Les stores **Pinia** lisent depuis IndexedDB et restent réactifs
3. Les mutations écrivent dans IndexedDB, puis s'ajoutent à une **queue de sync**

### Queue de sync
- Table `syncQueue` dans IndexedDB : `{ id, entity, entityId, action, payload, createdAt }`
- Quand en ligne : worker pousse les mutations vers `POST /sync/push` dans l'ordre
- Le serveur répond avec la version serveur, le client met à jour IndexedDB
- Au démarrage/retour en ligne : `GET /sync/pull?since=<timestamp>` pour récupérer les changements serveur

### Résolution de conflits
- **Last-write-wins** basé sur `updatedAt`
- Suffisant pour un usage personnel/petit groupe

## PWA

- **Service Worker** via `vite-plugin-pwa` : cache des assets statiques
- **Web Push API** pour les notifications de rappels d'événements
- **Manifest** pour installation sur écran d'accueil
- Icônes et splash screens

## Authentification

- **JWT** : access token (courte durée) + refresh token (longue durée)
- Login par email/mot de passe
- Refresh token en httpOnly cookie, access token en mémoire
- NestJS : Passport + `@nestjs/jwt`
- Bcrypt pour le hash des mots de passe

## Partage

- Partager une note, un dossier ou un calendrier avec un autre utilisateur
- Permissions : `READ` (lecture seule) ou `WRITE` (lecture + écriture)
- Partager un dossier = accès à toutes les notes contenues
- Partager un calendrier = accès à tous ses événements
- Invitation par email de l'utilisateur cible
- Section "Partagé avec moi" dans l'interface

## API REST

### Auth
- `POST /auth/register` — Inscription
- `POST /auth/login` — Connexion
- `POST /auth/refresh` — Rafraîchir le token

### Notes
- `GET /notes` — Liste (avec filtres : folderId, categoryId, search)
- `GET /notes/:id` — Détail
- `POST /notes` — Créer
- `PATCH /notes/:id` — Modifier
- `DELETE /notes/:id` — Supprimer (soft delete)

### Folders
- `GET /folders` — Arbre de dossiers
- `POST /folders` — Créer
- `PATCH /folders/:id` — Modifier
- `DELETE /folders/:id` — Supprimer

### Categories
- `GET /categories` — Liste
- `POST /categories` — Créer
- `PATCH /categories/:id` — Modifier
- `DELETE /categories/:id` — Supprimer

### Calendars
- `GET /calendars` — Liste
- `POST /calendars` — Créer
- `PATCH /calendars/:id` — Modifier
- `DELETE /calendars/:id` — Supprimer

### Events
- `GET /events` — Liste (avec filtres : calendarId, dateRange)
- `GET /events/:id` — Détail
- `POST /events` — Créer
- `PATCH /events/:id` — Modifier
- `DELETE /events/:id` — Supprimer

### Shares
- `POST /shares` — Partager une ressource
- `GET /shares/with-me` — Ressources partagées avec moi
- `DELETE /shares/:id` — Retirer un partage

### Sync
- `POST /sync/push` — Envoyer les mutations offline
- `GET /sync/pull?since=<timestamp>` — Récupérer les changements depuis timestamp

## Navigation mobile (PWA)

- **Bottom tab bar** : Notes | Calendrier | Recherche | Paramètres
- Gestes swipe pour naviguer entre vues calendrier
- Pull-to-refresh pour forcer la sync
- Design mobile-first, responsive pour desktop
