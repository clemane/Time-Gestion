<template>
  <Transition name="modal">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="event-form" @click.stop>
        <header>
          <h2>{{ isEditing ? 'Modifier' : 'Nouvel evenement' }}</h2>
          <button class="btn-close" @click="$emit('close')">
            <X :size="20" />
          </button>
        </header>

        <form @submit.prevent="save">
          <div class="field">
            <label>Titre</label>
            <input v-model="title" required placeholder="Titre de l'evenement" />
          </div>

          <div class="field">
            <label>Groupe</label>
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
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEventsStore } from '@/stores/events';
import { useCalendarsStore } from '@/stores/calendars';
import { X } from 'lucide-vue-next';
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
  background: rgba(44, 37, 32, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;
}

.event-form {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  width: 100%;
  max-width: 420px;
  max-height: 92vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: var(--shadow-overlay);
}

@media (min-width: 600px) {
  .modal-overlay {
    align-items: center;
    padding: 16px;
  }
  .event-form {
    border-radius: var(--radius-xl);
    padding: 24px;
    max-height: 90vh;
  }
}

.event-form header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.event-form header h2 {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 400;
  color: var(--color-text);
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s ease;
}

.btn-close:hover {
  color: var(--color-text);
}

.btn-close:active {
  opacity: 0.6;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font-body);
  font-size: 15px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s ease;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--color-primary);
}

.field textarea {
  resize: vertical;
  min-height: 80px;
}

.field input[type="time"] {
  margin-top: 8px;
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
  gap: 10px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 400;
  margin-bottom: 16px;
  cursor: pointer;
  color: var(--color-text);
  -webkit-tap-highlight-color: transparent;
}

.checkbox-field input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 0.5px solid var(--color-border-subtle);
}

.btn-danger {
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius);
  background: none;
  color: var(--color-danger);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  margin-right: auto;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s ease;
}

.btn-danger:hover {
  opacity: 0.7;
}

.btn-danger:active {
  opacity: 0.5;
}

.btn-primary-sm {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius);
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s ease;
}

.btn-primary-sm:hover {
  opacity: 0.85;
}

.btn-primary-sm:active {
  opacity: 0.7;
}

/* Modal transition */

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--transition-base);
}

.modal-enter-active .event-form,
.modal-leave-active .event-form {
  transition: transform 0.3s var(--spring), opacity var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .event-form {
  transform: translateY(100%);
}

.modal-leave-to .event-form {
  transform: translateY(100%);
}
</style>
