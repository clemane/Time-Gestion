export type ResourceType = 'NOTE' | 'FOLDER' | 'CALENDAR';
export type Permission = 'READ' | 'WRITE';

export interface Share {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  ownerId: string;
  sharedWithId: string;
  permission: Permission;
  createdAt: string;
}

export interface CreateShareDto {
  resourceType: ResourceType;
  resourceId: string;
  sharedWithEmail: string;
  permission: Permission;
}
