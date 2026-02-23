import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiFetch } from '@/api/client';
import type { Share, CreateShareDto } from '@time-gestion/shared';

export const useSharesStore = defineStore('shares', () => {
  const sharedWithMe = ref<Share[]>([]);
  const loading = ref(false);

  async function loadSharedWithMe() {
    loading.value = true;
    try {
      sharedWithMe.value = await apiFetch<Share[]>('/shares/with-me');
    } catch (e) {
      console.error('Failed to load shares:', e);
    } finally {
      loading.value = false;
    }
  }

  async function createShare(dto: CreateShareDto) {
    return apiFetch<Share>('/shares', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async function removeShare(id: string) {
    await apiFetch(`/shares/${id}`, { method: 'DELETE' });
    sharedWithMe.value = sharedWithMe.value.filter(s => s.id !== id);
  }

  return { sharedWithMe, loading, loadSharedWithMe, createShare, removeShare };
});
