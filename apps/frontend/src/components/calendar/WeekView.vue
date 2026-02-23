<template>
  <div class="week-view" @touchstart="swipe.onTouchStart" @touchend="swipe.onTouchEnd">
    <div class="week-nav">
      <button class="nav-btn" @click="prevWeek">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="week-label">{{ weekLabel }}</span>
      <button class="nav-btn" @click="nextWeek">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

    <!-- Day headers -->
    <div class="week-day-headers">
      <div class="time-gutter-header"></div>
      <div
        v-for="day in weekDays"
        :key="day.dateStr"
        class="week-day-header"
        :class="{ 'is-today': day.isToday, 'is-selected': day.dateStr === selectedDate }"
        @click="emit('select-date', day.dateStr)"
      >
        <div class="day-name">{{ day.dayName }}</div>
        <div class="day-num">{{ day.dayNum }}</div>
      </div>
    </div>

    <!-- All-day events row -->
    <div v-if="allDayEvents.length > 0" class="all-day-row">
      <div class="time-gutter all-day-label">Journee</div>
      <div class="all-day-events">
        <div
          v-for="evt in allDayEvents"
          :key="evt.id"
          class="all-day-event"
          :style="{ background: evt.color }"
        >
          {{ evt.title }}
        </div>
      </div>
    </div>

    <!-- Time grid -->
    <div class="time-grid-container" ref="gridContainer">
      <div class="time-grid">
        <!-- Hour rows: gutter + cells -->
        <div v-for="hour in hours" :key="hour" class="time-row">
          <div class="time-gutter">{{ String(hour).padStart(2, '0') }}:00</div>
          <div class="time-cells">
            <div
              v-for="day in weekDays"
              :key="day.dateStr"
              class="time-cell"
              :class="{ 'is-today': day.isToday }"
            ></div>
          </div>
        </div>

        <!-- Event overlay: positioned within the cells area (after the gutter) -->
        <div class="events-overlay">
          <div
            v-for="block in eventBlocks"
            :key="block.id"
            class="event-block"
            :style="{
              top: block.top + 'px',
              height: block.height + 'px',
              left: block.leftPercent + '%',
              width: 'calc(' + block.widthPercent + '% - 2px)',
              background: block.color,
            }"
            @click="emit('select-date', block.dateStr)"
          >
            <div class="event-block-title">{{ block.title }}</div>
            <div class="event-block-time">{{ block.timeLabel }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useEventsStore } from '@/stores/events';
import { useCalendarsStore } from '@/stores/calendars';
import { useSwipe } from '@/composables/useSwipe';

const props = defineProps<{
  selectedDate: string;
}>();

const emit = defineEmits<{
  'select-date': [date: string];
  navigate: [date: string];
}>();

const eventsStore = useEventsStore();
const calendarsStore = useCalendarsStore();

const swipe = useSwipe(
  () => nextWeek(),
  () => prevWeek(),
);

const gridContainer = ref<HTMLElement | null>(null);

const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00
const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 7;
const dayNamesShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Track which Monday the week starts from
const weekStart = ref('');

// Set weekStart from selectedDate
watch(() => props.selectedDate, (val) => {
  if (val) {
    weekStart.value = getMonday(val);
  }
}, { immediate: true });

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  // day: 0=Sun, 1=Mon...6=Sat -> offset to Monday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDateStr(d);
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return formatDateStr(d);
}

const todayStr = computed(() => new Date().toISOString().split('T')[0]);

interface WeekDay {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

const weekDays = computed<WeekDay[]>(() => {
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dateStr = addDays(weekStart.value, i);
    const d = new Date(dateStr + 'T00:00:00');
    days.push({
      dateStr,
      dayName: dayNamesShort[i],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr.value,
    });
  }
  return days;
});

const weekLabel = computed(() => {
  const start = new Date(weekStart.value + 'T00:00:00');
  const end = new Date(addDays(weekStart.value, 6) + 'T00:00:00');
  const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} - ${endStr}`;
});

// All-day events
const allDayEvents = computed(() => {
  const items: Array<{ id: string; title: string; color: string }> = [];
  const weekEnd = addDays(weekStart.value, 6);

  for (const evt of eventsStore.events) {
    if (!evt.allDay) continue;
    const evtDate = evt.startAt.split('T')[0];
    if (evtDate >= weekStart.value && evtDate <= weekEnd) {
      const cal = calendarsStore.calendars.find(c => c.id === evt.calendarId);
      items.push({
        id: evt.id,
        title: evt.title,
        color: cal?.color || '#4f46e5',
      });
    }
  }
  return items;
});

// Positioned timed event blocks
interface EventBlock {
  id: string;
  title: string;
  timeLabel: string;
  dateStr: string;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  color: string;
}

const eventBlocks = computed<EventBlock[]>(() => {
  const blocks: EventBlock[] = [];
  const weekEnd = addDays(weekStart.value, 6);

  for (const evt of eventsStore.events) {
    if (evt.allDay) continue;
    const evtDate = evt.startAt.split('T')[0];
    if (evtDate < weekStart.value || evtDate > weekEnd) continue;

    // Find which column (day index)
    const dayIndex = weekDays.value.findIndex(d => d.dateStr === evtDate);
    if (dayIndex < 0) continue;

    const cal = calendarsStore.calendars.find(c => c.id === evt.calendarId);
    const color = cal?.color || '#4f46e5';

    // Parse start and end times from ISO string
    const startTimePart = evt.startAt.split('T')[1] || '09:00:00';
    const endTimePart = evt.endAt.split('T')[1] || '10:00:00';
    const startParts = startTimePart.substring(0, 5).split(':');
    const endParts = endTimePart.substring(0, 5).split(':');
    const startHour = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
    const endHour = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;

    const top = (startHour - START_HOUR) * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20);
    const leftPercent = (dayIndex / 7) * 100;
    const widthPercent = 100 / 7;

    const startTimeFormatted = startTimePart.substring(0, 5);
    const endTimeFormatted = endTimePart.substring(0, 5);

    blocks.push({
      id: evt.id,
      title: evt.title,
      timeLabel: `${startTimeFormatted} - ${endTimeFormatted}`,
      dateStr: evtDate,
      top,
      height,
      leftPercent,
      widthPercent,
      color,
    });
  }
  return blocks;
});

function prevWeek() {
  weekStart.value = addDays(weekStart.value, -7);
  emit('navigate', weekStart.value);
}

function nextWeek() {
  weekStart.value = addDays(weekStart.value, 7);
  emit('navigate', weekStart.value);
}

onMounted(() => {
  // Scroll to ~8am
  nextTick(() => {
    if (gridContainer.value) {
      gridContainer.value.scrollTop = HOUR_HEIGHT; // 1 hour from top (8am)
    }
  });
});
</script>

<style scoped>
.week-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.week-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
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

.week-label {
  font-size: 14px;
  font-weight: 600;
}

.week-day-headers {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.time-gutter-header {
  width: 50px;
  flex-shrink: 0;
}

.week-day-header {
  flex: 1;
  text-align: center;
  padding: 4px 0 8px;
  cursor: pointer;
}

.week-day-header .day-name {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  font-weight: 600;
}

.week-day-header .day-num {
  font-size: 18px;
  font-weight: 600;
  margin-top: 2px;
}

.week-day-header.is-today .day-num {
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.week-day-header.is-selected {
  background: rgba(79, 70, 229, 0.05);
}

.all-day-row {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  padding: 4px 0;
}

.all-day-label {
  font-size: 10px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.all-day-events {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px 4px;
}

.all-day-event {
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.time-grid-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.time-grid {
  position: relative;
  min-height: calc(16 * 60px); /* 16 hours * 60px */
}

.time-row {
  display: flex;
  height: 60px;
  border-bottom: 1px solid var(--color-border);
}

.time-gutter {
  width: 50px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--color-text-secondary);
  text-align: right;
  padding-right: 8px;
  padding-top: 0;
  transform: translateY(-7px);
}

.time-cells {
  flex: 1;
  display: flex;
}

.time-cell {
  flex: 1;
  border-left: 1px solid var(--color-border);
}

.time-cell.is-today {
  background: rgba(79, 70, 229, 0.03);
}

/* Event overlay sits on top of the grid, offset by the gutter width */
.events-overlay {
  position: absolute;
  top: 0;
  left: 50px;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.event-block {
  position: absolute;
  border-radius: 4px;
  padding: 4px 6px;
  color: white;
  overflow: hidden;
  cursor: pointer;
  z-index: 5;
  opacity: 0.9;
  pointer-events: auto;
}

.event-block-title {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-block-time {
  font-size: 10px;
  opacity: 0.85;
}
</style>
