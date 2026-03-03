import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '@/db/schema';
import type { MealSlot, CreateMealSlotDto, UpdateMealSlotDto } from '@time-gestion/shared';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export const useMealPlanStore = defineStore('mealPlan', () => {
  const mealSlots = ref<MealSlot[]>([]);
  const currentWeekStart = ref(getWeekStart(new Date()));
  const loading = ref(false);

  const slotsByDay = computed(() => {
    const grouped: Record<string, MealSlot[]> = {};
    for (const slot of mealSlots.value) {
      const day = slot.date.split('T')[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(slot);
    }
    for (const day of Object.keys(grouped)) {
      grouped[day].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return grouped;
  });

  async function loadWeek(weekStart?: string) {
    if (weekStart) currentWeekStart.value = weekStart;
    const start = currentWeekStart.value;
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    mealSlots.value = await db.mealSlots
      .where('date')
      .between(start, end.toISOString().split('T')[0], true, false)
      .filter(s => !s.deletedAt)
      .toArray();
  }

  async function addSlot(dto: CreateMealSlotDto): Promise<MealSlot> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const slot: MealSlot = {
      id,
      userId: '',
      recipeId: dto.recipeId || null,
      date: dto.date,
      slotName: dto.slotName,
      customTitle: dto.customTitle || null,
      sortOrder: dto.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.mealSlots.put(slot);
    await db.syncQueue.add({
      entity: 'mealSlot',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    mealSlots.value = [...mealSlots.value, slot];
    return slot;
  }

  async function assignRecipe(slotId: string, recipeId: string | null) {
    await updateSlot(slotId, { recipeId });
  }

  async function updateSlot(id: string, dto: UpdateMealSlotDto) {
    const now = new Date().toISOString();
    await db.mealSlots.update(id, { ...dto, updatedAt: now } as Partial<MealSlot>);
    await db.syncQueue.add({
      entity: 'mealSlot',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    const idx = mealSlots.value.findIndex(s => s.id === id);
    if (idx >= 0) {
      mealSlots.value[idx] = { ...mealSlots.value[idx], ...dto, updatedAt: now };
    }
  }

  async function removeSlot(id: string) {
    const now = new Date().toISOString();
    await db.mealSlots.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'mealSlot',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    mealSlots.value = mealSlots.value.filter(s => s.id !== id);
  }

  function prevWeek() {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() - 7);
    loadWeek(d.toISOString().split('T')[0]);
  }

  function nextWeek() {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() + 7);
    loadWeek(d.toISOString().split('T')[0]);
  }

  return {
    mealSlots, currentWeekStart, loading, slotsByDay,
    loadWeek, addSlot, assignRecipe, updateSlot, removeSlot,
    prevWeek, nextWeek,
  };
});
