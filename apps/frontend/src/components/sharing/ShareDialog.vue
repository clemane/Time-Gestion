<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="share-dialog" @click.stop>
      <header class="share-dialog-header">
        <h2>Partager</h2>
        <button class="btn-close" @click="$emit('close')">&#x2715;</button>
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
          <button class="btn-remove" @click="removeShare(s.id)">&#x2715;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSharesStore } from '@/stores/shares';
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
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}

.share-dialog {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
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
  font-size: 18px;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 4px;
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.field input,
.field select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 15px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: var(--color-primary);
}

.error {
  color: var(--color-danger);
  font-size: 13px;
  margin-bottom: 12px;
}

.success {
  color: var(--color-success);
  font-size: 13px;
  margin-bottom: 12px;
}

.btn-primary-sm {
  width: 100%;
  padding: 10px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.current-shares {
  margin-top: 24px;
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
}

.current-shares h3 {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.share-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
  margin-bottom: 6px;
}

.share-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.share-user {
  font-size: 14px;
  font-weight: 500;
}

.share-perm {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.btn-remove {
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius);
}

.btn-remove:active {
  background: rgba(239, 68, 68, 0.1);
}
</style>
