import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@time-gestion/shared';

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    categories.value = await db.categories.filter(c => !c.deletedAt).toArray();
  }

  async function create(dto: CreateCategoryDto): Promise<Category> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const category: Category = {
      id,
      userId: '',
      name: dto.name,
      icon: dto.icon || null,
      style: dto.style,
      defaultContent: dto.defaultContent || null,
      isDefault: false,
      sortOrder: 0,
      updatedAt: now,
      deletedAt: null,
    };
    await db.categories.put(category);
    await db.syncQueue.add({
      entity: 'category',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    categories.value = [category, ...categories.value];
    return category;
  }

  async function update(id: string, dto: UpdateCategoryDto) {
    const now = new Date().toISOString();
    await db.categories.update(id, { ...dto, updatedAt: now } as Partial<Category>);
    await db.syncQueue.add({
      entity: 'category',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    const idx = categories.value.findIndex(c => c.id === id);
    if (idx >= 0) {
      const existing = categories.value[idx];
      const mergedStyle = dto.style
        ? { ...existing.style, ...dto.style }
        : existing.style;
      categories.value[idx] = {
        ...existing,
        ...dto,
        style: mergedStyle,
        updatedAt: now,
      };
    }
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.categories.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'category',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    categories.value = categories.value.filter(c => c.id !== id);
  }

  return { categories, loading, loadFromLocal, create, update, remove };
});
