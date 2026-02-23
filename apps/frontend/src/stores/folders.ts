import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { Folder, CreateFolderDto, UpdateFolderDto } from '@time-gestion/shared';

export const useFoldersStore = defineStore('folders', () => {
  const folders = ref<Folder[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    folders.value = await db.folders.filter(f => !f.deletedAt).toArray();
  }

  async function create(dto: CreateFolderDto): Promise<Folder> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const folder: Folder = {
      id,
      userId: '',
      parentId: dto.parentId || null,
      name: dto.name,
      sortOrder: 0,
      updatedAt: now,
      deletedAt: null,
    };
    await db.folders.put(folder);
    await db.syncQueue.add({
      entity: 'folder',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    folders.value = [folder, ...folders.value];
    return folder;
  }

  async function update(id: string, dto: UpdateFolderDto) {
    const now = new Date().toISOString();
    await db.folders.update(id, { ...dto, updatedAt: now } as Partial<Folder>);
    await db.syncQueue.add({
      entity: 'folder',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    const idx = folders.value.findIndex(f => f.id === id);
    if (idx >= 0) {
      folders.value[idx] = { ...folders.value[idx], ...dto, updatedAt: now };
    }
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.folders.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'folder',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    folders.value = folders.value.filter(f => f.id !== id);
  }

  return { folders, loading, loadFromLocal, create, update, remove };
});
