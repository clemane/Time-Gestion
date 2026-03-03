<template>
  <div class="note-detail" v-if="note">
    <header class="detail-header">
      <button class="btn-back" @click="router.push('/notes')">
        <ChevronLeft :size="20" />
        Notes
      </button>
      <div class="header-actions">
        <button class="btn-icon" @click="togglePin" :title="note.isPinned ? 'Desepingler' : 'Epingler'">
          <Pin v-if="note.isPinned" :size="18" />
          <PinOff v-else :size="18" />
        </button>
        <button class="btn-icon" @click="showMenu = !showMenu">
          <MoreVertical :size="18" />
        </button>
      </div>
    </header>

    <!-- Menu dropdown -->
    <Transition name="dropdown">
      <div v-if="showMenu" class="dropdown-menu">
        <button @click="openShare"><Link2 :size="16" /> Partager</button>
        <button @click="deleteNote" class="danger"><Trash2 :size="16" /> Supprimer</button>
      </div>
    </Transition>

    <!-- Title -->
    <input class="note-title-input" v-model="title" @input="debouncedSave" placeholder="Titre" :style="categoryTextColor ? { color: categoryTextColor, backgroundColor: categoryStyle?.backgroundColor } : {}" />

    <!-- Tags -->
    <div class="tags-section">
      <TagsInput :modelValue="noteTags" @update:modelValue="onTagsChange" />
    </div>

    <!-- Quick actions bar (date + category) -->
    <div class="quick-actions">
      <button class="quick-action-chip" @click="pickDate">
        <span class="chip-icon"><CalendarDays :size="14" /></span>
        <span v-if="note.scheduledDate" class="chip-text">
          {{ formatDate(note.scheduledDate) }}
          <span v-if="note.scheduledTime"> {{ note.scheduledTime }}</span>
        </span>
        <span v-else class="chip-text chip-placeholder">Ajouter une date</span>
      </button>
      <button class="quick-action-chip" @click="pickCategory">
        <span class="chip-icon" v-if="currentCategory">{{ currentCategory.icon }}</span>
        <span class="chip-icon" v-else><Tag :size="14" /></span>
        <span class="chip-text" v-if="currentCategory">{{ currentCategory.name }}</span>
        <span class="chip-text chip-placeholder" v-else>Categorie</span>
      </button>
      <button class="quick-action-chip" @click="pickGroup">
        <span class="chip-icon" v-if="currentGroup"><span class="group-dot" :style="{ background: currentGroup.color }"></span></span>
        <span class="chip-icon" v-else><Users :size="14" /></span>
        <span class="chip-text" v-if="currentGroup">{{ currentGroup.name }}</span>
        <span class="chip-text chip-placeholder" v-else>Groupe</span>
      </button>
    </div>

    <!-- Editor -->
    <NoteEditor v-model="content" :category-style="categoryStyle" />

    <!-- Date picker modal -->
    <Transition name="modal">
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
    </Transition>

    <!-- Category picker modal -->
    <Transition name="modal">
      <div v-if="showCategoryPicker" class="modal-overlay" @click="showCategoryPicker = false">
        <div class="modal-content" @click.stop>
          <h3>Categorie</h3>
          <button v-for="cat in categories" :key="cat.id" class="category-option" :class="{ active: note.categoryId === cat.id }" @click="selectCategory(cat.id)">
            <span class="cat-icon">{{ cat.icon }}</span> {{ cat.name }}
          </button>
          <button class="category-option" :class="{ active: !note.categoryId }" @click="selectCategory(null)">
            Aucune
          </button>
        </div>
      </div>
    </Transition>

    <!-- Group picker modal -->
    <Transition name="modal">
      <div v-if="showGroupPicker" class="modal-overlay" @click="showGroupPicker = false">
        <div class="modal-content" @click.stop>
          <h3>Groupe</h3>
          <button v-for="cal in calendarsStore.calendars" :key="cal.id" class="category-option" :class="{ active: note.calendarId === cal.id }" @click="selectGroup(cal.id)">
            <span class="group-dot" :style="{ background: cal.color }"></span> {{ cal.name }}
          </button>
          <button class="category-option" :class="{ active: !note.calendarId }" @click="selectGroup(null)">
            Aucun
          </button>
        </div>
      </div>
    </Transition>

    <!-- Share dialog -->
    <ShareDialog
      v-if="showShareDialog"
      resource-type="NOTE"
      :resource-id="noteId"
      @close="showShareDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { useCategoriesStore } from '@/stores/categories';
import { useCalendarsStore } from '@/stores/calendars';
import NoteEditor from '@/components/editor/NoteEditor.vue';
import ShareDialog from '@/components/sharing/ShareDialog.vue';
import TagsInput from '@/components/menu/TagsInput.vue';
import { ChevronLeft, Pin, PinOff, MoreVertical, Link2, Trash2, CalendarDays, Tag, Users } from 'lucide-vue-next';
import type { CategoryStyle } from '@time-gestion/shared';

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const categoriesStore = useCategoriesStore();
const calendarsStore = useCalendarsStore();

const noteId = computed(() => route.params.id as string);
const note = computed(() => notesStore.notes.find(n => n.id === noteId.value));
const categories = computed(() => categoriesStore.categories);

const title = ref('');
const content = ref<Record<string, unknown>>({});
const showMenu = ref(false);
const showDatePicker = ref(false);
const showCategoryPicker = ref(false);
const showGroupPicker = ref(false);
const showShareDialog = ref(false);
const scheduledDate = ref('');
const scheduledTime = ref('');

const currentGroup = computed(() => {
  if (!note.value?.calendarId) return null;
  return calendarsStore.calendars.find(c => c.id === note.value!.calendarId) || null;
});

const currentCategory = computed(() => {
  if (!note.value?.categoryId) return null;
  return categories.value.find(c => c.id === note.value!.categoryId) || null;
});

const categoryStyle = computed<CategoryStyle | null>(() => {
  return (currentCategory.value?.style as CategoryStyle) || null;
});

const categoryTextColor = computed(() => {
  if (!categoryStyle.value?.backgroundColor) return undefined;
  return isLightColor(categoryStyle.value.backgroundColor) ? '#111827' : '#f9fafb';
});

const noteTags = computed(() => note.value?.tags || []);

async function onTagsChange(tags: string[]) {
  if (!note.value) return;
  await notesStore.update(noteId.value, { tags });
}

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

function openShare() {
  showMenu.value = false;
  showShareDialog.value = true;
}

function pickCategory() {
  showMenu.value = false;
  showCategoryPicker.value = true;
}

function pickGroup() {
  showMenu.value = false;
  showGroupPicker.value = true;
}

async function selectGroup(groupId: string | null) {
  await notesStore.update(noteId.value, { calendarId: groupId });
  showGroupPicker.value = false;
}

async function selectCategory(catId: string | null) {
  const updateData: Record<string, unknown> = { categoryId: catId };

  if (catId) {
    const cat = categories.value.find(c => c.id === catId);
    const isContentEmpty = !content.value?.content || (Array.isArray(content.value.content) && content.value.content.length === 0);
    if (cat?.defaultContent && isContentEmpty) {
      const dc = cat.defaultContent as Record<string, unknown>;
      updateData.content = dc;
      content.value = dc;
    }
  }

  await notesStore.update(noteId.value, updateData);
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
  await calendarsStore.loadFromLocal();
  if (note.value) {
    title.value = note.value.title;
    content.value = note.value.content as Record<string, unknown>;
    scheduledDate.value = note.value.scheduledDate?.split('T')[0] || '';
    scheduledTime.value = note.value.scheduledTime || '';
  }
});
</script>

<style scoped>
/* ── Layout ── */
.note-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-elevated);
}

/* ── Header ── */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  position: relative;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
}

/* ── Back button: text + chevron in iOS blue ── */
.btn-back {
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  padding: 0;
  margin: 0;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

.btn-back:active {
  opacity: 0.5;
}

.header-actions {
  display: flex;
  gap: 0;
}

/* ── Icon buttons: no background, 44px touch target ── */
.btn-icon {
  background: none;
  border: none;
  padding: 0;
  width: 44px;
  height: 44px;
  cursor: pointer;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.btn-icon:active {
  opacity: 0.5;
}

/* ── Dropdown menu: solid white, small shadow, no glass ── */
.dropdown-menu {
  position: absolute;
  right: 16px;
  top: 52px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  z-index: 100;
  overflow: hidden;
  min-width: 200px;
  transform-origin: top right;
}

.dropdown-menu button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  border: none;
  background: none;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  color: var(--color-text);
  -webkit-tap-highlight-color: transparent;
}

.dropdown-menu button + button {
  border-top: 0.5px solid var(--color-border);
}

.dropdown-menu button:active {
  background: var(--color-bg-secondary);
}

.dropdown-menu button.danger {
  color: var(--color-danger);
}

.dropdown-menu button.danger:active {
  background: var(--color-danger-ghost);
}

/* ── Title input: large, bold, clean ── */
.note-title-input {
  border: none;
  padding: 20px 16px 8px;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--color-text);
  background: transparent;
  width: 100%;
  outline: none;
  line-height: 1.2;
}

.note-title-input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

/* ── Tags section ── */
.tags-section {
  padding: 4px 16px 0;
}

/* ── Quick actions bar: simple text buttons in iOS blue ── */
.quick-actions {
  display: flex;
  gap: 16px;
  padding: 4px 16px 14px;
  flex-wrap: wrap;
}

.quick-action-chip {
  display: inline-flex;
  align-items: center;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  padding: 6px 12px;
  gap: 6px;
  border: none;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-primary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.quick-action-chip:active {
  opacity: 0.5;
}

.chip-icon {
  font-size: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--color-primary);
}

.chip-text {
  font-weight: 400;
}

.chip-placeholder {
  color: var(--color-text-tertiary);
}

/* ── Group dot ── */
.group-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  vertical-align: middle;
  flex-shrink: 0;
}

/* ── Modal overlay: semi-transparent dark, NO blur ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 37, 32, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 24px;
}

/* ── Modal content: solid background, iOS alert style ── */
.modal-content {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 320px;
  box-shadow: var(--shadow-overlay);
}

.modal-content h3 {
  margin-bottom: 18px;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-text);
  text-align: center;
}

.modal-content input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 12px;
  font-family: var(--font-body);
  font-size: 15px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
}

.modal-content input:focus {
  border-color: var(--color-primary);
  box-shadow: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.modal-actions button {
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
  cursor: pointer;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 17px;
  -webkit-tap-highlight-color: transparent;
}

.modal-actions button:active {
  opacity: 0.5;
}

.btn-primary-sm {
  background: none !important;
  color: var(--color-primary) !important;
  font-weight: 600 !important;
}

.btn-primary-sm:active {
  opacity: 0.5;
}

/* ── Category / group option buttons: list rows with separators ── */
.category-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 13px 0;
  border: none;
  border-bottom: 0.5px solid var(--color-border);
  margin-bottom: 0;
  background: none;
  cursor: pointer;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  -webkit-tap-highlight-color: transparent;
}

.category-option:last-child {
  border-bottom: none;
}

.category-option:active {
  background: var(--color-bg-secondary);
}

.category-option.active {
  color: var(--color-primary);
  font-weight: 600;
}

.cat-icon {
  font-size: 17px;
  flex-shrink: 0;
}
</style>
