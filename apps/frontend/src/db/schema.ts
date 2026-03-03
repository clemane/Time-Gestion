import Dexie, { type Table } from 'dexie';
import type { Note, Folder, Category, Calendar, CalendarEvent, Share, Recipe, RecipeIngredient, MealSlot, ShoppingItem } from '@time-gestion/shared';

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
  recipes!: Table<Recipe>;
  recipeIngredients!: Table<RecipeIngredient>;
  mealSlots!: Table<MealSlot>;
  shoppingItems!: Table<ShoppingItem>;

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

    this.version(2).stores({
      notes: 'id, userId, folderId, calendarId, categoryId, isPinned, scheduledDate, updatedAt',
    });

    this.version(3).stores({
      recipes: 'id, userId, isFavorite, updatedAt',
      recipeIngredients: 'id, recipeId',
      mealSlots: 'id, userId, date, recipeId, updatedAt',
      shoppingItems: 'id, userId, weekStart, isChecked',
    });

    this.version(4).stores({
      notes: 'id, userId, folderId, calendarId, categoryId, isPinned, scheduledDate, updatedAt, *tags',
    }).upgrade(tx => {
      return tx.table('notes').toCollection().modify(note => {
        if (!note.tags) note.tags = [];
      });
    });
  }
}

export const db = new TimeGestionDB();
