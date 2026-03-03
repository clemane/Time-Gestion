<template>
  <div class="empty-state">
    <div class="empty-icon-wrap">
      <component :is="icon" :size="32" :stroke-width="1.5" />
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <button v-if="actionLabel" class="empty-action" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  icon: Component;
  title: string;
  description?: string;
  actionLabel?: string;
}>();

defineEmits<{ action: [] }>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
  opacity: 0.5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 400;
  color: var(--color-text);
  margin-bottom: 4px;
}

.empty-description {
  font-size: 15px;
  color: var(--color-text-tertiary);
  max-width: 280px;
  line-height: 1.4;
}

.empty-action {
  margin-top: 16px;
  padding: 8px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.empty-action:active {
  opacity: 0.5;
}
</style>
