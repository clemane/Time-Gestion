<template>
  <div class="month-view" @touchstart="swipe.onTouchStart" @touchend="swipe.onTouchEnd">
    <div class="month-nav">
      <button class="nav-btn" @click="prevMonth">
        <ChevronLeft :size="20" />
      </button>
      <span class="month-label">{{ monthLabel }}</span>
      <button class="nav-btn" @click="nextMonth">
        <ChevronRight :size="20" />
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
import { useSwipe } from '@/composables/useSwipe';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  selectedDate: string;
  selectedGroupId?: string | null;
}>();

const emit = defineEmits<{
  'select-date': [date: string];
  navigate: [date: string];
}>();

const eventsStore = useEventsStore();
const calendarsStore = useCalendarsStore();
const notesStore = useNotesStore();

const swipe = useSwipe(
  () => nextMonth(),
  () => prevMonth(),
);

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const displayYear = ref(new Date().getFullYear());
const displayMonth = ref(new Date().getMonth());

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

const eventDotsMap = computed(() => {
  const map: Record<string, string[]> = {};

  for (const evt of eventsStore.events) {
    if (props.selectedGroupId && evt.calendarId !== props.selectedGroupId) continue;
    const dateStr = evt.startAt.split('T')[0];
    const cal = calendarsStore.calendars.find(c => c.id === evt.calendarId);
    const color = cal?.color || '#4f46e5';
    if (!map[dateStr]) map[dateStr] = [];
    if (!map[dateStr].includes(color)) {
      map[dateStr].push(color);
    }
  }

  for (const note of notesStore.notes) {
    if (props.selectedGroupId && note.calendarId !== props.selectedGroupId) continue;
    if (note.scheduledDate) {
      const dateStr = note.scheduledDate.split('T')[0];
      const cal = note.calendarId ? calendarsStore.calendars.find(c => c.id === note.calendarId) : null;
      const color = cal?.color || '#6b7280';
      if (!map[dateStr]) map[dateStr] = [];
      if (!map[dateStr].includes(color)) {
        map[dateStr].push(color);
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

  let startDow = firstOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: CalendarDay[] = [];

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
  padding: 0 16px;
  background: var(--color-bg);
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px 8px;
}

.nav-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn:hover {
  opacity: 0.7;
}

.nav-btn:active {
  opacity: 0.5;
}

.month-label {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  text-transform: capitalize;
  color: var(--color-text);
}

.day-names {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding: 8px 0 4px;
}

.day-name {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 4px 0;
  text-transform: uppercase;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 2px;
  cursor: pointer;
  border-radius: 0;
  min-height: 48px;
  background: var(--color-bg);
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.day-cell:hover {
  background: var(--color-bg-secondary);
}

.day-cell:active {
  background: var(--color-bg-secondary);
}

.day-cell.other-month .day-number {
  color: var(--color-text-tertiary);
}

.day-cell.is-today .day-number {
  color: var(--color-accent);
  font-weight: 600;
  border-bottom: 2px solid var(--color-accent);
}

.day-cell.is-selected {
  background: var(--color-primary-ghost);
}

.day-cell.is-selected .day-number {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-bottom: none;
}

.day-cell.is-today.is-selected .day-number {
  background: var(--color-primary);
  color: white;
  border-bottom: none;
}

.day-number {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--color-text);
  transition: background 0.15s ease, color 0.15s ease;
}

.dots {
  display: flex;
  gap: 3px;
  margin-top: 2px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
</style>
