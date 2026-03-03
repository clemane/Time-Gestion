import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { Recipe, RecipeIngredient, CreateRecipeDto, UpdateRecipeDto } from '@time-gestion/shared';

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<(Recipe & { ingredients: RecipeIngredient[] })[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    const allRecipes = await db.recipes.filter(r => !r.deletedAt).toArray();
    const allIngredients = await db.recipeIngredients.toArray();
    recipes.value = allRecipes.map(r => ({
      ...r,
      ingredients: allIngredients
        .filter(i => i.recipeId === r.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  async function create(dto: CreateRecipeDto): Promise<Recipe> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const recipe: Recipe = {
      id,
      userId: '',
      title: dto.title,
      description: dto.description || null,
      instructions: dto.instructions || {},
      prepTime: dto.prepTime ?? null,
      cookTime: dto.cookTime ?? null,
      servings: dto.servings ?? null,
      imageUrl: dto.imageUrl || null,
      tags: dto.tags || [],
      isFavorite: dto.isFavorite || false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const ingredients: RecipeIngredient[] = (dto.ingredients || []).map((ing, i) => ({
      id: crypto.randomUUID(),
      recipeId: id,
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit || null,
      sortOrder: ing.sortOrder ?? i,
    }));

    await db.recipes.put(recipe);
    if (ingredients.length > 0) {
      await db.recipeIngredients.bulkPut(ingredients);
    }

    await db.syncQueue.add({
      entity: 'recipe',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    recipes.value = [{ ...recipe, ingredients }, ...recipes.value];
    return recipe;
  }

  async function update(id: string, dto: UpdateRecipeDto) {
    const now = new Date().toISOString();
    const { ingredients: newIngredients, ...recipeData } = dto;

    await db.recipes.update(id, { ...recipeData, updatedAt: now } as Partial<Recipe>);

    if (newIngredients) {
      await db.recipeIngredients.where('recipeId').equals(id).delete();
      const ingredients: RecipeIngredient[] = newIngredients.map((ing, i) => ({
        id: crypto.randomUUID(),
        recipeId: id,
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit || null,
        sortOrder: ing.sortOrder ?? i,
      }));
      if (ingredients.length > 0) {
        await db.recipeIngredients.bulkPut(ingredients);
      }
    }

    await db.syncQueue.add({
      entity: 'recipe',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    const idx = recipes.value.findIndex(r => r.id === id);
    if (idx >= 0) {
      const updatedIngredients = newIngredients
        ? newIngredients.map((ing, i) => ({
            id: crypto.randomUUID(),
            recipeId: id,
            name: ing.name,
            quantity: ing.quantity ?? null,
            unit: ing.unit || null,
            sortOrder: ing.sortOrder ?? i,
          }))
        : recipes.value[idx].ingredients;
      recipes.value[idx] = { ...recipes.value[idx], ...recipeData, updatedAt: now, ingredients: updatedIngredients };
    }
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.recipes.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'recipe',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    recipes.value = recipes.value.filter(r => r.id !== id);
  }

  async function toggleFavorite(id: string) {
    const recipe = recipes.value.find(r => r.id === id);
    if (recipe) {
      await update(id, { isFavorite: !recipe.isFavorite });
    }
  }

  return { recipes, loading, loadFromLocal, create, update, remove, toggleFavorite };
});
