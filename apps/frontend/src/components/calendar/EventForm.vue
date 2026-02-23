<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="event-form" @click.stop>
      <header>
        <h2>{{ isEditing ? 'Modifier' : 'Nouvel evenement' }}</h2>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </header>

      <form @submit.prevent="save">
        <div class="field">
          <label>Titre</label>
          <input v-model="title" required placeholder="Titre de l'evenement" />
        </div>

        <div class="field">
          <label>Calendrier</label>
          <select v-model="calendarId">
            <option v-for="cal in calendars" :key="cal.id" :value="cal.id">{{ cal.name }}</option>
          </select>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Debut</label>
            <input type="date" v-model="startDate" required />
            <input v-if="!allDay" type="time" v-model="startTime" />
          </div>
          <div class="field">
            <label>Fin</label>
            <input type="date" v-model="endDate" required />
            <input v-if="!allDay" type="time" v-model="endTime" />
          </div>
        </div>

        <label class="checkbox-field">
          <input type="checkbox" v-model="allDay" />
          Toute la journee
        </label>

        <div class="field">
          <label>Recurrence</label>
          <select v-model="recurrence">
            <option value="">Aucune</option>
            <option value="FREQ=DAILY">Tous les jours</option>
            <option value="FREQ=WEEKLY">Chaque semaine</option>
            <option value="FREQ=MONTHLY">Chaque mois</option>
            <option value="FREQ=YEARLY">Chaque annee</option>
          </select>
        </div>

        <div class="field">
          <label>Rappel</label>
          <select v-model="reminder">
            <option :value="null">Aucun</option>
            <option :value="5">5 minutes avant</option>
            <option :value="15">15 minutes avant</option>
            <option :value="30">30 minutes avant</option>
            <option :value="60">1 heure avant</option>
            <option :value="1440">1 jour avant</option>
          </select>
        </div>

        <div class="field">
          <label>Description</label>
          <textarea v-model="description" rows="3" placeholder="Description optionnelle"></textarea>
        </div>

        <div class="form-actions">
          <button v-if="isEditing" type="button" class="btn-danger" @click="deleteEvent">Supprimer</button>
          <button type="submit" class="btn-primary-sm">{{ isEditing ? 'Enregistrer' : 'Creer' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventsStore } from '@/stores/events';
import { useCalendarsStore } from '@/stores/calendars';
import type { CalendarEvent } from '@time-gestion/shared';

const props = defineProps<{
  initialDate?: string;
  event?: CalendarEvent | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const eventsStore = useEventsStore();
const calendarsStore = useCalendarsStore();

const calendars = computed(() => calendarsStore.calendars);
const isEditing = computed(() => !!props.event);

const title = ref('');
const calendarId = ref('');
const startDate = ref('');
const startTime = ref('09:00');
const endDate = ref('');
const endTime = ref('10:00');
const allDay = ref(false);
const recurrence = ref('');
const reminder = ref<number | null>(null);
const description = ref('');

async function save() {
  const startAt = allDay.value
    ? `${startDate.value}T00:00:00.000Z`
    : `${startDate.value}T${startTime.value}:00.000Z`;
  const endAt = allDay.value
    ? `${endDate.value}T23:59:59.000Z`
    : `${endDate.value}T${endTime.value}:00.000Z`;

  const data = {
    calendarId: calendarId.value,
    title: title.value,
    description: description.value || undefined,
    startAt,
    endAt,
    allDay: allDay.value,
    recurrenceRule: recurrence.value || undefined,
    reminderMinutes: reminder.value ?? undefined,
  };

  if (isEditing.value && props.event) {
    await eventsStore.update(props.event.id, data);
  } else {
    await eventsStore.create(data);
  }
  emit('saved');
}

async function deleteEvent() {
  if (props.event) {
    await eventsStore.remove(props.event.id);
    emit('saved');
  }
}

onMounted(() => {
  if (props.event) {
    title.value = props.event.title;
    calendarId.value = props.event.calendarId;
    startDate.value = props.event.startAt.split('T')[0];
    startTime.value = props.event.startAt.split('T')[1]?.substring(0, 5) || '09:00';
    endDate.value = props.event.endAt.split('T')[0];
    endTime.value = props.event.endAt.split('T')[1]?.substring(0, 5) || '10:00';
    allDay.value = props.event.allDay;
    recurrence.value = props.event.recurrenceRule || '';
    reminder.value = props.event.reminderMinutes ?? null;
    description.value = props.event.description || '';
  } else {
    startDate.value = props.initialDate || new Date().toISOString().split('T')[0];
    endDate.value = startDate.value;
    if (calendars.value.length > 0) {
      calendarId.value = calendars.value[0].id;
    }
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}

.event-form {
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
}

.event-form header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.event-form header h2 {
  font-size: 18px;
  font-weight: 700;
}

.btn-close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius);
}

.btn-close:hover {
  background: var(--color-bg-secondary);
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 15px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--color-primary);
}

.field textarea {
  resize: vertical;
}

.field input[type="time"] {
  margin-top: 6px;
}

.field-row {
  display: flex;
  gap: 12px;
}

.field-row .field {
  flex: 1;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 14px;
  cursor: pointer;
  color: var(--color-text);
}

.checkbox-field input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.btn-danger {
  padding: 8px 16px;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius);
  background: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 14px;
  margin-right: auto;
}

.btn-danger:hover {
  background: var(--color-danger);
  color: white;
}

.btn-primary-sm {
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius);
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-primary-sm:hover {
  background: var(--color-primary-dark);
}
</style>
