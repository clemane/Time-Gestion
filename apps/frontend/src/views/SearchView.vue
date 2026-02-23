<template>
  <div class="search-view">
    <header class="search-header">
      <h1>Recherche</h1>
    </header>

    <div class="search-input-wrap">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input v-model="query" type="search" placeholder="Rechercher notes et evenements..." autofocus @input="debouncedSearch" />
    </div>

    <div class="results" v-if="query">
      <!-- Notes results -->
      <div v-if="noteResults.length > 0" class="result-section">
        <h3>Notes ({{ noteResults.length }})</h3>
        <div v-for="note in noteResults" :key="note.id" class="result-item" @click="$router.push(`/notes/${note.id}`)">
          <span class="result-icon">&#x1f4dd;</span>
          <div>
            <div class="result-title">{{ note.title }}</div>
            <div class="result-preview">{{ getPreview(note) }}</div>
          </div>
        </div>
      </div>

      <!-- Events results -->
      <div v-if="eventResults.length > 0" class="result-section">
        <h3>Evenements ({{ eventResults.length }})</h3>
        <div v-for="evt in eventResults" :key="evt.id" class="result-item">
          <span class="result-icon">&#x1f4c5;</span>
          <div>
            <div class="result-title">{{ evt.title }}</div>
            <div class="result-preview">{{ formatEventDate(evt) }}</div>
          </div>
        </div>
      </div>

      <p v-if="noteResults.length === 0 && eventResults.length === 0" class="no-results">
        Aucun resultat pour "{{ query }}"
      </p>
    </div>

    <div v-else class="empty-state">
      <p>Recherchez dans vos notes et evenements</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { Note, CalendarEvent } from '@time-gestion/shared';

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

  // Search notes in IndexedDB
  const allNotes = await db.notes.filter(n => !n.deletedAt).toArray();
  noteResults.value = allNotes.filter(n => {
    if (n.title.toLowerCase().includes(q)) return true;
    // Search in content text
    try {
      const text = extractText(n.content as Record<string, unknown>);
      return text.toLowerCase().includes(q);
    } catch {
      return false;
    }
  });

  // Search events in IndexedDB
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
}

.search-header {
  padding: 16px;
}

.search-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 16px;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-secondary);
}

.search-input-wrap input {
  flex: 1;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 16px;
  outline: none;
}

.search-input-wrap svg {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.results {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.result-section {
  margin-bottom: 20px;
}

.result-section h3 {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius);
  cursor: pointer;
  margin-bottom: 4px;
}

.result-item:active {
  background: var(--color-bg-secondary);
}

.result-icon {
  font-size: 16px;
  margin-top: 2px;
}

.result-title {
  font-weight: 500;
  font-size: 15px;
}

.result-preview {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.no-results {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}
</style>
