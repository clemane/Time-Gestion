export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  instructions: Record<string, unknown>;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  imageUrl: string | null;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sortOrder: number;
}

export interface CreateRecipeDto {
  title: string;
  description?: string;
  instructions?: Record<string, unknown>;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  tags?: string[];
  isFavorite?: boolean;
  ingredients?: Omit<RecipeIngredient, 'id' | 'recipeId'>[];
}

export interface UpdateRecipeDto {
  title?: string;
  description?: string | null;
  instructions?: Record<string, unknown>;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  imageUrl?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  ingredients?: Omit<RecipeIngredient, 'id' | 'recipeId'>[];
}
