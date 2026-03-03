<template>
  <div class="recipe-card" @click="$router.push(`/menu/recipes/${recipe.id}`)">
    <div class="card-image" :style="recipe.imageUrl ? { backgroundImage: `url(${recipe.imageUrl})` } : {}">
      <UtensilsCrossed v-if="!recipe.imageUrl" :size="32" class="card-placeholder-icon" />
      <button class="fav-btn" @click.stop="$emit('toggleFavorite', recipe.id)">
        <Heart :size="18" :fill="recipe.isFavorite ? 'currentColor' : 'none'" />
      </button>
    </div>
    <div class="card-body">
      <div class="card-title">{{ recipe.title }}</div>
      <div class="card-meta">
        <span v-if="totalTime" class="meta-item">
          <Clock :size="13" /> {{ totalTime }} min
        </span>
        <span v-if="recipe.servings" class="meta-item">
          <Users :size="13" /> {{ recipe.servings }}
        </span>
      </div>
      <div v-if="recipe.tags.length > 0" class="card-tags">
        <span v-for="tag in recipe.tags.slice(0, 3)" :key="tag" class="mini-tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { UtensilsCrossed, Heart, Clock, Users } from 'lucide-vue-next';
import type { Recipe } from '@time-gestion/shared';

const props = defineProps<{ recipe: Recipe }>();
defineEmits<{ toggleFavorite: [id: string] }>();

const totalTime = computed(() => {
  const t = (props.recipe.prepTime || 0) + (props.recipe.cookTime || 0);
  return t > 0 ? t : null;
});
</script>

<style scoped>
.recipe-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 150ms ease;
  -webkit-tap-highlight-color: transparent;
}

.recipe-card:active {
  transform: scale(0.98);
}

.card-image {
  height: 140px;
  background: linear-gradient(135deg, var(--color-bg-secondary), var(--color-border));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card-placeholder-icon {
  color: var(--color-text-tertiary);
  opacity: 0.4;
}

.fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-accent);
}

.card-body {
  padding: 10px 12px 12px;
}

.card-title {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
}

.card-tags {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  overflow: hidden;
}

.mini-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 9999px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  white-space: nowrap;
}
</style>
