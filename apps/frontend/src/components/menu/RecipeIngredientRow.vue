<template>
  <div class="ingredient-row">
    <input
      :value="ingredient.name"
      placeholder="Ingredient"
      class="ing-name"
      @input="$emit('update', { ...ingredient, name: ($event.target as HTMLInputElement).value })"
    />
    <input
      :value="ingredient.quantity ?? ''"
      type="number"
      placeholder="Qte"
      class="ing-qty"
      @input="$emit('update', { ...ingredient, quantity: parseFloat(($event.target as HTMLInputElement).value) || undefined })"
    />
    <select
      :value="ingredient.unit || ''"
      class="ing-unit"
      @change="$emit('update', { ...ingredient, unit: ($event.target as HTMLSelectElement).value || undefined })"
    >
      <option value="">Unite</option>
      <option value="g">g</option>
      <option value="kg">kg</option>
      <option value="ml">ml</option>
      <option value="L">L</option>
      <option value="c. a soupe">c. a soupe</option>
      <option value="c. a cafe">c. a cafe</option>
      <option value="piece">piece</option>
      <option value="tranche">tranche</option>
      <option value="pincee">pincee</option>
    </select>
    <button class="ing-remove" @click="$emit('remove')">
      <Minus :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Minus } from 'lucide-vue-next';

defineProps<{
  ingredient: { name: string; quantity?: number; unit?: string; sortOrder?: number };
}>();

defineEmits<{
  update: [ing: { name: string; quantity?: number; unit?: string; sortOrder?: number }];
  remove: [];
}>();
</script>

<style scoped>
.ingredient-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ingredient-row input,
.ingredient-row select {
  padding: 10px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text);
  outline: none;
}

.ingredient-row input:focus,
.ingredient-row select:focus {
  border-color: var(--color-primary);
}

.ing-name { flex: 3; min-width: 0; }
.ing-qty { flex: 1; min-width: 60px; }
.ing-unit { flex: 1.5; min-width: 80px; appearance: none; -webkit-appearance: none; }

.ing-remove {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  padding: 8px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
</style>
