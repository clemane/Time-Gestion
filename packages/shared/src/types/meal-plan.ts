export interface MealSlot {
  id: string;
  userId: string;
  recipeId: string | null;
  date: string;
  slotName: string;
  customTitle: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateMealSlotDto {
  recipeId?: string;
  date: string;
  slotName: string;
  customTitle?: string;
  sortOrder?: number;
}

export interface UpdateMealSlotDto {
  recipeId?: string | null;
  date?: string;
  slotName?: string;
  customTitle?: string | null;
  sortOrder?: number;
}
