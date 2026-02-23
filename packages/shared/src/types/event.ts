export interface CalendarEvent {
  id: string;
  calendarId: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  recurrenceRule: string | null;
  reminderMinutes: number | null;
  noteId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateEventDto {
  calendarId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  recurrenceRule?: string;
  reminderMinutes?: number;
  noteId?: string;
}

export interface UpdateEventDto {
  calendarId?: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  recurrenceRule?: string | null;
  reminderMinutes?: number | null;
  noteId?: string | null;
}
