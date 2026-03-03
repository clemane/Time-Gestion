<template>
  <div class="swipe-action" ref="containerRef">
    <div class="swipe-action__actions swipe-action__actions--right">
      <slot name="right" />
    </div>
    <div
      class="swipe-action__content"
      :style="{ transform: `translateX(${offsetX}px)`, transition: animating ? 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none' }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useHaptic } from '@/composables/useHaptic';

const haptic = useHaptic();

const containerRef = ref<HTMLElement | null>(null);
const offsetX = ref(0);
const animating = ref(false);

let startX = 0;
let startY = 0;
let tracking = false;
let isOpen = false;
let directionLocked = false;
let isHorizontal = false;

const THRESHOLD = 80;
const DEAD_ZONE = 10;

function onTouchStart(e: TouchEvent) {
  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  tracking = false;
  directionLocked = false;
  isHorizontal = false;
  animating.value = false;
}

function onTouchMove(e: TouchEvent) {
  const touch = e.touches[0];
  const deltaX = touch.clientX - startX;
  const deltaY = touch.clientY - startY;

  // Lock direction after passing dead zone
  if (!directionLocked && (Math.abs(deltaX) > DEAD_ZONE || Math.abs(deltaY) > DEAD_ZONE)) {
    directionLocked = true;
    isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
  }

  // If vertical scroll, bail out
  if (directionLocked && !isHorizontal) {
    return;
  }

  if (directionLocked && isHorizontal) {
    e.preventDefault();
    tracking = true;

    if (isOpen) {
      // Already open: allow dragging back toward closed position
      const newOffset = -THRESHOLD + deltaX;
      offsetX.value = Math.min(0, Math.max(-THRESHOLD, newOffset));
    } else {
      // Only allow swiping left (negative deltaX)
      offsetX.value = Math.min(0, Math.max(-THRESHOLD - 20, deltaX));
    }
  }
}

function onTouchEnd() {
  if (!tracking) {
    // If was open and user tapped without swiping, close it
    if (isOpen) {
      snapClose();
    }
    return;
  }

  animating.value = true;

  if (Math.abs(offsetX.value) >= THRESHOLD) {
    snapOpen();
  } else {
    snapClose();
  }
}

function snapOpen() {
  animating.value = true;
  offsetX.value = -THRESHOLD;
  isOpen = true;
  haptic.medium();
}

function snapClose() {
  animating.value = true;
  offsetX.value = 0;
  isOpen = false;
}

function close() {
  snapClose();
}

defineExpose({ close });
</script>

<style>
.swipe-action {
  position: relative;
  overflow: hidden;
}

.swipe-action__content {
  position: relative;
  z-index: 1;
  background: var(--color-bg-elevated);
}

.swipe-action__actions--right {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: stretch;
}

.swipe-action__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  border: none;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.swipe-action__action-btn--danger {
  background: var(--color-danger);
}

.swipe-action__action-btn--warning {
  background: var(--color-warning, #D97706);
}
</style>
