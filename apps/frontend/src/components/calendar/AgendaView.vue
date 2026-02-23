<template>
  <div class="agenda-view">
    <div v-if="agendaDays.length === 0" class="agenda-empty">
      Aucun evenement dans les 30 prochains jours
    </div>
    <div v-for="day in agendaDays" :key="day.dateStr" class="agenda-day">
      <div class="agenda-day-header">
        <div class="agenda-day-num">{{ day.dayNum }}</div>
        <div class="agenda-day-info">
          <div class="agenda-day-name">{{ day.dayName }}</div>
          <div class="agenda-day-month">{{ day.monthName }}</div>
        </div>
      </div>
      <div class="agenda-items">
        <div
          v-for="item in day.items"
          :key="item.id"
          class="agenda-item"
          @click="item.onClick"
        >
          <span class="agenda-dot" :style="{ background: item.color }"></span>
          <div class="agenda-item-content">
            <div class="agenda-item-title">{{ item.title }}</div>
            <div v-if="item.time" class="agenda-item-time">{{ item.time }}</div>
            <div v-if="item.isAllDay" class="agenda-item-time">Toute la journee</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { useCalendarsStore } from '@/stores/calendars';
import { useNotesStore } from '@/stores/notes';

const props = defineProps<{
  selectedDate: string;
}>();

const router = useRouter();
const eventsStore = useEventsStore();
const calendarsStore = useCalendarsStore();
const notesStore = useNotesStore();

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

interface AgendaItem {
  id: string;
  title: string;
  time: string;
  isAllDay: boolean;
  color: string;
  onClick: () => void;
}

interface AgendaDay {
  dateStr: string;
  dayNum: number;
  dayName: string;
  monthName: string;
  items: AgendaItem[];
}

const agendaDays = computed<AgendaDay[]>(() => {
  const days: AgendaDay[] = [];
  const startDate = new Date(props.selectedDate + 'T00:00:00');

  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateStr(d);
    const items: AgendaItem[] = [];

    // Events for this day
    for (const evt of eventsStore.events) {
      const evtDate = evt.startAt.split('T')[0];
      if (evtDate === dateStr) {
        const cal = calendarsStore.calendars.find(c => c.id === evt.calendarId);
        const color = cal?.color || '#4f46e5';
        const time = evt.allDay
          ? ''
          : new Date(evt.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            + ' - '
            + new Date(evt.endAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        items.push({
          id: evt.id,
          title: evt.title,
          time,
          isAllDay: evt.allDay,
          color,
          onClick: () => {
            // Could open event form; for now just a no-op
          },
        });
      }
    }

    // Dated notes for this day
    for (const note of notesStore.notes) {
      if (note.scheduledDate) {
        const noteDate = note.scheduledDate.split('T')[0];
        if (noteDate === dateStr) {
          items.push({
            id: note.id,
            title: note.title,
            time: note.scheduledTime || '',
            isAllDay: false,
            color: '#6b7280',
            onClick: () => {
              router.push(`/notes/${note.id}`);
            },
          });
        }
      }
    }

    // Only include days with items (hide empty days)
    if (items.length > 0) {
      items.sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.time.localeCompare(b.time);
      });

      days.push({
        dateStr,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString('fr-FR', { weekday: 'long' }),
        monthName: d.toLocaleDateString('fr-FR', { month: 'long' }),
        items,
      });
    }
  }

  return days;
});
</script>

<style scoped>
.agenda-view {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 80px;
}

.agenda-empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px 16px;
  font-size: 15px;
}

.agenda-day {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.agenda-day-header {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  min-width: 80px;
}

.agenda-day-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary);
}

.agenda-day-info {
  padding-top: 2px;
}

.agenda-day-name {
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-text-secondary);
}

.agenda-day-month {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.agenda-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.agenda-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius);
  cursor: pointer;
}

.agenda-item:hover {
  opacity: 0.85;
}

.agenda-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.agenda-item-content {
  flex: 1;
  min-width: 0;
}

.agenda-item-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agenda-item-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
</style>
