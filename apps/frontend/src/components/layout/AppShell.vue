<template>
  <div class="app-shell">
    <div class="status-bar" v-if="!isOnline">
      <span>Mode hors-ligne</span>
    </div>
    <main class="app-content">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import BottomNav from './BottomNav.vue';
import { isOnline } from '@/sync/online';
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

.status-bar {
  background: var(--color-warning);
  color: #000;
  text-align: center;
  padding: 4px;
  font-size: 12px;
  font-weight: 600;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(56px + var(--safe-area-bottom));
  -webkit-overflow-scrolling: touch;
}
</style>
