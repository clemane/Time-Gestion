<template>
  <Transition name="banner">
    <div v-if="canInstall && !dismissed" class="install-banner">
      <div class="banner-icon">
        <Download :size="20" />
      </div>
      <div class="banner-text">
        <span class="banner-title">Installer Time Gestion</span>
        <span class="banner-desc">Acces rapide depuis l'ecran d'accueil</span>
      </div>
      <button class="banner-btn" @click="install">Installer</button>
      <button class="banner-close" @click="dismiss">
        <X :size="16" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Download, X } from 'lucide-vue-next';
import { usePwaInstall } from '@/composables/usePwaInstall';

const { canInstall, dismissed, install, dismiss } = usePwaInstall();
</script>

<style scoped>
.install-banner {
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.banner-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.banner-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.banner-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.banner-btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.banner-btn:active {
  opacity: 0.8;
}

.banner-close {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

/* Transition */
.banner-enter-active {
  transition: transform 400ms var(--spring), opacity 300ms ease;
}
.banner-leave-active {
  transition: transform 250ms ease, opacity 200ms ease;
}
.banner-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.banner-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
