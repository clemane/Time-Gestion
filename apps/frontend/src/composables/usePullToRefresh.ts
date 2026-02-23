import { ref } from 'vue';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const pulling = ref(false);
  const pullDistance = ref(0);
  const refreshing = ref(false);
  const threshold = 80;

  let startY = 0;
  let isPulling = false;

  function onTouchStart(e: TouchEvent) {
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isPulling) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      pullDistance.value = Math.min(diff * 0.5, 120);
      pulling.value = true;
      if (diff > 10) e.preventDefault();
    }
  }

  async function onTouchEnd() {
    if (!isPulling) return;
    isPulling = false;

    if (pullDistance.value >= threshold) {
      refreshing.value = true;
      try {
        await onRefresh();
      } finally {
        refreshing.value = false;
      }
    }

    pullDistance.value = 0;
    pulling.value = false;
  }

  return { pulling, pullDistance, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}
