<template>
  <AppShell v-if="auth.isAuthenticated">
    <RouterView v-slot="{ Component, route }">
      <Transition :name="transitionName(route)" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </AppShell>
  <RouterView v-else />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import AppShell from '@/components/layout/AppShell.vue';
import { useAuthStore } from '@/stores/auth';
import { useSync } from '@/composables/useSync';
import { useReminders } from '@/composables/useReminders';
import { useTheme } from '@/composables/useTheme';

const auth = useAuthStore();
const { startSync } = useSync();
const { requestPermission, startReminders } = useReminders();
useTheme();

const navOrder: Record<string, number> = {
  '/notes': 0,
  '/calendar': 1,
  '/menu': 2,
  '/settings': 3,
};

let lastNavIndex = 0;

function transitionName(route: RouteLocationNormalizedLoaded): string {
  const path = route.path;

  // Child/detail pages always slide left
  if (path.startsWith('/notes/') || path.startsWith('/settings/') || path.startsWith('/menu/')) {
    return 'slide-left';
  }

  const currentIndex = navOrder[path];
  if (currentIndex !== undefined) {
    const direction = currentIndex >= lastNavIndex ? 'fade' : 'fade';
    lastNavIndex = currentIndex;
    return direction;
  }

  return 'fade';
}

onMounted(async () => {
  await auth.refresh();
  if (auth.isAuthenticated) {
    startSync();
    await requestPermission();
    startReminders();
  }
});
</script>
