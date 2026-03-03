<template>
  <div class="agenda-view">
    <EmptyState
      v-if="agendaDays.length === 0"
      :icon="CalendarOff"
      title="Aucun evenement"
      description="Aucun evenement dans les 30 prochains jours"
    />
    <TransitionGroup v-else name="list-stagger" appear>
      <div v-for="(day, dayIndex) in agendaDays" :key="day.dateStr" class="agenda-day" :style="{ '--stagger-delay': `${dayIndex * 60}ms` }">
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
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { useCalendarsStore } from '@/stores/calendars';
import { useNotesStore } from '@/stores/notes';
import { CalendarOff } from 'lucide-vue-next';
import EmptyState from '@/components/ui/EmptyState.vue';

const props = defineProps<{
  selectedDate: string;
  selectedGroupId?: string | null;
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

    for (const evt of eventsStore.events) {
      if (props.selectedGroupId && evt.calendarId !== props.selectedGroupId) continue;
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
          onClick: () => {},
        });
      }
    }

    for (const note of notesStore.notes) {
      if (props.selectedGroupId && note.calendarId !== props.selectedGroupId) continue;
      if (note.scheduledDate) {
        const noteDate = note.scheduledDate.split('T')[0];
        if (noteDate === dateStr) {
          const noteCal = note.calendarId ? calendarsStore.calendars.find(c => c.id === note.calendarId) : null;
          items.push({
            id: note.id,
            title: note.title,
            time: note.scheduledTime || '',
            isAllDay: false,
            color: noteCal?.color || '#6b7280',
            onClick: () => {
              router.push(`/notes/${note.id}`);
            },
          });
        }
      }
    }

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
  padding: 0 20px 80px;
  background: var(--color-bg);
}

.agenda-day {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 0.5px solid var(--color-border-subtle);
}

.agenda-day-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 88px;
}

.agenda-day-num {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary);
}

.agenda-day-info {
  padding-top: 3px;
}

.agenda-day-name {
  font-size: 13px;
  font-weight: 500;
  text-transform: capitalize;
  color: var(--color-text-secondary);
}

.agenda-day-month {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: capitalize;
  margin-top: 2px;
}

.agenda-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.agenda-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--color-bg-elevated);
  border: none;
  border-bottom: 0.5px solid var(--color-border-subtle);
  border-radius: var(--radius);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s ease;
  margin-bottom: 4px;
}

.agenda-item:last-child {
  border-bottom: none;
}

.agenda-item:hover {
  background: var(--color-bg-secondary);
}

.agenda-item:active {
  background: var(--color-bg-secondary);
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
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text);
}

.agenda-item-time {
  font-size: 13px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  font-weight: 400;
}
</style>
