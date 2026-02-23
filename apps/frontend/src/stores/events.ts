import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { CalendarEvent, CreateEventDto, UpdateEventDto } from '@time-gestion/shared';

export const useEventsStore = defineStore('events', () => {
  const events = ref<CalendarEvent[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    events.value = await db.events.filter(e => !e.deletedAt).toArray();
  }

  async function create(dto: CreateEventDto): Promise<CalendarEvent> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id,
      calendarId: dto.calendarId,
      userId: '',
      title: dto.title,
      description: dto.description || null,
      startAt: dto.startAt,
      endAt: dto.endAt,
      allDay: dto.allDay || false,
      recurrenceRule: dto.recurrenceRule || null,
      reminderMinutes: dto.reminderMinutes ?? null,
      noteId: dto.noteId || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.events.put(event);
    await db.syncQueue.add({
      entity: 'event',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    events.value = [event, ...events.value];
    return event;
  }

  async function update(id: string, dto: UpdateEventDto) {
    const now = new Date().toISOString();
    await db.events.update(id, { ...dto, updatedAt: now } as Partial<CalendarEvent>);
    await db.syncQueue.add({
      entity: 'event',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    const idx = events.value.findIndex(e => e.id === id);
    if (idx >= 0) {
      events.value[idx] = { ...events.value[idx], ...dto, updatedAt: now };
    }
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.events.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'event',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    events.value = events.value.filter(e => e.id !== id);
  }

  return { events, loading, loadFromLocal, create, update, remove };
});
