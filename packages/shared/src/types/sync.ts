export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntity = 'note' | 'folder' | 'category' | 'calendar' | 'event' | 'share';

export interface SyncOperation {
  id: string;
  entity: SyncEntity;
  entityId: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SyncPushRequest {
  operations: SyncOperation[];
}

export interface SyncPushResponse {
  results: Array<{
    operationId: string;
    success: boolean;
    serverEntity?: Record<string, unknown>;
    error?: string;
  }>;
}

export interface SyncPullResponse {
  changes: Array<{
    entity: SyncEntity;
    entityId: string;
    action: SyncAction;
    data: Record<string, unknown>;
    updatedAt: string;
  }>;
  syncedAt: string;
}
