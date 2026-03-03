<template>
  <Transition name="modal">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="share-dialog" @click.stop>
        <header class="share-dialog-header">
          <h2>Partager</h2>
          <button class="btn-close" @click="$emit('close')">
            <X :size="18" />
          </button>
        </header>

        <form @submit.prevent="share">
          <div class="field">
            <label>Email de l'utilisateur</label>
            <input v-model="email" type="email" required placeholder="utilisateur@exemple.com" />
          </div>
          <div class="field">
            <label>Permission</label>
            <select v-model="permission">
              <option value="READ">Lecture seule</option>
              <option value="WRITE">Lecture et ecriture</option>
            </select>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">Partage cree avec succes !</p>
          <button type="submit" class="btn-primary-sm" :disabled="submitting">
            {{ submitting ? 'Partage...' : 'Partager' }}
          </button>
        </form>

        <!-- Current shares list -->
        <div v-if="currentShares.length > 0" class="current-shares">
          <h3>Partages actuels</h3>
          <div v-for="s in currentShares" :key="s.id" class="share-item">
            <div class="share-item-info">
              <span class="share-user">{{ s.sharedWithId }}</span>
              <span class="share-perm">{{ s.permission === 'READ' ? 'Lecture' : 'Ecriture' }}</span>
            </div>
            <button class="btn-remove" @click="removeShare(s.id)">
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSharesStore } from '@/stores/shares';
import { X } from 'lucide-vue-next';
import type { ResourceType, Permission } from '@time-gestion/shared';

const props = defineProps<{
  resourceType: ResourceType;
  resourceId: string;
}>();

defineEmits<{ close: [] }>();
const sharesStore = useSharesStore();

const email = ref('');
const permission = ref<Permission>('READ');
const error = ref('');
const success = ref(false);
const submitting = ref(false);

const currentShares = computed(() =>
  sharesStore.sharedWithMe.filter(s => s.resourceId === props.resourceId)
);

async function share() {
  error.value = '';
  success.value = false;
  submitting.value = true;
  try {
    await sharesStore.createShare({
      resourceType: props.resourceType,
      resourceId: props.resourceId,
      sharedWithEmail: email.value,
      permission: permission.value,
    });
    success.value = true;
    email.value = '';
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Erreur lors du partage';
  } finally {
    submitting.value = false;
  }
}

async function removeShare(id: string) {
  await sharesStore.removeShare(id);
}
</script>

<style scoped>
/* ── Share Dialog · Terre & Sauge ── */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 37, 32, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}

.share-dialog {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.share-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.share-dialog-header h2 {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--color-text);
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-tertiary);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-close:active {
  opacity: 0.5;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  margin-bottom: 6px;
}

.field input,
.field select {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 17px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
  transition: border-color 200ms ease;
}

.field input:focus,
.field select:focus {
  border-color: var(--color-primary);
}

.error {
  color: var(--color-danger);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: var(--color-danger-ghost);
  border-radius: var(--radius);
}

.success {
  color: var(--color-success);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: rgba(107, 158, 118, 0.08);
  border-radius: var(--radius);
}

.btn-primary-sm {
  width: 100%;
  height: 50px;
  padding: 0 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary-sm:active {
  opacity: 0.7;
}

.btn-primary-sm:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.current-shares {
  margin-top: 24px;
  padding-top: 16px;
}

.current-shares h3 {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: -0.01em;
  font-weight: 400;
  margin-bottom: 8px;
}

.share-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-radius: 0;
  margin-bottom: 0;
  position: relative;
}

.share-item:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0.5px;
  background: var(--color-border);
}

.share-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.share-user {
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  color: var(--color-text);
}

.share-perm {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.btn-remove {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-remove:active {
  opacity: 0.5;
}

/* ── Modal transition ── */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active .share-dialog,
.modal-leave-active .share-dialog {
  transition: transform 250ms ease, opacity 200ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .share-dialog {
  transform: scale(0.96);
  opacity: 0;
}

.modal-leave-to .share-dialog {
  transform: scale(0.96);
  opacity: 0;
}
</style>
