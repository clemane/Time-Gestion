import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { Calendar, CreateCalendarDto, UpdateCalendarDto } from '@time-gestion/shared';

export const useCalendarsStore = defineStore('calendars', () => {
  const calendars = ref<Calendar[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    calendars.value = await db.calendars.filter(c => !c.deletedAt).toArray();
  }

  async function create(dto: CreateCalendarDto): Promise<Calendar> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const calendar: Calendar = {
      id,
      userId: '',
      name: dto.name,
      color: dto.color,
      updatedAt: now,
      deletedAt: null,
    };
    await db.calendars.put(calendar);
    await db.syncQueue.add({
      entity: 'calendar',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    calendars.value = [calendar, ...calendars.value];
    return calendar;
  }

  async function update(id: string, dto: UpdateCalendarDto) {
    const now = new Date().toISOString();
    await db.calendars.update(id, { ...dto, updatedAt: now } as Partial<Calendar>);
    await db.syncQueue.add({
      entity: 'calendar',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    const idx = calendars.value.findIndex(c => c.id === id);
    if (idx >= 0) {
      calendars.value[idx] = { ...calendars.value[idx], ...dto, updatedAt: now };
    }
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.calendars.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'calendar',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    // Orphan notes: set calendarId to null
    await db.notes.where('calendarId').equals(id).modify({ calendarId: null });
    calendars.value = calendars.value.filter(c => c.id !== id);
  }

  async function seedDefaults() {
    const existing = await db.calendars.count();
    if (existing > 0) return;

    const now = new Date().toISOString();
    const defaults = [
      { name: 'Personnel', color: '#059669' },
      { name: 'Travail', color: '#4f46e5' },
    ];
    const cals: Calendar[] = defaults.map((d) => ({
      id: crypto.randomUUID(),
      userId: '',
      name: d.name,
      color: d.color,
      updatedAt: now,
      deletedAt: null,
    }));

    await db.calendars.bulkPut(cals);
    calendars.value = cals;
  }

  return { calendars, loading, loadFromLocal, create, update, remove, seedDefaults };
});
