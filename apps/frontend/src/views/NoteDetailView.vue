<template>
  <div class="note-detail" v-if="note">
    <header class="detail-header">
      <button class="btn-back" @click="router.push('/notes')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Notes
      </button>
      <div class="header-actions">
        <button class="btn-icon" @click="togglePin" :title="note.isPinned ? 'Desepingler' : 'Epingler'">
          {{ note.isPinned ? '\u{1f4cc}' : '\u{1f4cd}' }}
        </button>
        <button class="btn-icon" @click="showMenu = !showMenu">&#x22ee;</button>
      </div>
    </header>

    <!-- Menu dropdown -->
    <div v-if="showMenu" class="dropdown-menu">
      <button @click="pickDate">&#x1f4c5; Assigner une date</button>
      <button @click="pickCategory">&#x1f3f7;&#xfe0f; Categorie</button>
      <button @click="deleteNote" class="danger">&#x1f5d1;&#xfe0f; Supprimer</button>
    </div>

    <!-- Title -->
    <input class="note-title-input" v-model="title" @input="debouncedSave" placeholder="Titre" />

    <!-- Date indicator -->
    <div v-if="note.scheduledDate" class="scheduled-badge" @click="pickDate">
      &#x1f4c5; {{ formatDate(note.scheduledDate) }}
      <span v-if="note.scheduledTime">a {{ note.scheduledTime }}</span>
    </div>

    <!-- Editor -->
    <NoteEditor v-model="content" :category-style="categoryStyle" />

    <!-- Date picker modal -->
    <div v-if="showDatePicker" class="modal-overlay" @click="showDatePicker = false">
      <div class="modal-content" @click.stop>
        <h3>Assigner une date</h3>
        <input type="date" v-model="scheduledDate" />
        <input type="time" v-model="scheduledTime" />
        <div class="modal-actions">
          <button @click="clearDate">Retirer</button>
          <button class="btn-primary-sm" @click="saveDate">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Category picker modal -->
    <div v-if="showCategoryPicker" class="modal-overlay" @click="showCategoryPicker = false">
      <div class="modal-content" @click.stop>
        <h3>Categorie</h3>
        <button v-for="cat in categories" :key="cat.id" class="category-option" :class="{ active: note.categoryId === cat.id }" @click="selectCategory(cat.id)">
          {{ cat.name }}
        </button>
        <button class="category-option" :class="{ active: !note.categoryId }" @click="selectCategory(null)">
          Aucune
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { useCategoriesStore } from '@/stores/categories';
import NoteEditor from '@/components/editor/NoteEditor.vue';
import type { CategoryStyle } from '@time-gestion/shared';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const categoriesStore = useCategoriesStore();

const noteId = computed(() => route.params.id as string);
const note = computed(() => notesStore.notes.find(n => n.id === noteId.value));
const categories = computed(() => categoriesStore.categories);

const title = ref('');
const content = ref<Record<string, unknown>>({});
const showMenu = ref(false);
const showDatePicker = ref(false);
const showCategoryPicker = ref(false);
const scheduledDate = ref('');
const scheduledTime = ref('');

const categoryStyle = computed<CategoryStyle | null>(() => {
  if (!note.value?.categoryId) return null;
  const cat = categories.value.find(c => c.id === note.value!.categoryId);
  return (cat?.style as CategoryStyle) || null;
});

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => save(), 1000);
}

async function save() {
  if (!note.value) return;
  await notesStore.update(noteId.value, { title: title.value, content: content.value });
}

watch(content, () => {
  debouncedSave();
}, { deep: true });

async function togglePin() {
  if (!note.value) return;
  await notesStore.update(noteId.value, { isPinned: !note.value.isPinned });
}

function pickDate() {
  showMenu.value = false;
  scheduledDate.value = note.value?.scheduledDate?.split('T')[0] || '';
  scheduledTime.value = note.value?.scheduledTime || '';
  showDatePicker.value = true;
}

async function saveDate() {
  await notesStore.update(noteId.value, {
    scheduledDate: scheduledDate.value || null,
    scheduledTime: scheduledTime.value || null,
  });
  showDatePicker.value = false;
}

async function clearDate() {
  await notesStore.update(noteId.value, { scheduledDate: null, scheduledTime: null });
  showDatePicker.value = false;
}

function pickCategory() {
  showMenu.value = false;
  showCategoryPicker.value = true;
}

async function selectCategory(catId: string | null) {
  await notesStore.update(noteId.value, { categoryId: catId });
  showCategoryPicker.value = false;
}

async function deleteNote() {
  showMenu.value = false;
  await notesStore.remove(noteId.value);
  router.push('/notes');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

onMounted(async () => {
  await notesStore.loadFromLocal();
  await categoriesStore.loadFromLocal();
  if (note.value) {
    title.value = note.value.title;
    content.value = note.value.content as Record<string, unknown>;
    scheduledDate.value = note.value.scheduledDate?.split('T')[0] || '';
    scheduledTime.value = note.value.scheduledTime || '';
  }
});
</script>

<style scoped>
.note-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 15px;
  cursor: pointer;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 18px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--radius);
}

.dropdown-menu {
  position: absolute;
  right: 16px;
  top: 52px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  overflow: hidden;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-text);
}

.dropdown-menu button.danger {
  color: var(--color-danger);
}

.note-title-input {
  border: none;
  padding: 16px;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  background: transparent;
  width: 100%;
  outline: none;
}

.scheduled-badge {
  margin: 0 16px 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--color-bg-secondary);
  border-radius: 20px;
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
  width: fit-content;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}

.modal-content {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 360px;
}

.modal-content h3 {
  margin-bottom: 16px;
}

.modal-content input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 12px;
  font-size: 16px;
  background: var(--color-bg);
  color: var(--color-text);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.modal-actions button {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: none;
  cursor: pointer;
  color: var(--color-text);
}

.btn-primary-sm {
  background: var(--color-primary) !important;
  color: white !important;
  border-color: var(--color-primary) !important;
}

.category-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 8px;
  background: none;
  cursor: pointer;
  color: var(--color-text);
}

.category-option.active {
  border-color: var(--color-primary);
  background: rgba(79, 70, 229, 0.1);
}
</style>
