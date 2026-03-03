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
import { onMounted, ref } from 'vue';
import { RouterView, useRouter } from 'vue-router';
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

const router = useRouter();
const prevPath = ref(router.currentRoute.value.path);

const navOrder: Record<string, number> = {
  '/dashboard': 0,
  '/notes': 1,
  '/calendar': 2,
  '/menu': 3,
  '/settings': 4,
};

function isDetailPage(path: string): boolean {
  return Object.keys(navOrder).some(
    (base) => path.startsWith(base + '/') && path !== base
  );
}

function getNavBase(path: string): string | undefined {
  return Object.keys(navOrder).find(
    (base) => path === base || path.startsWith(base + '/')
  );
}

function transitionName(route: RouteLocationNormalizedLoaded): string {
  const toPath = route.path;
  const fromPath = prevPath.value;

  // Update prevPath for next transition
  prevPath.value = toPath;

  const toIsDetail = isDetailPage(toPath);
  const fromIsDetail = isDetailPage(fromPath);

  // Navigating TO a detail page → slide forward
  if (toIsDetail && !fromIsDetail) {
    return 'slide-left';
  }

  // Navigating FROM a detail page back to a main route → slide back
  if (fromIsDetail && !toIsDetail) {
    return 'slide-right';
  }

  // Both are main nav routes → compare order for direction
  const toBase = getNavBase(toPath);
  const fromBase = getNavBase(fromPath);
  if (toBase !== undefined && fromBase !== undefined && navOrder[toBase] !== undefined && navOrder[fromBase] !== undefined) {
    if (navOrder[toBase] > navOrder[fromBase]) return 'slide-left';
    if (navOrder[toBase] < navOrder[fromBase]) return 'slide-right';
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
