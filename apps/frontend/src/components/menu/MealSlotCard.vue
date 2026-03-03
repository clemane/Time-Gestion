<template>
  <div class="meal-slot" :class="{ 'has-recipe': recipeName }"
    <div class="slot-header">
      <span class="slot-name">{{ slot.slotName }}</span>
      <button class="slot-action" @click="$emit('remove')">
        <X :size="16" />
      </button>
    </div>
    <div class="slot-content" @click="$emit('assign')">
      <template v-if="recipeName">
        <UtensilsCrossed :size="14" class="slot-icon" />
        <span class="slot-recipe">{{ recipeName }}</span>
      </template>
      <template v-else-if="slot.customTitle">
        <span class="slot-recipe">{{ slot.customTitle }}</span>
      </template>
      <template v-else>
        <Plus :size="14" class="slot-icon placeholder" />
        <span class="slot-placeholder">Choisir un plat...</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UtensilsCrossed, Plus, X } from 'lucide-vue-next';
import type { MealSlot } from '@time-gestion/shared';

defineProps<{ slot: MealSlot; recipeName?: string }>();
defineEmits<{ assign: []; remove: [] }>();
</script>

<style scoped>
.meal-slot {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
}

.meal-slot.has-recipe {
  border-left: 3px solid var(--color-accent);
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 4px;
}

.slot-name {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.slot-action {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  -webkit-tap-highlight-color: transparent;
}

.slot-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 10px;
  cursor: pointer;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
}

.slot-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.slot-icon.placeholder {
  color: var(--color-text-tertiary);
}

.slot-recipe {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
}

.slot-placeholder {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text-tertiary);
}
</style>
