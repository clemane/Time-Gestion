import { ref } from 'vue'
import { db } from '@/db/schema'

export function useSyncStatus() {
  const pendingCount = ref(0)
  let intervalId: ReturnType<typeof setInterval> | null = null

  async function updateCount() {
    try {
      pendingCount.value = await db.syncQueue.count()
    } catch {
      // ignore errors
    }
  }

  function startWatching() {
    updateCount()
    intervalId = setInterval(updateCount, 5000)
  }

  function stopWatching() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return { pendingCount, startWatching, stopWatching }
}
