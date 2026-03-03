<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="picker-overlay" @click.self="$emit('close')">
        <div class="picker-modal">
          <div class="picker-header">
            <h3>Choisir une recette</h3>
            <button class="close-btn" @click="$emit('close')">
              <X :size="20" />
            </button>
          </div>
          <div class="picker-search">
            <Search :size="16" class="search-icon" />
            <input v-model="search" placeholder="Rechercher..." class="search-input" />
          </div>
          <div class="picker-list">
            <div
              v-for="recipe in filtered"
              :key="recipe.id"
              class="picker-item"
              @click="$emit('select', recipe.id); $emit('close')"
            >
              <UtensilsCrossed :size="16" class="picker-item-icon" />
              <div class="picker-item-info">
                <span class="picker-item-title">{{ recipe.title }}</span>
                <span v-if="recipe.tags.length" class="picker-item-tags">{{ recipe.tags.join(', ') }}</span>
              </div>
            </div>
            <div v-if="filtered.length === 0" class="picker-empty">
              Aucune recette trouv&eacute;e
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X, Search, UtensilsCrossed } from 'lucide-vue-next';
import { useRecipesStore } from '@/stores/recipes';

defineProps<{ open: boolean }>();
defineEmits<{ select: [recipeId: string]; close: [] }>();

const recipesStore = useRecipesStore();
const search = ref('');

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  return recipesStore.recipes.filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.tags.some(t => t.toLowerCase().includes(q))
  );
});
</script>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 37, 32, 0.3);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.picker-modal {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--safe-area-bottom, 0px) + 8px);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px;
}

.picker-header h3 {
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  background: var(--color-bg-secondary);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 20px 12px;
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.search-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: none;
  outline: none;
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text);
  flex: 1;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg);
  cursor: pointer;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}

.picker-item:first-child { border-radius: 10px 10px 0 0; }
.picker-item:last-child { border-radius: 0 0 10px 10px; }
.picker-item:only-child { border-radius: 10px; }

.picker-item + .picker-item {
  border-top: 0.5px solid var(--color-border);
}

.picker-item:active {
  background: var(--color-bg-secondary);
}

.picker-item-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.picker-item-info {
  flex: 1;
  min-width: 0;
}

.picker-item-title {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  display: block;
}

.picker-item-tags {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-family: var(--font-body);
}

.picker-empty {
  text-align: center;
  padding: 24px;
  color: var(--color-text-tertiary);
  font-family: var(--font-body);
  font-size: 15px;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 250ms ease;
}
.modal-enter-active .picker-modal, .modal-leave-active .picker-modal {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .picker-modal {
  transform: translateY(100%);
}
.modal-leave-to .picker-modal {
  transform: translateY(100%);
}
</style>
