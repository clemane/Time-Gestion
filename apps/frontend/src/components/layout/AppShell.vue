<template>
  <div class="app-shell grain-bg">
    <div class="status-bar" v-if="!isOnline">
      <WifiOff :size="14" />
      <span>Mode hors-ligne</span>
    </div>

    <!-- Desktop sidebar (hidden on mobile) -->
    <aside class="desktop-sidebar">
      <div class="sidebar-brand">
        <span class="brand-mark">TG</span>
        <span class="brand-name">Time Gestion</span>
      </div>
      <nav class="sidebar-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ active: isActive(item.to) }"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="app-content">
      <slot />
    </main>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';
import BottomNav from './BottomNav.vue';
import { isOnline } from '@/sync/online';
import { FileText, Calendar, UtensilsCrossed, Settings, WifiOff } from 'lucide-vue-next';

const route = useRoute();

const navItems = [
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/calendar', label: 'Calendrier', icon: Calendar },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/settings', label: 'Reglages', icon: Settings },
];

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}
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
  color: #2C2520;
  text-align: center;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.desktop-sidebar {
  display: none;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(var(--nav-height) + 24px + var(--safe-area-bottom));
  -webkit-overflow-scrolling: touch;
}

/* ── Desktop layout ── */
@media (min-width: 1025px) {
  .app-shell {
    flex-direction: row;
  }

  .desktop-sidebar {
    display: flex;
    flex-direction: column;
    width: 240px;
    flex-shrink: 0;
    background: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    padding: 24px 12px;
    gap: 32px;
  }

  .app-content {
    flex: 1;
    padding-bottom: 0;
    max-width: 900px;
  }
}

/* ── Sidebar brand ── */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 400;
}

.brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--color-text);
}

/* ── Sidebar nav links ── */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.sidebar-link:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.sidebar-link.active {
  background: var(--color-primary-ghost);
  color: var(--color-primary);
}
</style>
