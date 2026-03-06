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
      <div class="header-actions">
        <button class="btn-icon" @click="showSearch = !showSearch">
          <Search :size="22" />
        </button>
        <button class="btn-icon" @click="showFolders = !showFolders">
          <FolderOpen :size="22" />
        </button>
      </div>
    </header>

    <!-- Search -->
    <Transition name="search-slide">
      <div class="search-bar" v-if="showSearch">
        <input v-model="searchQuery" type="search" placeholder="Rechercher dans les notes..." />
      </div>
    </Transition>

    <!-- Group filter chips -->
    <div class="group-chips" v-if="calendarsStore.calendars.length > 0">
      <button
        class="group-chip"
        :class="{ active: selectedGroupId === null }"
        @click="selectedGroupId = null"
      >Tous</button>
      <button
        v-for="cal in calendarsStore.calendars"
        :key="cal.id"
        class="group-chip"
        :class="{ active: selectedGroupId === cal.id }"
        @click="selectedGroupId = cal.id"
      >
        <span class="group-chip-dot" :style="{ background: cal.color }"></span>
        {{ cal.name }}
      </button>
    </div>

    <!-- Tag filter chips -->
    <div class="tag-chips" v-if="allNoteTags.length > 0">
      <button
        class="tag-chip"
        :class="{ active: activeTag === null }"
        @click="activeTag = null"
      >Tous</button>
      <button
        v-for="tag in allNoteTags"
        :key="tag"
        class="tag-chip"
        :class="{ active: activeTag === tag }"
        @click="activeTag = tag"
      >
        #{{ tag }}
      </button>
    </div>

    <!-- Folder filter sidebar (slide-over) -->
    <Transition name="drawer">
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
    </Transition>

    <!-- Notes list -->
    <div class="notes-list">
      <!-- Skeleton loading -->
      <template v-if="loading">
        <SkeletonCard v-for="i in 5" :key="i" />
      </template>
      <template v-else>
        <div v-if="pinnedNotes.length" class="notes-section">
          <h3 class="section-title">Epinglees</h3>
          <TransitionGroup name="list-stagger" appear>
            <SwipeAction
              v-for="(note, index) in pinnedNotes"
              :key="note.id"
              :style="{ '--stagger-delay': `${index * 50}ms` }"
            >
              <NoteCard
                :note="note"
                @click="openNote(note.id)"
              />
              <template #right>
                <button class="swipe-action__action-btn swipe-action__action-btn--danger" @click="deleteNote(note.id)">
                  Supprimer
                </button>
              </template>
            </SwipeAction>
          </TransitionGroup>
        </div>
        <div class="notes-section">
          <h3 v-if="pinnedNotes.length" class="section-title">Autres</h3>
          <TransitionGroup name="list-stagger" appear>
            <SwipeAction
              v-for="(note, index) in otherNotes"
              :key="note.id"
              :style="{ '--stagger-delay': `${(pinnedNotes.length + index) * 50}ms` }"
            >
              <NoteCard
                :note="note"
                @click="openNote(note.id)"
              />
              <template #right>
                <button class="swipe-action__action-btn swipe-action__action-btn--danger" @click="deleteNote(note.id)">
                  Supprimer
                </button>
              </template>
            </SwipeAction>
          </TransitionGroup>
        </div>
        <EmptyState
          v-if="filteredNotes.length === 0"
          :icon="FileText"
          title="Aucune note"
          description="Creez votre premiere note pour commencer"
          action-label="Nouvelle note"
          @action="showNewNoteSheet = true"
        />
      </template>
    </div>

    <!-- FAB -->
    <button class="fab" @click="haptic.light(); showNewNoteSheet = true">
      <Plus :size="24" />
    </button>

    <!-- New note category picker (bottom sheet) -->
    <Transition name="sheet">
      <div v-if="showNewNoteSheet" class="sheet-overlay" @click="showNewNoteSheet = false">
        <div class="sheet-content" @click.stop>
          <div class="sheet-handle"></div>
          <h3 class="sheet-title">Nouvelle note</h3>
          <div class="category-grid">
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="category-chip"
              :style="{ backgroundColor: cat.style?.backgroundColor || 'var(--color-bg-secondary)' }"
              @click="createNoteWithCategory(cat.id, cat.name)"
            >
              <span class="category-chip-icon">{{ cat.icon }}</span>
              <span class="category-chip-name" :style="chipTextStyle(cat.style?.backgroundColor)">{{ cat.name }}</span>
            </button>
            <button class="category-chip" @click="createNoteWithCategory(null, 'Nouvelle note')">
              <span class="category-chip-icon"><FileText :size="20" /></span>
              <span class="category-chip-name">Note vide</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { useFoldersStore } from '@/stores/folders';
import { useCategoriesStore } from '@/stores/categories';
import { useCalendarsStore } from '@/stores/calendars';
import { usePullToRefresh } from '@/composables/usePullToRefresh';
import { useHaptic } from '@/composables/useHaptic';
import { useSync } from '@/composables/useSync';
import NoteCard from '@/components/notes/NoteCard.vue';
import SkeletonCard from '@/components/ui/SkeletonCard.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import SwipeAction from '@/components/ui/SwipeAction.vue';
import { FolderOpen, Plus, FileText, Search } from 'lucide-vue-next';
import { useNavVisibility } from '@/composables/useNavVisibility';

const router = useRouter();
const notesStore = useNotesStore();
const foldersStore = useFoldersStore();
const categoriesStore = useCategoriesStore();
const calendarsStore = useCalendarsStore();
const { sync } = useSync();
const haptic = useHaptic();

const ptr = usePullToRefresh(async () => {
  await sync();
  await notesStore.loadFromLocal();
  await foldersStore.loadFromLocal();
});

const searchQuery = ref('');
const showSearch = ref(false);
const selectedFolderId = ref<string | null>(null);
const selectedGroupId = ref<string | null>(null);
const activeTag = ref<string | null>(null);
const showFolders = ref(false);
const { hideNav, showNav } = useNavVisibility();
const showNewNoteSheet = ref(false);
watch(showNewNoteSheet, (open) => open ? hideNav() : showNav());
const loading = ref(true);

const categories = computed(() => categoriesStore.categories);

const folders = computed(() => foldersStore.folders);

const allNoteTags = computed(() => {
  const tagSet = new Set<string>();
  for (const note of notesStore.notes) {
    if (note.tags) {
      for (const tag of note.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort();
});

function extractText(node: any): string {
  if (!node) return '';
  const texts: string[] = [];
  if (typeof node.text === 'string') texts.push(node.text);
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      texts.push(extractText(child));
    }
  }
  return texts.join(' ');
}

const filteredNotes = computed(() => {
  let result = notesStore.notes;
  if (selectedFolderId.value) {
    result = result.filter(n => n.folderId === selectedFolderId.value);
  }
  if (selectedGroupId.value) {
    result = result.filter(n => n.calendarId === selectedGroupId.value);
  }
  if (activeTag.value) {
    result = result.filter(n => n.tags && n.tags.includes(activeTag.value!));
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(n => {
      if (n.title.toLowerCase().includes(q)) return true;
      try {
        const contentText = extractText(n.content).toLowerCase();
        return contentText.includes(q);
      } catch {
        return false;
      }
    });
  }
  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
});

const pinnedNotes = computed(() => filteredNotes.value.filter(n => n.isPinned));
const otherNotes = computed(() => filteredNotes.value.filter(n => !n.isPinned));

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function chipTextStyle(bgColor?: string) {
  if (!bgColor) return {};
  return { color: isLightColor(bgColor) ? '#374151' : '#f9fafb' };
}

async function createNote() {
  haptic.light();
  const note = await notesStore.create({
    title: '',
    calendarId: selectedGroupId.value || undefined,
  });
  router.push(`/notes/${note.id}`);
}

async function createNoteWithCategory(categoryId: string | null, defaultTitle: string) {
  showNewNoteSheet.value = false;
  const note = await notesStore.create({
    title: defaultTitle,
    categoryId: categoryId || undefined,
    calendarId: selectedGroupId.value || undefined,
  });
  router.push(`/notes/${note.id}`);
}

function openNote(id: string) {
  router.push(`/notes/${id}`);
}

async function deleteNote(id: string) {
  await notesStore.remove(id);
  haptic.success();
}

onMounted(async () => {
  await notesStore.loadFromLocal();
  await foldersStore.loadFromLocal();
  await categoriesStore.loadFromLocal();
  await calendarsStore.loadFromLocal();
  loading.value = false;
});
</script>

<style scoped>
.notes-view {
  position: relative;
  height: 100%;
  overflow-y: auto;
  background: var(--color-bg);
}

/* Pull-to-refresh */
.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height var(--transition-base);
}

.pull-arrow {
  transition: transform var(--transition-base);
  color: var(--color-text-tertiary);
  transform: rotate(180deg);
}

.pull-arrow.pull-ready {
  transform: rotate(0deg);
  color: var(--color-primary);
}

.pull-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Header */
.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px;
}

.notes-header h1 {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--color-text);
  line-height: 1.2;
}

.header-actions {
  display: flex;
  gap: 0;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 10px;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.btn-icon:active {
  background: var(--color-bg-secondary);
}

/* Search */
.search-bar {
  padding: 0 20px 12px;
}

.search-bar input {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius);
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 17px;
  font-family: var(--font-body);
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
}

.search-bar input:focus {
  outline: none;
  background: var(--color-bg-elevated);
  box-shadow: 0 0 0 2px var(--color-primary-ghost);
}

/* Search slide transition */
.search-slide-enter-active,
.search-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.search-slide-enter-from,
.search-slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.search-slide-enter-to,
.search-slide-leave-from {
  opacity: 1;
  max-height: 60px;
}

.search-bar input::placeholder {
  color: var(--color-text-tertiary);
}

/* Group filter chips */
.group-chips {
  display: flex;
  gap: 8px;
  padding: 0 20px 14px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.group-chips::-webkit-scrollbar {
  display: none;
}

.group-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 36px;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.group-chip:active {
  background: var(--color-border);
}

.group-chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.group-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-chip.active .group-chip-dot {
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.5);
}

/* Tag filter chips */
.tag-chips {
  display: flex;
  gap: 8px;
  padding: 0 20px 14px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tag-chips::-webkit-scrollbar {
  display: none;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-body);
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 32px;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.tag-chip:active {
  background: var(--color-border);
}

.tag-chip.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Folder drawer overlay */
.folder-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 37, 32, 0.3);
  z-index: 200;
}

.folder-sidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: var(--color-bg-elevated);
  border-right: 0.5px solid var(--color-border);
  padding: 24px 16px;
  overflow-y: auto;
}

.folder-sidebar h2 {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 16px;
  padding: 0 4px;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.folder-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 11px 12px;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 17px;
  font-family: var(--font-body);
  border-radius: var(--radius);
  cursor: pointer;
  min-height: 44px;
  transition: background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.folder-item:active {
  background: var(--color-bg-secondary);
}

.folder-item.active {
  background: var(--color-primary);
  color: white;
}

/* Notes list */
.notes-list {
  padding: 0 20px;
}

.notes-section {
  margin-bottom: 8px;
}

.notes-section > :deep(*:not(.section-title)) {
  background: var(--color-bg-elevated);
}

.notes-section > :deep(*:not(.section-title):first-of-type) {
  border-top-left-radius: var(--radius);
  border-top-right-radius: var(--radius);
}

.notes-section > :deep(*:not(.section-title):last-child) {
  border-bottom-left-radius: var(--radius);
  border-bottom-right-radius: var(--radius);
}

.notes-section > :deep(*:not(.section-title):not(:last-child)) {
  border-bottom: 0.5px solid var(--color-border);
}

.section-title {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  margin-bottom: 6px;
  margin-top: 16px;
  padding-left: 16px;
}

/* FAB */
.fab {
  position: fixed;
  bottom: calc(100px + var(--safe-area-bottom));
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast), background var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.fab:active {
  background: var(--color-primary-dark);
}

.fab-open {
  transform: rotate(45deg);
}

.fab-open:active {
  transform: rotate(45deg);
  background: var(--color-primary-dark);
}

/* Bottom sheet */
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 37, 32, 0.3);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-content {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 12px 20px calc(90px + var(--safe-area-bottom));
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
}

.sheet-handle {
  width: 36px;
  height: 5px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  margin: 0 auto 20px;
}

.sheet-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 400;
  margin-bottom: 18px;
  letter-spacing: 0;
  color: var(--color-text);
}

/* Category grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.category-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  min-height: 44px;
  transition: opacity var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.category-chip:active {
  opacity: 0.7;
}

.category-chip-icon {
  font-size: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.category-chip-name {
  font-size: 15px;
  font-weight: 500;
  font-family: var(--font-body);
}
</style>
