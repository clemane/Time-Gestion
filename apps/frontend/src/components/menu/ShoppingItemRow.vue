<template>
  <div class="shopping-row" :class="{ checked: item.isChecked }">
    <button class="check-btn" @click="haptic.light(); $emit('toggle')">
      <div class="checkbox" :class="{ active: item.isChecked }">
        <Check v-if="item.isChecked" :size="14" />
      </div>
    </button>
    <div class="item-info">
      <span class="item-name">{{ item.name }}</span>
      <span v-if="item.quantity || item.unit" class="item-qty">
        {{ item.quantity }}{{ item.unit ? ' ' + item.unit : '' }}
      </span>
    </div>
    <button class="remove-btn" @click="$emit('remove')">
      <X :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Check, X } from 'lucide-vue-next';
import { useHaptic } from '@/composables/useHaptic';
import type { ShoppingItem } from '@time-gestion/shared';

const haptic = useHaptic();

defineProps<{ item: ShoppingItem }>();
defineEmits<{ toggle: []; remove: [] }>();
</script>

<style scoped>
.shopping-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-bg-elevated);
  min-height: 48px;
  transition: opacity 200ms ease;
}

.shopping-row.checked {
  opacity: 0.5;
}

.shopping-row + .shopping-row {
  border-top: 0.5px solid var(--color-border);
}

.check-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 200ms ease;
}

.checkbox.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text);
  font-weight: 500;
}

.checked .item-name {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

.item-qty {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-left: 6px;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
</style>
