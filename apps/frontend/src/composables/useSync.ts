import { watch } from 'vue';
import { isOnline } from '@/sync/online';
import { pushPendingChanges, pullRemoteChanges } from '@/sync/engine';

export function useSync() {
  let syncInterval: ReturnType<typeof setInterval> | null = null;
  let currentRate = 30_000;

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
    syncInterval = setInterval(sync, currentRate);
  }

  function stopSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }

  function setSyncRate(ms: number) {
    currentRate = ms;
    if (syncInterval) {
      stopSync();
      startSync();
    }
  }

  watch(isOnline, (online) => {
    if (online) sync();
  });

  return { sync, startSync, stopSync, setSyncRate, isOnline };
}
