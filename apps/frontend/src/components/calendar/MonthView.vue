<template>
  <div class="month-view">
    <div class="month-nav">
      <button class="nav-btn" @click="prevMonth">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="month-label">{{ monthLabel }}</span>
      <button class="nav-btn" @click="nextMonth">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

    <div class="day-names">
      <div v-for="name in dayNames" :key="name" class="day-name">{{ name }}</div>
    </div>

    <div class="month-grid">
      <div
        v-for="(day, i) in calendarDays"
        :key="i"
        class="day-cell"
        :class="{
          'other-month': !day.currentMonth,
          'is-today': day.isToday,
          'is-selected': day.dateStr === selectedDate,
        }"
        @click="selectDay(day.dateStr)"
      >
        <span class="day-number">{{ day.day }}</span>
        <div v-if="day.dots.length > 0" class="dots">
          <span v-for="(dot, j) in day.dots.slice(0, 3)" :key="j" class="dot" :style="{ background: dot }"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useEventsStore } from '@/stores/events';
import { useCalendarsStore } from '@/stores/calendars';
import { useNotesStore } from '@/stores/notes';

const props = defineProps<{
  selectedDate: string;
}>();

const emit = defineEmits<{
  'select-date': [date: string];
  navigate: [date: string];
}>();

const eventsStore = useEventsStore();
const calendarsStore = useCalendarsStore();
const notesStore = useNotesStore();

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Current displayed month (year and month index)
const displayYear = ref(new Date().getFullYear());
const displayMonth = ref(new Date().getMonth()); // 0-based

// When selectedDate changes from parent, update display month
watch(() => props.selectedDate, (val) => {
  if (val) {
    const d = new Date(val + 'T00:00:00');
    displayYear.value = d.getFullYear();
    displayMonth.value = d.getMonth();
  }
}, { immediate: true });

const monthLabel = computed(() => {
  const d = new Date(displayYear.value, displayMonth.value, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
});

// Build map of date -> dot colors
const eventDotsMap = computed(() => {
  const map: Record<string, string[]> = {};

  for (const evt of eventsStore.events) {
    const dateStr = evt.startAt.split('T')[0];
    const cal = calendarsStore.calendars.find(c => c.id === evt.calendarId);
    const color = cal?.color || '#4f46e5';
    if (!map[dateStr]) map[dateStr] = [];
    if (!map[dateStr].includes(color)) {
      map[dateStr].push(color);
    }
  }

  for (const note of notesStore.notes) {
    if (note.scheduledDate) {
      const dateStr = note.scheduledDate.split('T')[0];
      if (!map[dateStr]) map[dateStr] = [];
      if (!map[dateStr].includes('#6b7280')) {
        map[dateStr].push('#6b7280');
      }
    }
  }

  return map;
});

const todayStr = computed(() => new Date().toISOString().split('T')[0]);

interface CalendarDay {
  day: number;
  dateStr: string;
  currentMonth: boolean;
  isToday: boolean;
  dots: string[];
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = displayYear.value;
  const month = displayMonth.value;
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Day of week for first day (0=Sun..6=Sat) -> convert to Monday-based (0=Mon..6=Sun)
  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6; // Sunday becomes 6

  const days: CalendarDay[] = [];

  // Previous month padding
  const prevMonthLast = new Date(year, month, 0);
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLast.getDate() - i;
    const dateStr = formatDateStr(year, month - 1, d);
    days.push({
      day: d,
      dateStr,
      currentMonth: false,
      isToday: dateStr === todayStr.value,
      dots: eventDotsMap.value[dateStr] || [],
    });
  }

  // Current month days
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const dateStr = formatDateStr(year, month, d);
    days.push({
      day: d,
      dateStr,
      currentMonth: true,
      isToday: dateStr === todayStr.value,
      dots: eventDotsMap.value[dateStr] || [],
    });
  }

  // Next month padding to fill 6 rows (42 cells)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = formatDateStr(year, month + 1, d);
    days.push({
      day: d,
      dateStr,
      currentMonth: false,
      isToday: dateStr === todayStr.value,
      dots: eventDotsMap.value[dateStr] || [],
    });
  }

  return days;
});

function formatDateStr(year: number, month: number, day: number): string {
  // Use Date constructor to handle month overflow/underflow
  const d = new Date(year, month, day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function prevMonth() {
  if (displayMonth.value === 0) {
    displayMonth.value = 11;
    displayYear.value--;
  } else {
    displayMonth.value--;
  }
  emit('navigate', formatDateStr(displayYear.value, displayMonth.value, 1));
}

function nextMonth() {
  if (displayMonth.value === 11) {
    displayMonth.value = 0;
    displayYear.value++;
  } else {
    displayMonth.value++;
  }
  emit('navigate', formatDateStr(displayYear.value, displayMonth.value, 1));
}

function selectDay(dateStr: string) {
  emit('select-date', dateStr);
}
</script>

<style scoped>
.month-view {
  padding: 0 12px;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
}

.nav-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--color-text);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  background: var(--color-bg-secondary);
}

.month-label {
  font-size: 16px;
  font-weight: 600;
  text-transform: capitalize;
}

.day-names {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding: 4px 0;
}

.day-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 4px 0;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 2px;
  cursor: pointer;
  border-radius: var(--radius);
  min-height: 44px;
}

.day-cell:hover {
  background: var(--color-bg-secondary);
}

.day-cell.other-month .day-number {
  color: var(--color-text-secondary);
  opacity: 0.4;
}

.day-cell.is-today .day-number {
  background: var(--color-primary-light);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell.is-selected {
  background: rgba(79, 70, 229, 0.1);
}

.day-cell.is-selected .day-number {
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
</style>
