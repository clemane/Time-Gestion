import { watch } from 'vue';
import { isOnline } from '@/sync/online';
import { pushPendingChanges, pullRemoteChanges } from '@/sync/engine';

export function useSync() {
  let syncInterval: ReturnType<typeof setInterval> | null = null;

  async function sync() {
    if (!isOnline.value) return;
    try {
      await pushPendingChanges();
      await pullRemoteChanges();
    } catch (e) {
      console.error('Sync failed:', e);
    }
  }

  function startSync() {
    sync();
    syncInterval = setInterval(sync, 30_000);
  }

  function stopSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }

  watch(isOnline, (online) => {
    if (online) sync();
  });

  return { sync, startSync, stopSync, isOnline };
}
