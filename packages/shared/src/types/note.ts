export interface Note {
  id: string;
  userId: string;
  folderId: string | null;
  calendarId: string | null;
  categoryId: string | null;
  title: string;
  content: Record<string, unknown>;
  tags: string[];
  isPinned: boolean;
  scheduledDate: string | null;
  scheduledTime: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateNoteDto {
  title: string;
  content?: Record<string, unknown>;
  tags?: string[];
  folderId?: string;
  calendarId?: string;
  categoryId?: string;
  isPinned?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: Record<string, unknown>;
  tags?: string[];
  folderId?: string | null;
  calendarId?: string | null;
  categoryId?: string | null;
  isPinned?: boolean;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
}
