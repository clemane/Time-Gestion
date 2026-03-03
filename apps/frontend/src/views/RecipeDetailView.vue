<template>
  <div class="recipe-detail" v-if="recipe">
    <!-- Hero Image -->
    <div class="hero" :style="recipe.imageUrl ? { backgroundImage: `url(${recipe.imageUrl})` } : {}">
      <div class="hero-overlay">
        <button class="hero-btn back" @click="$router.back()">
          <ChevronLeft :size="24" />
        </button>
        <div class="hero-actions">
          <button class="hero-btn" @click="toggleFav">
            <Heart :size="20" :fill="recipe.isFavorite ? 'currentColor' : 'none'" />
          </button>
          <button class="hero-btn" @click="$router.push(`/menu/recipes/${recipe.id}/edit`)">
            <Pencil :size="18" />
          </button>
        </div>
      </div>
      <UtensilsCrossed v-if="!recipe.imageUrl" :size="56" class="hero-placeholder" />
    </div>

    <!-- Content -->
    <div class="detail-body">
      <h1 class="detail-title">{{ recipe.title }}</h1>
      <p v-if="recipe.description" class="detail-desc">{{ recipe.description }}</p>

      <!-- Info badges -->
      <div class="info-badges" v-if="recipe.prepTime || recipe.cookTime || recipe.servings">
        <div v-if="recipe.prepTime" class="badge">
          <Clock :size="16" />
          <div>
            <span class="badge-value">{{ recipe.prepTime }} min</span>
            <span class="badge-label">Preparation</span>
          </div>
        </div>
        <div v-if="recipe.cookTime" class="badge">
          <Flame :size="16" />
          <div>
            <span class="badge-value">{{ recipe.cookTime }} min</span>
            <span class="badge-label">Cuisson</span>
          </div>
        </div>
        <div v-if="recipe.servings" class="badge">
          <Users :size="16" />
          <div>
            <span class="badge-value">{{ recipe.servings }}</span>
            <span class="badge-label">Portions</span>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="recipe.tags.length > 0" class="detail-tags">
        <span v-for="tag in recipe.tags" :key="tag" class="detail-tag">{{ tag }}</span>
      </div>

      <!-- Ingredients -->
      <div v-if="recipe.ingredients.length > 0" class="section">
        <h2 class="section-title">Ingredients</h2>
        <div class="ingredients-card">
          <div v-for="ing in recipe.ingredients" :key="ing.id" class="ingredient-item">
            <span class="ing-dot"></span>
            <span class="ing-text">
              <strong v-if="ing.quantity">{{ ing.quantity }}{{ ing.unit ? ' ' + ing.unit : '' }}</strong>
              {{ ing.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div v-if="hasInstructions" class="section">
        <h2 class="section-title">Instructions</h2>
        <div class="instructions-card">
          <NoteEditor :model-value="recipe.instructions" />
        </div>
      </div>

      <!-- Delete -->
      <button class="delete-btn" @click="deleteRecipe">
        <Trash2 :size="16" /> Supprimer cette recette
      </button>
    </div>
  </div>

  <!-- Loading -->
  <div v-else class="loading-state">
    <div class="loading-spinner"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRecipesStore } from '@/stores/recipes';
import NoteEditor from '@/components/editor/NoteEditor.vue';
import { ChevronLeft, Heart, Pencil, Clock, Flame, Users, Trash2, UtensilsCrossed } from 'lucide-vue-next';
import type { Recipe, RecipeIngredient } from '@time-gestion/shared';

const route = useRoute();
const router = useRouter();
const recipesStore = useRecipesStore();

const recipe = ref<(Recipe & { ingredients: RecipeIngredient[] }) | null>(null);

const hasInstructions = computed(() => {
  if (!recipe.value?.instructions) return false;
  const inst = recipe.value.instructions as Record<string, unknown>;
  if (!inst.content) return false;
  const content = inst.content as unknown[];
  return content.length > 0;
});

async function toggleFav() {
  if (!recipe.value) return;
  await recipesStore.toggleFavorite(recipe.value.id);
  recipe.value = { ...recipe.value, isFavorite: !recipe.value.isFavorite };
}

async function deleteRecipe() {
  if (!recipe.value) return;
  await recipesStore.remove(recipe.value.id);
  router.replace('/menu');
}

onMounted(async () => {
  const id = route.params.id as string;
  await recipesStore.loadFromLocal();
  recipe.value = recipesStore.recipes.find(r => r.id === id) || null;
});
</script>

<style scoped>
.recipe-detail {
  height: 100%;
  overflow-y: auto;
  background: var(--color-bg);
}

/* Hero */
.hero {
  height: 240px;
  background: linear-gradient(135deg, var(--color-bg-secondary), var(--color-border));
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: calc(var(--safe-area-top, 12px) + 8px) 16px 0;
}

.hero-btn {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text);
  -webkit-tap-highlight-color: transparent;
}

.hero-btn:active { opacity: 0.7; }

.hero-btn.back {
  color: var(--color-primary);
}

.hero-actions {
  display: flex;
  gap: 8px;
}

.hero-actions .hero-btn:first-child {
  color: var(--color-accent);
}

.hero-placeholder {
  color: var(--color-text-tertiary);
  opacity: 0.3;
}

/* Body */
.detail-body {
  padding: 20px 20px 100px;
  margin-top: -20px;
  background: var(--color-bg);
  border-radius: 20px 20px 0 0;
  position: relative;
}

.detail-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1.15;
  margin-bottom: 4px;
}

.detail-desc {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
  line-height: 1.4;
}

/* Info badges */
.info-badges {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.badge {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
}

.badge svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.badge-value {
  display: block;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.badge-label {
  display: block;
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* Tags */
.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.detail-tag {
  padding: 4px 12px;
  background: var(--color-primary-ghost);
  color: var(--color-primary);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
}

/* Sections */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 400;
  color: var(--color-text);
  margin-bottom: 12px;
}

/* Ingredients */
.ingredients-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.ingredient-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.ingredient-item + .ingredient-item {
  border-top: 0.5px solid var(--color-border);
}

.ing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  flex-shrink: 0;
}

.ing-text {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text);
}

.ing-text strong {
  font-weight: 600;
  color: var(--color-primary);
  margin-right: 4px;
}

/* Instructions */
.instructions-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  padding: 4px;
}

/* Delete */
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-danger);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.delete-btn:active { opacity: 0.7; }

/* Loading */
.loading-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
