import { db } from '@/db/schema';
import { apiFetch } from '@/api/client';
import type { SyncPushResponse, SyncPullResponse } from '@time-gestion/shared';

export async function pushPendingChanges() {
  const pending = await db.syncQueue.orderBy('id').toArray();
  if (pending.length === 0) return;

  const operations = pending.map(op => ({
    id: String(op.id),
    entity: op.entity as 'note' | 'folder' | 'category' | 'calendar' | 'event' | 'share',
    entityId: op.entityId,
    action: op.action as 'CREATE' | 'UPDATE' | 'DELETE',
    payload: op.payload,
    timestamp: op.timestamp,
  }));

  const response = await apiFetch<SyncPushResponse>('/sync/push', {
    method: 'POST',
    body: JSON.stringify({ operations }),
  });

  const successIds = response.results
    .filter(r => r.success)
    .map(r => Number(r.operationId));

  if (successIds.length > 0) {
    await db.syncQueue.bulkDelete(successIds);
  }
}

export async function pullRemoteChanges() {
  const meta = await db.syncMeta.get('lastSync');
  const since = meta?.value || new Date(0).toISOString();

  const response = await apiFetch<SyncPullResponse>(
    `/sync/pull?since=${encodeURIComponent(since)}`,
  );

  for (const change of response.changes) {
    const tableName = change.entity + 's';
    const table = db.table(tableName);
    if (change.action === 'DELETE') {
      await table.delete(change.entityId);
    } else {
      await table.put({ ...change.data, id: change.entityId });
    }
  }

  await db.syncMeta.put({ key: 'lastSync', value: response.syncedAt });
}
