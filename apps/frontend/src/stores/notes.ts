import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { Note, CreateNoteDto, UpdateNoteDto } from '@time-gestion/shared';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    notes.value = await db.notes.filter(n => !n.deletedAt).toArray();
  }

  async function create(dto: CreateNoteDto): Promise<Note> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const note: Note = {
      id,
      userId: '',
      title: dto.title,
      content: dto.content || {},
      folderId: dto.folderId || null,
      categoryId: dto.categoryId || null,
      isPinned: dto.isPinned || false,
      scheduledDate: dto.scheduledDate || null,
      scheduledTime: dto.scheduledTime || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.notes.put(note);
    await db.syncQueue.add({
      entity: 'note',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    notes.value = [note, ...notes.value];
    return note;
  }

  async function update(id: string, dto: UpdateNoteDto) {
    const now = new Date().toISOString();
    await db.notes.update(id, { ...dto, updatedAt: now } as Partial<Note>);
    await db.syncQueue.add({
      entity: 'note',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });
    const idx = notes.value.findIndex(n => n.id === id);
    if (idx >= 0) {
      notes.value[idx] = { ...notes.value[idx], ...dto, updatedAt: now };
    }
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.notes.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'note',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    notes.value = notes.value.filter(n => n.id !== id);
  }

  return { notes, loading, loadFromLocal, create, update, remove };
});
