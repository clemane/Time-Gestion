export interface Folder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateFolderDto {
  name: string;
  parentId?: string;
}

export interface UpdateFolderDto {
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
}
