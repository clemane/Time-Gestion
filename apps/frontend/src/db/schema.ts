import Dexie, { type Table } from 'dexie';
import type { Note, Folder, Category, Calendar, CalendarEvent, Share } from '@time-gestion/shared';

export interface SyncQueueItem {
  id?: number;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SyncMeta {
  key: string;
  value: string;
}

export class TimeGestionDB extends Dexie {
  notes!: Table<Note>;
  folders!: Table<Folder>;
  categories!: Table<Category>;
  calendars!: Table<Calendar>;
  events!: Table<CalendarEvent>;
  shares!: Table<Share>;
  syncQueue!: Table<SyncQueueItem>;
  syncMeta!: Table<SyncMeta>;

  constructor() {
    super('time-gestion');

    this.version(1).stores({
      notes: 'id, userId, folderId, categoryId, isPinned, scheduledDate, updatedAt',
      folders: 'id, userId, parentId, updatedAt',
      categories: 'id, userId, updatedAt',
      calendars: 'id, userId, updatedAt',
      events: 'id, calendarId, userId, startAt, endAt, noteId, updatedAt',
      shares: 'id, resourceType, resourceId, ownerId, sharedWithId',
      syncQueue: '++id, entity, entityId, timestamp',
      syncMeta: 'key',
    });
  }
}

export const db = new TimeGestionDB();
