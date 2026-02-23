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
      <div class="view-tabs">
        <button :class="{ active: currentView === 'month' }" @click="currentView = 'month'">Mois</button>
        <button :class="{ active: currentView === 'week' }" @click="currentView = 'week'">Semaine</button>
        <button :class="{ active: currentView === 'agenda' }" @click="currentView = 'agenda'">Agenda</button>
      </div>
    </header>

    <MonthView v-if="currentView === 'month'" :selected-date="selectedDate" @select-date="selectedDate = $event" @navigate="onNavigate" />
    <WeekView v-if="currentView === 'week'" :selected-date="selectedDate" @select-date="selectedDate = $event" @navigate="onNavigate" />
    <AgendaView v-if="currentView === 'agenda'" :selected-date="selectedDate" />

    <!-- Day detail: events and dated notes for selected day -->
    <div v-if="currentView !== 'agenda' && selectedDayItems.length > 0" class="day-detail">
      <h3>{{ formatDateFull(selectedDate) }}</h3>
      <div v-for="item in selectedDayItems" :key="item.id" class="day-item" :style="{ borderLeftColor: item.color }" @click="item.type === 'event' ? editEvent(item.id) : openNote(item.id)">
        <span class="item-type">{{ item.type === 'event' ? '\u{1f4c5}' : '\u{1f4dd}' }}</span>
        <div>
          <div class="item-title">{{ item.title }}</div>
          <div v-if="item.time" class="item-time">{{ item.time }}</div>
        </div>
      </div>
    </div>

    <!-- FAB to create event -->
    <button class="fab" @click="showEventForm = true">+</button>

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
import { useSync } from '@/composables/useSync';
import MonthView from '@/components/calendar/MonthView.vue';
import WeekView from '@/components/calendar/WeekView.vue';
import AgendaView from '@/components/calendar/AgendaView.vue';
import EventForm from '@/components/calendar/EventForm.vue';
import type { CalendarEvent } from '@time-gestion/shared';

const router = useRouter();
const eventsStore = useEventsStore();
const calendarsStore = useCalendarsStore();
const notesStore = useNotesStore();
const { sync } = useSync();

const ptr = usePullToRefresh(async () => {
  await sync();
  await eventsStore.loadFromLocal();
  await calendarsStore.loadFromLocal();
  await notesStore.loadFromLocal();
});

const currentView = ref<'month' | 'week' | 'agenda'>('month');
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const showEventForm = ref(false);
const editingEvent = ref<CalendarEvent | null>(null);

const selectedDayItems = computed(() => {
  const items: Array<{ id: string; title: string; time: string; color: string; type: 'event' | 'note' }> = [];

  // Events for selected day
  for (const evt of eventsStore.events) {
    const evtDate = evt.startAt.split('T')[0];
    if (evtDate === selectedDate.value) {
      const cal = calendarsStore.calendars.find(c => c.id === evt.calendarId);
      const time = evt.allDay ? '' : new Date(evt.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      items.push({ id: evt.id, title: evt.title, time, color: cal?.color || '#4f46e5', type: 'event' });
    }
  }

  // Dated notes for selected day
  for (const note of notesStore.notes) {
    if (note.scheduledDate) {
      const noteDate = note.scheduledDate.split('T')[0];
      if (noteDate === selectedDate.value) {
        items.push({ id: note.id, title: note.title, time: note.scheduledTime || '', color: '#6b7280', type: 'note' });
      }
    }
  }

  return items.sort((a, b) => a.time.localeCompare(b.time));
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
.calendar-view {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
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

.cal-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cal-header h1 {
  font-size: 28px;
  font-weight: 700;
}

.view-tabs {
  display: flex;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
  overflow: hidden;
}

.view-tabs button {
  padding: 6px 12px;
  border: none;
  background: none;
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.view-tabs button.active {
  background: var(--color-primary);
  color: white;
}

.day-detail {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  overflow-y: auto;
  flex: 1;
}

.day-detail h3 {
  font-size: 14px;
  color: var(--color-text-secondary);
  text-transform: capitalize;
  margin-bottom: 8px;
}

.day-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-left: 3px solid;
  border-radius: 0 var(--radius) var(--radius) 0;
  background: var(--color-bg-secondary);
  margin-bottom: 6px;
  cursor: pointer;
}

.item-type {
  font-size: 16px;
}

.item-title {
  font-weight: 500;
  font-size: 15px;
}

.item-time {
  font-size: 13px;
  color: var(--color-text-secondary);
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
