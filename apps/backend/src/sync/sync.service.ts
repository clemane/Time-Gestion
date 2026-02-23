import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SyncOperation {
  id: string;
  entity: 'folder' | 'category' | 'note' | 'calendar' | 'calendarEvent';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  entityId?: string;
}

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async pushChanges(userId: string, operations: SyncOperation[]) {
    const results = [];
    for (const op of operations) {
      try {
        const result = await this.applyOperation(userId, op);
        results.push({ operationId: op.id, success: true, serverEntity: result });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ operationId: op.id, success: false, error: message });
      }
    }
    return { results };
  }

  private async applyOperation(userId: string, op: SyncOperation) {
    const model = this.getModel(op.entity);

    switch (op.action) {
      case 'CREATE':
        return (model as any).create({
          data: { ...op.data, userId },
        });

      case 'UPDATE':
        if (!op.entityId) throw new BadRequestException('entityId required for UPDATE');
        // Verify ownership
        const existing = await (model as any).findFirst({
          where: { id: op.entityId, userId },
        });
        if (!existing) throw new BadRequestException('Entity not found or not owned by user');
        return (model as any).update({
          where: { id: op.entityId },
          data: op.data,
        });

      case 'DELETE':
        if (!op.entityId) throw new BadRequestException('entityId required for DELETE');
        const toDelete = await (model as any).findFirst({
          where: { id: op.entityId, userId },
        });
        if (!toDelete) throw new BadRequestException('Entity not found or not owned by user');
        return (model as any).update({
          where: { id: op.entityId },
          data: { deletedAt: new Date() },
        });

      default:
        throw new BadRequestException(`Unknown action: ${op.action}`);
    }
  }

  private getModel(entity: string) {
    switch (entity) {
      case 'folder':
        return this.prisma.folder;
      case 'category':
        return this.prisma.category;
      case 'note':
        return this.prisma.note;
      case 'calendar':
        return this.prisma.calendar;
      case 'calendarEvent':
        return this.prisma.calendarEvent;
      default:
        throw new BadRequestException(`Unknown entity: ${entity}`);
    }
  }

  async pullChanges(userId: string, since: string) {
    const sinceDate = new Date(since);

    const [folders, categories, notes, calendars, events, shares] =
      await Promise.all([
        this.prisma.folder.findMany({
          where: { userId, updatedAt: { gt: sinceDate } },
        }),
        this.prisma.category.findMany({
          where: { userId, updatedAt: { gt: sinceDate } },
        }),
        this.prisma.note.findMany({
          where: { userId, updatedAt: { gt: sinceDate } },
        }),
        this.prisma.calendar.findMany({
          where: { userId, updatedAt: { gt: sinceDate } },
        }),
        this.prisma.calendarEvent.findMany({
          where: { userId, updatedAt: { gt: sinceDate } },
        }),
        this.prisma.share.findMany({
          where: {
            OR: [{ ownerId: userId }, { sharedWithId: userId }],
            createdAt: { gt: sinceDate },
          },
        }),
      ]);

    return {
      changes: [
        ...folders.map((f) => ({ entity: 'folder' as const, data: f })),
        ...categories.map((c) => ({ entity: 'category' as const, data: c })),
        ...notes.map((n) => ({ entity: 'note' as const, data: n })),
        ...calendars.map((c) => ({ entity: 'calendar' as const, data: c })),
        ...events.map((e) => ({ entity: 'calendarEvent' as const, data: e })),
        ...shares.map((s) => ({ entity: 'share' as const, data: s })),
      ],
      serverTime: new Date().toISOString(),
    };
  }
}
