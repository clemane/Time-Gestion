export interface CategoryStyle {
  backgroundColor: string;
  lineStyle: 'none' | 'lined' | 'grid';
  fontFamily: string;
  fontSize: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  style: CategoryStyle;
  defaultContent: Record<string, unknown> | null;
  isDefault: boolean;
  sortOrder: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  style: CategoryStyle;
  defaultContent?: Record<string, unknown>;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string | null;
  style?: Partial<CategoryStyle>;
  defaultContent?: Record<string, unknown> | null;
  sortOrder?: number;
}
