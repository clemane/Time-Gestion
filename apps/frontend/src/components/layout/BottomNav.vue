<template>
  <Transition name="nav-slide">
  <nav v-show="navVisible" class="floating-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
    >
      <component :is="item.icon" :size="20" :stroke-width="isActive(item.to) ? 2.2 : 1.6" />
      <span class="nav-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
  </Transition>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router';
import { Home, FileText, Calendar, UtensilsCrossed, Settings } from 'lucide-vue-next';
import { useNavVisible } from '@/composables/useNavVisibility';

const { navVisible } = useNavVisible();

const route = useRoute();

const navItems = [
  { to: '/dashboard', label: 'Accueil', icon: Home },
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
.floating-nav {
  position: fixed;
  bottom: calc(16px + var(--safe-area-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: var(--bar-bg);
  backdrop-filter: blur(var(--bar-blur)) saturate(1.6);
  -webkit-backdrop-filter: blur(var(--bar-blur)) saturate(1.6);
  border: 1px solid var(--bar-border);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 12px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 18px;
  transition: color var(--transition-fast), background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.nav-item.active {
  color: white;
  background: var(--color-primary);
}

.nav-label {
  line-height: 1;
}

.nav-slide-enter-active,
.nav-slide-leave-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms ease;
}

.nav-slide-enter-from,
.nav-slide-leave-to {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}

/* Hide on desktop */
@media (min-width: 1025px) {
  .floating-nav {
    display: none;
  }
}
</style>
