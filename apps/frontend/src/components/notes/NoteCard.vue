<template>
  <div class="note-card">
    <div class="category-bar" v-if="category" :style="{ background: category.style?.backgroundColor || 'var(--color-primary)' }"></div>
    <div class="note-card-left">
      <span v-if="note.isPinned" class="pin-icon">
        <Pin :size="12" />
      </span>
      <div class="note-card-text">
        <div class="note-title">{{ note.title || 'Sans titre' }}</div>
        <div class="note-subtitle">
          <span class="note-date">{{ formatRelative(note.updatedAt) }}</span>
          <span v-if="group" class="note-group-label">
            <span class="group-dot" :style="{ background: group.color }"></span>
            {{ group.name }}
          </span>
          <span v-if="preview" class="note-preview-text">{{ preview }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Note } from '@time-gestion/shared';
import { useCategoriesStore } from '@/stores/categories';
import { useCalendarsStore } from '@/stores/calendars';
import { Pin } from 'lucide-vue-next';

const props = defineProps<{ note: Note }>();
const categoriesStore = useCategoriesStore();
const calendarsStore = useCalendarsStore();

const category = computed(() => {
  if (!props.note.categoryId) return null;
  return categoriesStore.categories.find(c => c.id === props.note.categoryId);
});

const group = computed(() => {
  if (!props.note.calendarId) return null;
  return calendarsStore.calendars.find(c => c.id === props.note.calendarId) || null;
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
    return texts.join(' ').substring(0, 80);
  } catch {
    return '';
  }
});

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
</script>

<style scoped>
.note-card {
  display: flex;
  align-items: stretch;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 56px;
  gap: 12px;
}

.note-card:active {
  background: var(--color-bg-secondary);
}

.category-bar {
  width: 3px;
  border-radius: 2px;
  flex-shrink: 0;
  align-self: stretch;
}

.note-card-left {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.pin-icon {
  color: var(--color-warning);
  margin-top: 3px;
  flex-shrink: 0;
}

.note-card-text {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text);
}

.note-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
}

.note-date {
  font-weight: 400;
  flex-shrink: 0;
}

.note-group-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
  flex-shrink: 0;
}

.group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.note-preview-text {
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
