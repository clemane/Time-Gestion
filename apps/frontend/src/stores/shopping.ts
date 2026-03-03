import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { ShoppingItem, CreateShoppingItemDto } from '@time-gestion/shared';

export const useShoppingStore = defineStore('shopping', () => {
  const items = ref<ShoppingItem[]>([]);
  const loading = ref(false);

  async function loadByWeek(weekStart: string) {
    items.value = await db.shoppingItems
      .where('weekStart')
      .equals(weekStart)
      .toArray();
    items.value.sort((a, b) => {
      if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }

  async function addManualItem(dto: CreateShoppingItemDto): Promise<ShoppingItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const item: ShoppingItem = {
      id,
      userId: '',
      name: dto.name,
      quantity: dto.quantity ?? null,
      unit: dto.unit || null,
      isChecked: false,
      sourceRecipeId: null,
      weekStart: dto.weekStart,
      createdAt: now,
    };

    await db.shoppingItems.put(item);
    await db.syncQueue.add({
      entity: 'shoppingItem',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    items.value = [...items.value, item];
    return item;
  }

  async function toggleCheck(id: string) {
    const item = items.value.find(i => i.id === id);
    if (!item) return;

    const isChecked = !item.isChecked;
    await db.shoppingItems.update(id, { isChecked });
    await db.syncQueue.add({
      entity: 'shoppingItem',
      entityId: id,
      action: 'UPDATE',
      payload: { isChecked },
      timestamp: new Date().toISOString(),
    });

    const idx = items.value.findIndex(i => i.id === id);
    if (idx >= 0) {
      items.value[idx] = { ...items.value[idx], isChecked };
    }
  }

  async function removeItem(id: string) {
    await db.shoppingItems.delete(id);
    await db.syncQueue.add({
      entity: 'shoppingItem',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: new Date().toISOString(),
    });
    items.value = items.value.filter(i => i.id !== id);
  }

  async function clearChecked(weekStart: string) {
    const checked = items.value.filter(i => i.isChecked);
    for (const item of checked) {
      await removeItem(item.id);
    }
  }

  async function generateFromPlan(weekStart: string) {
    const start = weekStart;
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 7);
    const end = endDate.toISOString().split('T')[0];

    const slots = await db.mealSlots
      .where('date')
      .between(start, end, true, false)
      .filter(s => !s.deletedAt && !!s.recipeId)
      .toArray();

    const aggregated = new Map<string, { name: string; quantity: number; unit: string | null; sourceRecipeId: string }>();

    for (const slot of slots) {
      if (!slot.recipeId) continue;
      const ingredients = await db.recipeIngredients
        .where('recipeId')
        .equals(slot.recipeId)
        .toArray();

      for (const ing of ingredients) {
        const key = `${ing.name.toLowerCase().trim()}|${(ing.unit || '').toLowerCase().trim()}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity += ing.quantity || 0;
        } else {
          aggregated.set(key, {
            name: ing.name,
            quantity: ing.quantity || 0,
            unit: ing.unit,
            sourceRecipeId: slot.recipeId,
          });
        }
      }
    }

    const oldGenerated = items.value.filter(i => i.sourceRecipeId);
    for (const item of oldGenerated) {
      await db.shoppingItems.delete(item.id);
    }

    const now = new Date().toISOString();
    const newItems: ShoppingItem[] = Array.from(aggregated.values()).map(agg => ({
      id: crypto.randomUUID(),
      userId: '',
      name: agg.name,
      quantity: agg.quantity || null,
      unit: agg.unit,
      isChecked: false,
      sourceRecipeId: agg.sourceRecipeId,
      weekStart,
      createdAt: now,
    }));

    if (newItems.length > 0) {
      await db.shoppingItems.bulkPut(newItems);
    }

    await loadByWeek(weekStart);
  }

  return { items, loading, loadByWeek, addManualItem, toggleCheck, removeItem, clearChecked, generateFromPlan };
});
