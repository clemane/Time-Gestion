<template>
  <div
    class="calendar-view"
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

    <header class="cal-header">
      <h1>Calendrier</h1>
      <div class="header-right">
        <button class="btn-icon" @click="showSearch = !showSearch">
          <Search :size="22" />
        </button>
        <div class="view-tabs">
          <button :class="{ active: currentView === 'month' }" @click="currentView = 'month'">Mois</button>
          <button :class="{ active: currentView === 'week' }" @click="currentView = 'week'">Semaine</button>
          <button :class="{ active: currentView === 'agenda' }" @click="currentView = 'agenda'">Agenda</button>
        </div>
      </div>
    </header>

    <!-- Search -->
    <Transition name="search-slide">
      <div class="search-bar" v-if="showSearch">
        <input v-model="searchQuery" type="search" placeholder="Rechercher dans les evenements..." />
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

    <MonthView v-if="currentView === 'month'" :selected-date="selectedDate" :selected-group-id="selectedGroupId" @select-date="selectedDate = $event" @navigate="onNavigate" />
    <WeekView v-if="currentView === 'week'" :selected-date="selectedDate" :selected-group-id="selectedGroupId" @select-date="selectedDate = $event" @navigate="onNavigate" />
    <AgendaView v-if="currentView === 'agenda'" :selected-date="selectedDate" :selected-group-id="selectedGroupId" />

    <!-- Day detail: events and dated notes for selected day -->
    <div v-if="currentView !== 'agenda' && selectedDayItems.length > 0" class="day-detail">
      <h3>{{ formatDateFull(selectedDate) }}</h3>
      <div v-for="item in selectedDayItems" :key="item.id" class="day-item" :style="{ borderLeftColor: item.color }" @click="item.type === 'event' ? editEvent(item.id) : openNote(item.id)">
        <span class="item-type">
          <CalendarIcon v-if="item.type === 'event'" :size="14" />
          <FileText v-else :size="14" />
        </span>
        <div>
          <div class="item-title">{{ item.title }}</div>
          <div v-if="item.time" class="item-time">{{ item.time }}</div>
        </div>
      </div>
    </div>

    <!-- FAB to create event -->
    <button class="fab" :class="{ 'fab-open': showEventForm }" @click="haptic.light(); showEventForm = true">
      <Plus :size="24" />
    </button>

    <!-- Event form modal -->
    <EventForm v-if="showEventForm" :initial-date="selectedDate" :event="editingEvent" @close="showEventForm = false; editingEvent = null" @saved="onEventSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { useCalendarsStore } from '@/stores/calendars';
import { useNotesStore } from '@/stores/notes';
import { usePullToRefresh } from '@/composables/usePullToRefresh';
import { useHaptic } from '@/composables/useHaptic';
import { useSync } from '@/composables/useSync';
import MonthView from '@/components/calendar/MonthView.vue';
import WeekView from '@/components/calendar/WeekView.vue';
import AgendaView from '@/components/calendar/AgendaView.vue';
import EventForm from '@/components/calendar/EventForm.vue';
import { Calendar as CalendarIcon, FileText, Plus, Search } from 'lucide-vue-next';
import type { CalendarEvent } from '@time-gestion/shared';

const router = useRouter();
const eventsStore = useEventsStore();
const calendarsStore = useCalendarsStore();
const notesStore = useNotesStore();
const { sync } = useSync();
const haptic = useHaptic();

const ptr = usePullToRefresh(async () => {
  await sync();
  await eventsStore.loadFromLocal();
  await calendarsStore.loadFromLocal();
  await notesStore.loadFromLocal();
});

const currentView = ref<'month' | 'week' | 'agenda'>('month');
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const selectedGroupId = ref<string | null>(null);
const showSearch = ref(false);
const searchQuery = ref('');
const showEventForm = ref(false);
const editingEvent = ref<CalendarEvent | null>(null);

const selectedDayItems = computed(() => {
  const items: Array<{ id: string; title: string; time: string; color: string; type: 'event' | 'note' }> = [];

  for (const evt of eventsStore.events) {
    if (selectedGroupId.value && evt.calendarId !== selectedGroupId.value) continue;
    const evtDate = evt.startAt.split('T')[0];
    if (evtDate === selectedDate.value) {
      const cal = calendarsStore.calendars.find(c => c.id === evt.calendarId);
      const time = evt.allDay ? '' : new Date(evt.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      items.push({ id: evt.id, title: evt.title, time, color: cal?.color || '#4f46e5', type: 'event' });
    }
  }

  for (const note of notesStore.notes) {
    if (selectedGroupId.value && note.calendarId !== selectedGroupId.value) continue;
    if (note.scheduledDate) {
      const noteDate = note.scheduledDate.split('T')[0];
      if (noteDate === selectedDate.value) {
        const cal = note.calendarId ? calendarsStore.calendars.find(c => c.id === note.calendarId) : null;
        items.push({ id: note.id, title: note.title, time: note.scheduledTime || '', color: cal?.color || '#6b7280', type: 'note' });
      }
    }
  }

  const sorted = items.sort((a, b) => a.time.localeCompare(b.time));

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    return sorted.filter(item => item.title.toLowerCase().includes(q));
  }

  return sorted;
});

function editEvent(id: string) {
  const evt = eventsStore.events.find(e => e.id === id);
  if (evt) {
    editingEvent.value = evt;
    showEventForm.value = true;
  }
}

function openNote(id: string) {
  router.push(`/notes/${id}`);
}

function onEventSaved() {
  showEventForm.value = false;
  editingEvent.value = null;
}

function onNavigate(date: string) {
  selectedDate.value = date;
}

function formatDateFull(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

onMounted(async () => {
  await eventsStore.loadFromLocal();
  await calendarsStore.loadFromLocal();
  await notesStore.loadFromLocal();
});
</script>

<style scoped>
/* ── Calendar View · iOS Calendar Aesthetic ── */

.calendar-view {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: var(--color-bg);
}

/* ── Pull-to-refresh ── */

.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  transition: height 300ms ease;
}

.pull-arrow {
  transition: transform 300ms ease;
  color: var(--color-text-tertiary);
  transform: rotate(180deg);
  opacity: 0.6;
}

.pull-arrow.pull-ready {
  transform: rotate(0deg);
  color: var(--color-primary);
  opacity: 1;
}

.pull-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Header ── */

.cal-header {
  padding: 16px 20px 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.cal-header h1 {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--color-text);
  line-height: 1.1;
}

/* ── Header right group ── */

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* ── Search bar ── */

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

.search-bar input::placeholder {
  color: var(--color-text-tertiary);
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

/* ── View tabs (iOS Segmented Control) ── */

.view-tabs {
  display: flex;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  padding: 3px;
  gap: 0;
}

.view-tabs button {
  padding: 6px 14px;
  border: none;
  background: none;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text);
  border-radius: var(--radius-full);
  transition: background 200ms ease, box-shadow 200ms ease;
  -webkit-tap-highlight-color: transparent;
  min-height: 30px;
}

.view-tabs button:active {
  opacity: 0.7;
}

.view-tabs button.active {
  background: var(--color-primary);
  color: white;
  box-shadow: none;
  font-weight: 600;
}

/* ── Group filter chips ── */

.group-chips {
  display: flex;
  gap: 8px;
  padding: 0 20px 12px;
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
  border-radius: 9999px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 36px;
  transition: background 200ms ease, color 200ms ease, border-color 200ms ease;
  -webkit-tap-highlight-color: transparent;
}

.group-chip:active {
  opacity: 0.7;
}

.group-chip.active {
  background: var(--color-primary-ghost);
  color: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: 600;
}

.group-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-chip.active .group-chip-dot {
  opacity: 1;
}

/* ── Day detail section ── */

.day-detail {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.day-detail h3 {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--color-text-secondary);
  text-transform: capitalize;
  margin-bottom: 8px;
  font-weight: 400;
}

/* ── Day items (list rows) ── */

.day-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-left: 3px solid;
  border-top: none;
  border-right: none;
  border-bottom: none;
  border-radius: var(--radius);
  background: var(--color-bg-elevated);
  box-shadow: none;
  margin-bottom: 0;
  cursor: pointer;
  min-height: 44px;
  transition: background 150ms ease;
  -webkit-tap-highlight-color: transparent;
}

.day-item + .day-item {
  border-top: 1px solid var(--color-border);
}

.day-item:first-child {
  border-radius: var(--radius) var(--radius) 0 0;
}

.day-item:last-child {
  border-radius: 0 0 var(--radius) var(--radius);
}

.day-item:only-child {
  border-radius: var(--radius);
}

.day-item:active {
  background: var(--color-bg-secondary);
}

.item-type {
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.item-title {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 15px;
  color: var(--color-text);
}

.item-time {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 1px;
}

/* ── FAB ── */

.fab {
  position: fixed;
  bottom: calc(100px + var(--safe-area-bottom, 0px));
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
  transition: opacity 200ms ease, transform 200ms ease;
  -webkit-tap-highlight-color: transparent;
  animation: fab-in 300ms ease both;
}

.fab:active {
  opacity: 0.7;
}

.fab-open {
  transform: rotate(45deg);
}

@keyframes fab-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
