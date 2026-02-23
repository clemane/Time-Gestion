export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  let startX = 0;
  let startY = 0;

  function onTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    const diffX = e.changedTouches[0].clientX - startX;
    const diffY = e.changedTouches[0].clientY - startY;

    // Only trigger if horizontal movement is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
  }

  return { onTouchStart, onTouchEnd };
}
