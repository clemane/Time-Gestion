export interface ShoppingItem {
  id: string;
  userId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  isChecked: boolean;
  sourceRecipeId: string | null;
  weekStart: string;
  createdAt: string;
}

export interface CreateShoppingItemDto {
  name: string;
  quantity?: number;
  unit?: string;
  weekStart: string;
}

export interface GenerateShoppingDto {
  weekStart: string;
}
