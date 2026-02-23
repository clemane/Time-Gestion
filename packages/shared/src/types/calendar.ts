export interface Calendar {
  id: string;
  userId: string;
  name: string;
  color: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCalendarDto {
  name: string;
  color: string;
}

export interface UpdateCalendarDto {
  name?: string;
  color?: string;
}
