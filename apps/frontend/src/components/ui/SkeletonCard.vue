<template>
  <div class="skeleton-card">
    <div class="skeleton-line skeleton-title"></div>
    <div class="skeleton-line skeleton-preview"></div>
  </div>
</template>

<style scoped>
.skeleton-card {
  padding: 12px 16px;
  min-height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.skeleton-line {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-title {
  height: 14px;
  width: 55%;
  margin-bottom: 8px;
}

.skeleton-preview {
  height: 12px;
  width: 80%;
}
</style>
