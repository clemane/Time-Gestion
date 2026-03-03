# Design : Module Menu — Recettes & Planning de repas

**Date** : 2026-03-02
**Approche** : Hybride — Entités dédiées + instructions TipTap

## Objectif

Ajouter un module complet de gestion des repas : bibliothèque de recettes détaillées, planning hebdomadaire avec créneaux flexibles, et liste de courses auto-générée depuis les recettes planifiées.

---

## 1. Modèle de données

### Recipe

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → User |
| title | String | Nom du plat |
| description | String? | Description courte |
| instructions | Json | Contenu TipTap (étapes) |
| prepTime | Int? | Temps de préparation (min) |
| cookTime | Int? | Temps de cuisson (min) |
| servings | Int? | Nombre de portions |
| imageUrl | String? | Photo du plat |
| tags | String[] | Tags libres (végé, rapide, dessert...) |
| isFavorite | Boolean | Favori |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

Relations : `ingredients RecipeIngredient[]`, `mealSlots MealSlot[]`

### RecipeIngredient

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| recipeId | UUID | FK → Recipe |
| name | String | Nom (ex: "poulet") |
| quantity | Float? | Quantité (ex: 500) |
| unit | String? | Unité (ex: "g", "ml", "pièce") |
| sortOrder | Int | Ordre d'affichage |

### MealSlot

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → User |
| recipeId | UUID? | FK → Recipe (nullable) |
| date | DateTime | Jour du repas |
| slotName | String | Créneau libre (ex: "Déjeuner") |
| customTitle | String? | Titre libre si pas de recette |
| sortOrder | Int | Ordre dans la journée |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

### ShoppingItem

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → User |
| name | String | Nom de l'item |
| quantity | Float? | Quantité agrégée |
| unit | String? | Unité |
| isChecked | Boolean | Acheté |
| sourceRecipeId | UUID? | Recette d'origine |
| weekStart | DateTime | Début de semaine |
| createdAt | DateTime | |

---

## 2. Architecture des vues & navigation

### BottomNav (5 onglets)

Notes | Calendrier | **Menu** | Recherche | Réglages

Icône : `UtensilsCrossed` (Lucide)

### Routes

| Route | Vue | Description |
|-------|-----|-------------|
| `/menu` | MenuView | Vue parent, 3 onglets internes |
| `/menu/recipes` | (tab) | Bibliothèque de recettes |
| `/menu/planning` | (tab) | Planning hebdomadaire |
| `/menu/shopping` | (tab) | Liste de courses |
| `/menu/recipes/new` | RecipeFormView | Créer une recette |
| `/menu/recipes/:id` | RecipeDetailView | Détail recette |
| `/menu/recipes/:id/edit` | RecipeFormView | Modifier recette |

### Vues

**MenuView** — Segmented control iOS avec 3 tabs : Recettes, Planning, Courses.

**Tab Recettes** — Grille de cartes : photo, titre, temps total, tags. Filtrage par tags, recherche, tri par récent/favori. FAB "+" pour créer.

**Tab Planning** — Semaine (lun→dim) avec navigation prev/next. Chaque jour affiche ses créneaux avec plat assigné. Tap pour assigner une recette depuis la bibliothèque. Bouton "+" pour ajouter un créneau custom.

**Tab Courses** — Liste cochable générée depuis les recettes planifiées. Bouton "Générer la liste". Ajout d'items manuels. Bouton "Supprimer les cochés".

**RecipeDetailView** — Hero image, titre, badges temps/portions, ingrédients listés, instructions TipTap en lecture seule.

**RecipeFormView** — Formulaire : titre, description, upload photo, temps prep/cuisson, portions, tags (chips input), ingrédients (lignes dynamiques : nom + quantité + unité), instructions avec éditeur TipTap.

---

## 3. Stores Pinia

### useRecipesStore

- State : `recipes[]`, `loading`
- Actions : `loadFromLocal`, `create`, `update`, `remove`, `toggleFavorite`
- Filtre par tags, recherche par titre
- Ingrédients gérés en cascade (CRUD avec la recette)
- Sync queue : CREATE/UPDATE/DELETE

### useMealPlanStore

- State : `mealSlots[]`, `currentWeekStart`, `loading`
- Actions : `loadWeek(date)`, `addSlot`, `assignRecipe`, `removeSlot`, `moveSlot`
- Computed : slots groupés par jour
- Navigation semaine prev/next

### useShoppingStore

- State : `items[]`, `loading`
- Actions : `generateFromPlan(weekStart)`, `addManualItem`, `toggleCheck`, `removeItem`, `clearChecked`
- Génération : agrège les ingrédients des recettes planifiées, fusionne doublons (même nom + unité → additionne quantités)

---

## 4. Backend NestJS

### Nouveaux modules

- `recipes` — CRUD recettes + ingrédients
- `meal-plans` — CRUD créneaux de repas
- `shopping` — CRUD items + génération depuis plan

### Endpoints

```
# Recettes
POST   /recipes          — Créer (avec ingrédients)
GET    /recipes          — Lister (filtre tags, search)
GET    /recipes/:id      — Détail
PATCH  /recipes/:id      — Modifier (avec ingrédients)
DELETE /recipes/:id      — Soft delete

# Planning
POST   /meal-slots       — Créer un créneau
GET    /meal-slots?week=  — Lister par semaine
PATCH  /meal-slots/:id   — Modifier
DELETE /meal-slots/:id   — Supprimer

# Courses
GET    /shopping-items?week=  — Lister par semaine
POST   /shopping-items        — Ajouter manuellement
PATCH  /shopping-items/:id    — Toggle check
DELETE /shopping-items/:id    — Supprimer
POST   /shopping/generate     — Générer depuis planning
```

Tous protégés par JWT `@UseGuards(JwtAuthGuard)`.

### Prisma schema

Ajout des 4 modèles avec relations vers User et entre eux.

---

## 5. Sync offline-first

- Ajout dans `SyncEntity` : `'recipe' | 'recipeIngredient' | 'mealSlot' | 'shoppingItem'`
- Nouvelles tables Dexie.js : `recipes`, `recipeIngredients`, `mealSlots`, `shoppingItems`
- Index Dexie : recipes par userId/tags, mealSlots par userId+date, shoppingItems par userId+weekStart
- Sync queue push/pull identique aux entités existantes

---

## 6. Types partagés (packages/shared)

Nouveaux fichiers dans `packages/shared/src/types/` :

- `recipe.ts` — Recipe, RecipeIngredient, CreateRecipeDto, UpdateRecipeDto
- `meal-plan.ts` — MealSlot, CreateMealSlotDto, UpdateMealSlotDto
- `shopping.ts` — ShoppingItem, CreateShoppingItemDto, GenerateShoppingDto

Export depuis `index.ts`.

---

## 7. Composants frontend

### Nouveaux composants

```
components/
  menu/
    RecipeCard.vue          — Carte recette (grille)
    RecipeIngredientRow.vue — Ligne ingrédient (formulaire)
    MealSlotCard.vue        — Créneau dans le planning
    WeekNavigator.vue       — Navigation semaine prev/next
    ShoppingItemRow.vue     — Ligne de liste de courses
    RecipePicker.vue        — Modal de sélection de recette
    TagsInput.vue           — Input de tags avec chips
```

### Réutilisation

- `NoteEditor.vue` / `EditorToolbar.vue` — réutilisés pour les instructions de recette
- `EmptyState.vue` — états vides pour chaque tab
- Patterns CSS existants (iOS design tokens, glassmorphism)
