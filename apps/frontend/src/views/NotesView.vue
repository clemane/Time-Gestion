<template>
  <div
    class="notes-view"
    @touchstart="ptr.onTouchStart"
    @touchmove="ptr.onTouchMove"
    @touchend="ptr.onTouchEnd"
  >
    <!-- Pull-to-refresh indicator -->
    <div class="pull-indicator" :style="{ height: ptr.pullDistance.value + 'px' }">
      <div v-if="ptr.refreshing.value" class="pull-spinner"></div>
      <svg
        v-else-if="ptr.pulling.value"
        class="pull-arrow"
        :class="{ 'pull-ready': ptr.pullDistance.value >= 80 }"
        viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"
      >
        <polyline points="7 13 12 18 17 13"/>
        <line x1="12" y1="2" x2="12" y2="18"/>
      </svg>
    </div>

    <header class="notes-header">
      <h1>Notes</h1>
      <button class="btn-icon" @click="showFolders = !showFolders">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </header>

    <!-- Search -->
    <div class="search-bar">
      <input v-model="searchQuery" type="search" placeholder="Rechercher dans les notes..." />
    </div>

    <!-- Folder filter sidebar (slide-over) -->
    <div class="folder-overlay" v-if="showFolders" @click="showFolders = false">
      <div class="folder-sidebar" @click.stop>
        <h2>Dossiers</h2>
        <button class="folder-item" :class="{ active: !selectedFolderId }" @click="selectedFolderId = null; showFolders = false">
          Toutes les notes
        </button>
        <button v-for="folder in folders" :key="folder.id" class="folder-item" :class="{ active: selectedFolderId === folder.id }" @click="selectedFolderId = folder.id; showFolders = false">
          {{ folder.name }}
        </button>
      </div>
    </div>

    <!-- Notes list -->
    <div class="notes-list">
      <div v-if="pinnedNotes.length" class="notes-section">
        <h3 class="section-title">Epinglees</h3>
        <NoteCard v-for="note in pinnedNotes" :key="note.id" :note="note" @click="openNote(note.id)" />
      </div>
      <div class="notes-section">
        <h3 v-if="pinnedNotes.length" class="section-title">Autres</h3>
        <NoteCard v-for="note in otherNotes" :key="note.id" :note="note" @click="openNote(note.id)" />
      </div>
      <p v-if="filteredNotes.length === 0" class="empty">Aucune note</p>
    </div>

    <!-- FAB -->
    <button class="fab" @click="createNote">+</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { useFoldersStore } from '@/stores/folders';
import { usePullToRefresh } from '@/composables/usePullToRefresh';
import { useSync } from '@/composables/useSync';
import NoteCard from '@/components/notes/NoteCard.vue';

const router = useRouter();
const notesStore = useNotesStore();
const foldersStore = useFoldersStore();
const { sync } = useSync();

const ptr = usePullToRefresh(async () => {
  await sync();
  await notesStore.loadFromLocal();
  await foldersStore.loadFromLocal();
});

const searchQuery = ref('');
const selectedFolderId = ref<string | null>(null);
const showFolders = ref(false);

const folders = computed(() => foldersStore.folders);

const filteredNotes = computed(() => {
  let result = notesStore.notes;
  if (selectedFolderId.value) {
    result = result.filter(n => n.folderId === selectedFolderId.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(n => n.title.toLowerCase().includes(q));
  }
  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
});

const pinnedNotes = computed(() => filteredNotes.value.filter(n => n.isPinned));
const otherNotes = computed(() => filteredNotes.value.filter(n => !n.isPinned));

async function createNote() {
  const note = await notesStore.create({ title: 'Nouvelle note' });
  router.push(`/notes/${note.id}`);
}

function openNote(id: string) {
  router.push(`/notes/${id}`);
}

onMounted(async () => {
  await notesStore.loadFromLocal();
  await foldersStore.loadFromLocal();
});
</script>

<style scoped>
.notes-view {
  position: relative;
  height: 100%;
  overflow-y: auto;
}

.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.2s;
}

.pull-arrow {
  transition: transform 0.2s;
  color: var(--color-text-secondary);
  transform: rotate(180deg);
}

.pull-arrow.pull-ready {
  transform: rotate(0deg);
  color: var(--color-primary);
}

.pull-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.notes-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius);
}

.search-bar {
  padding: 0 16px 12px;
}

.search-bar input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 15px;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.folder-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 200;
}

.folder-sidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--color-bg);
  padding: 20px 16px;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.folder-sidebar h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.folder-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 15px;
  border-radius: var(--radius);
  cursor: pointer;
}

.folder-item.active {
  background: var(--color-primary);
  color: white;
}

.notes-list {
  padding: 0 16px;
}

.section-title {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  margin-top: 8px;
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px;
}

.fab {
  position: fixed;
  bottom: calc(72px + var(--safe-area-bottom));
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  font-size: 28px;
  font-weight: 300;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
