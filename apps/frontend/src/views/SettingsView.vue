<template>
  <div class="settings-view">
    <header class="settings-header">
      <h1>Parametres</h1>
    </header>

    <!-- User info -->
    <div class="settings-section">
      <div class="user-card" v-if="auth.user">
        <div class="user-avatar">
          {{ initials }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ auth.user.displayName }}</span>
          <span class="user-email">{{ auth.user.email }}</span>
        </div>
      </div>
    </div>

    <!-- Settings links -->
    <div class="settings-section">
      <h2 class="section-title">Gestion</h2>
      <router-link to="/settings/categories" class="settings-link">
        <span class="link-icon">&#x1f3f7;&#xfe0f;</span>
        <span class="link-text">Gerer les categories</span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="link-arrow">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </router-link>
    </div>

    <!-- Logout -->
    <div class="settings-section">
      <button class="btn-logout" @click="handleLogout">
        Se deconnecter
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const initials = computed(() => {
  if (!auth.user?.displayName) return '?';
  return auth.user.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<style scoped>
.settings-view {
  padding-bottom: 32px;
}

.settings-header {
  padding: 16px;
}

.settings-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.settings-section {
  padding: 0 16px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
}

.user-email {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.settings-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--color-text);
  transition: box-shadow 0.2s;
}

.settings-link:active {
  box-shadow: var(--shadow);
}

.link-icon {
  font-size: 20px;
}

.link-text {
  flex: 1;
  font-size: 15px;
}

.link-arrow {
  color: var(--color-text-secondary);
}

.btn-logout {
  width: 100%;
  padding: 14px;
  background: none;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius);
  color: var(--color-danger);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:active {
  background: rgba(239, 68, 68, 0.1);
}
</style>
