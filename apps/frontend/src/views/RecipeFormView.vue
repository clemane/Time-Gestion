<template>
  <div class="recipe-form-view">
    <header class="form-header">
      <button class="back-btn" @click="$router.back()">
        <ChevronLeft :size="24" />
      </button>
      <h1>{{ isEditing ? 'Modifier la recette' : 'Nouvelle recette' }}</h1>
      <button class="save-btn" :disabled="!title.trim()" @click="save">
        {{ isEditing ? 'Enregistrer' : 'Creer' }}
      </button>
    </header>

    <div class="form-body">
      <!-- Title -->
      <div class="form-group">
        <label class="form-label">Titre</label>
        <input v-model="title" placeholder="Nom du plat" class="form-input" />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea v-model="description" placeholder="Description courte..." class="form-textarea" rows="2"></textarea>
      </div>

      <!-- Image URL -->
      <div class="form-group">
        <label class="form-label">URL de l'image</label>
        <input v-model="imageUrl" placeholder="https://..." class="form-input" />
      </div>

      <!-- Time & Servings -->
      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">Preparation</label>
          <div class="input-suffix">
            <input v-model.number="prepTime" type="number" placeholder="0" class="form-input" />
            <span class="suffix">min</span>
          </div>
        </div>
        <div class="form-group half">
          <label class="form-label">Cuisson</label>
          <div class="input-suffix">
            <input v-model.number="cookTime" type="number" placeholder="0" class="form-input" />
            <span class="suffix">min</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Portions</label>
        <div class="input-suffix" style="max-width: 140px;">
          <input v-model.number="servings" type="number" placeholder="0" class="form-input" />
          <span class="suffix">pers.</span>
        </div>
      </div>

      <!-- Tags -->
      <div class="form-group">
        <label class="form-label">Tags</label>
        <TagsInput v-model="tags" />
      </div>

      <!-- Ingredients -->
      <div class="form-group">
        <label class="form-label">Ingredients</label>
        <div class="ingredients-list">
          <RecipeIngredientRow
            v-for="(ing, i) in ingredients"
            :key="i"
            :ingredient="ing"
            @update="ingredients[i] = $event"
            @remove="ingredients.splice(i, 1)"
          />
        </div>
        <button class="add-ing-btn" @click="ingredients.push({ name: '', sortOrder: ingredients.length })">
          <Plus :size="16" /> Ajouter un ingredient
        </button>
      </div>

      <!-- Instructions (TipTap) -->
      <div class="form-group">
        <label class="form-label">Instructions</label>
        <div class="editor-wrapper">
          <NoteEditor v-model="instructions" />
        </div>
      </div>

      <!-- Delete button in edit mode -->
      <button v-if="isEditing" class="delete-btn" @click="deleteRecipe">
        <Trash2 :size="16" /> Supprimer cette recette
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRecipesStore } from '@/stores/recipes';
import NoteEditor from '@/components/editor/NoteEditor.vue';
import TagsInput from '@/components/menu/TagsInput.vue';
import RecipeIngredientRow from '@/components/menu/RecipeIngredientRow.vue';
import { ChevronLeft, Plus, Trash2 } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const recipesStore = useRecipesStore();

const isEditing = computed(() => !!route.params.id);
const recipeId = computed(() => route.params.id as string | undefined);

const title = ref('');
const description = ref('');
const imageUrl = ref('');
const prepTime = ref<number | undefined>();
const cookTime = ref<number | undefined>();
const servings = ref<number | undefined>();
const tags = ref<string[]>([]);
const ingredients = ref<Array<{ name: string; quantity?: number; unit?: string; sortOrder?: number }>>([]);
const instructions = ref<Record<string, unknown>>({});

async function save() {
  if (!title.value.trim()) return;

  const dto = {
    title: title.value.trim(),
    description: description.value || undefined,
    imageUrl: imageUrl.value || undefined,
    prepTime: prepTime.value || undefined,
    cookTime: cookTime.value || undefined,
    servings: servings.value || undefined,
    tags: tags.value,
    instructions: instructions.value,
    ingredients: ingredients.value.filter(i => i.name.trim()),
  };

  if (isEditing.value && recipeId.value) {
    await recipesStore.update(recipeId.value, dto);
  } else {
    await recipesStore.create(dto);
  }
  router.back();
}

async function deleteRecipe() {
  if (recipeId.value) {
    await recipesStore.remove(recipeId.value);
    router.replace('/menu');
  }
}

onMounted(async () => {
  if (recipeId.value) {
    await recipesStore.loadFromLocal();
    const recipe = recipesStore.recipes.find(r => r.id === recipeId.value);
    if (recipe) {
      title.value = recipe.title;
      description.value = recipe.description || '';
      imageUrl.value = recipe.imageUrl || '';
      prepTime.value = recipe.prepTime ?? undefined;
      cookTime.value = recipe.cookTime ?? undefined;
      servings.value = recipe.servings ?? undefined;
      tags.value = [...recipe.tags];
      ingredients.value = recipe.ingredients.map(i => ({
        name: i.name,
        quantity: i.quantity ?? undefined,
        unit: i.unit ?? undefined,
        sortOrder: i.sortOrder,
      }));
      instructions.value = recipe.instructions;
    }
  }
});
</script>

<style scoped>
.recipe-form-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 4px;
  -webkit-tap-highlight-color: transparent;
}

.form-header h1 {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 400;
  color: var(--color-text);
}

.save-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  padding: 6px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.save-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.form-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 100px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 17px;
  font-family: var(--font-body);
  color: var(--color-text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 200ms ease;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-input::placeholder {
  color: var(--color-text-tertiary);
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text);
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 200ms ease;
}

.form-textarea:focus {
  border-color: var(--color-primary);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group.half {
  flex: 1;
}

.input-suffix {
  position: relative;
}

.input-suffix .form-input {
  padding-right: 48px;
}

.suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: var(--color-text-tertiary);
  font-family: var(--font-body);
  pointer-events: none;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius);
  padding: 12px;
  border: 1px solid var(--color-border);
}

.add-ing-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: none;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-primary);
  cursor: pointer;
  width: 100%;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.add-ing-btn:active {
  background: var(--color-bg-secondary);
}

.editor-wrapper {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
  min-height: 200px;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  margin-top: 24px;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-danger);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.delete-btn:active {
  opacity: 0.7;
}
</style>
