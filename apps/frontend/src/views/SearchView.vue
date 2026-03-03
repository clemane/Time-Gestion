<template>
  <div class="search-view">
    <header class="search-header">
      <h1>Recherche</h1>
    </header>

    <div class="search-input-wrap">
      <Search :size="18" />
      <input v-model="query" type="search" placeholder="Rechercher notes et evenements..." autofocus @input="debouncedSearch" />
    </div>

    <div class="results" v-if="query">
      <!-- Notes results -->
      <div v-if="noteResults.length > 0" class="result-section">
        <h3>Notes ({{ noteResults.length }})</h3>
        <TransitionGroup name="list-stagger" appear>
          <div v-for="(note, index) in noteResults" :key="note.id" class="result-item" :style="{ '--stagger-delay': `${index * 50}ms` }" @click="$router.push(`/notes/${note.id}`)">
            <span class="result-icon"><FileText :size="16" /></span>
            <div>
              <div class="result-title">{{ note.title }}</div>
              <div class="result-preview">{{ getPreview(note) }}</div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Events results -->
      <div v-if="eventResults.length > 0" class="result-section">
        <h3>Evenements ({{ eventResults.length }})</h3>
        <TransitionGroup name="list-stagger" appear>
          <div v-for="(evt, index) in eventResults" :key="evt.id" class="result-item" :style="{ '--stagger-delay': `${index * 50}ms` }">
            <span class="result-icon"><Calendar :size="16" /></span>
            <div>
              <div class="result-title">{{ evt.title }}</div>
              <div class="result-preview">{{ formatEventDate(evt) }}</div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <EmptyState
        v-if="noteResults.length === 0 && eventResults.length === 0"
        :icon="SearchX"
        :title="`Aucun resultat pour &quot;${query}&quot;`"
        description="Essayez avec d'autres termes de recherche"
      />
    </div>

    <EmptyState
      v-if="!query"
      :icon="SearchIcon"
      title="Recherchez dans vos notes et evenements"
      description="Tapez un mot-cle pour commencer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { db } from '@/db/schema';
import { Search as SearchIcon, FileText, Calendar, SearchX } from 'lucide-vue-next';
import EmptyState from '@/components/ui/EmptyState.vue';
import type { Note, CalendarEvent } from '@time-gestion/shared';

// Alias for template usage
const Search = SearchIcon;

const query = ref('');
const noteResults = ref<Note[]>([]);
const eventResults = ref<CalendarEvent[]>([]);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(search, 300);
}

async function search() {
  const q = query.value.toLowerCase().trim();
  if (!q) {
    noteResults.value = [];
    eventResults.value = [];
    return;
  }

  const allNotes = await db.notes.filter(n => !n.deletedAt).toArray();
  noteResults.value = allNotes.filter(n => {
    if (n.title.toLowerCase().includes(q)) return true;
    try {
      const text = extractText(n.content as Record<string, unknown>);
      return text.toLowerCase().includes(q);
    } catch {
      return false;
    }
  });

  const allEvents = await db.events.filter(e => !e.deletedAt).toArray();
  eventResults.value = allEvents.filter(e => {
    return e.title.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q));
  });
}

function extractText(node: Record<string, unknown>): string {
  if (!node) return '';
  const texts: string[] = [];
  if (typeof node.text === 'string') texts.push(node.text);
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      texts.push(extractText(child as Record<string, unknown>));
    }
  }
  return texts.join(' ');
}

function getPreview(note: Note): string {
  try {
    return extractText(note.content as Record<string, unknown>).substring(0, 80);
  } catch {
    return '';
  }
}

function formatEventDate(evt: CalendarEvent): string {
  const date = new Date(evt.startAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  if (evt.allDay) return date;
  const time = new Date(evt.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} a ${time}`;
}
</script>

<style scoped>
.search-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.search-header {
  padding: 20px 20px 12px;
}

.search-header h1 {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--color-text);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 16px;
  padding: 10px 12px;
  border: none;
  border-radius: var(--radius);
  background: var(--color-bg-secondary);
  transition: none;
}

.search-input-wrap:focus-within {
  border: none;
  box-shadow: none;
}

.search-input-wrap input {
  flex: 1;
  border: none;
  background: none;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 17px;
  outline: none;
}

.search-input-wrap input::placeholder {
  color: var(--color-text-tertiary);
}

.search-input-wrap svg {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.results {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.result-section {
  margin-bottom: 24px;
}

.result-section h3 {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-weight: 600;
  margin-bottom: 4px;
  padding-left: 16px;
  font-family: var(--font-body);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 44px;
  border-radius: 0;
  cursor: pointer;
  margin-bottom: 0;
  background: var(--color-bg-elevated);
  border: none;
  -webkit-tap-highlight-color: transparent;
  transition: opacity var(--transition-fast);
  position: relative;
}

.result-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 44px;
  right: 0;
  height: 0.5px;
  background: var(--color-border);
}

.result-item:last-child::after {
  display: none;
}

.result-item:first-of-type {
  border-radius: var(--radius) var(--radius) 0 0;
}

.result-item:last-of-type {
  border-radius: 0 0 var(--radius) var(--radius);
}

.result-item:first-of-type:last-of-type {
  border-radius: var(--radius);
}

.result-item:hover {
  background: var(--color-bg-elevated);
}

.result-item:active {
  opacity: 0.6;
  background: var(--color-bg-elevated);
}

.result-icon {
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.result-title {
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 17px;
  color: var(--color-text);
}

.result-preview {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-top: 1px;
  line-height: 1.4;
}
</style>
