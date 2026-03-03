<template>
  <div class="week-nav">
    <button class="week-btn" @click="$emit('prev')">
      <ChevronLeft :size="20" />
    </button>
    <span class="week-label">Semaine du {{ formatDate(currentWeekStart) }}</span>
    <button class="week-btn" @click="$emit('next')">
      <ChevronRight :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

defineProps<{ currentWeekStart: string }>();
defineEmits<{ prev: []; next: [] }>();

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
</script>

<style scoped>
.week-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px 12px;
}

.week-btn {
  background: var(--color-bg-secondary);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-primary);
  -webkit-tap-highlight-color: transparent;
}

.week-btn:active { opacity: 0.7; }

.week-label {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
}
</style>
