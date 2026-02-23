<template>
  <div class="note-card" :style="cardStyle">
    <div class="note-card-header">
      <span v-if="note.isPinned" class="pin-indicator">&#x1f4cc;</span>
      <h3 class="note-title">{{ note.title || 'Sans titre' }}</h3>
    </div>
    <p class="note-preview">{{ preview }}</p>
    <div class="note-meta">
      <span v-if="note.scheduledDate" class="note-date">{{ formatDate(note.scheduledDate) }}</span>
      <span class="note-updated">{{ formatRelative(note.updatedAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Note } from '@time-gestion/shared';
import { useCategoriesStore } from '@/stores/categories';

const props = defineProps<{ note: Note }>();
const categoriesStore = useCategoriesStore();

const category = computed(() => {
  if (!props.note.categoryId) return null;
  return categoriesStore.categories.find(c => c.id === props.note.categoryId);
});

const cardStyle = computed(() => {
  if (!category.value) return {};
  const style = category.value.style;
  return style?.backgroundColor ? { borderLeft: `4px solid ${style.backgroundColor}` } : {};
});

const preview = computed(() => {
  try {
    const content = props.note.content as Record<string, unknown>;
    if (!content?.content) return '';
    const texts: string[] = [];
    function extractText(node: Record<string, unknown>) {
      if (node.text) texts.push(node.text as string);
      if (Array.isArray(node.content)) (node.content as Record<string, unknown>[]).forEach(extractText);
    }
    (content.content as Record<string, unknown>[]).forEach(extractText);
    return texts.join(' ').substring(0, 100);
  } catch {
    return '';
  }
});

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
</script>

<style scoped>
.note-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 12px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.note-card:active {
  box-shadow: var(--shadow);
}

.note-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pin-indicator {
  font-size: 12px;
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-preview {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-meta {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.note-date {
  color: var(--color-primary);
  font-weight: 500;
}
</style>
