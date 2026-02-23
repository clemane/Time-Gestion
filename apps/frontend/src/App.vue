<template>
  <AppShell v-if="auth.isAuthenticated">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import AppShell from '@/components/layout/AppShell.vue';
import { useAuthStore } from '@/stores/auth';
import { useSync } from '@/composables/useSync';

const auth = useAuthStore();
const { startSync } = useSync();

onMounted(async () => {
  await auth.refresh();
  if (auth.isAuthenticated) {
    startSync();
  }
});
</script>
