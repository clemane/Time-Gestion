import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SyncOperation {
  id: string;
  entity:
    | 'folder'
    | 'category'
    | 'note'
    | 'calendar'
    | 'event'
    | 'share'
    | 'recipe'
    | 'recipeIngredient'
    | 'mealSlot'
    | 'shoppingItem';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  entityId?: string;
}

// Entities auto-shared between partners
const PARTNER_SHARED_ENTITIES = new Set([
  'recipe',
  'recipeIngredient',
  'mealSlot',
  'shoppingItem',
]);

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

      case 'UPDATE': {
        if (!op.entityId) throw new BadRequestException('entityId required for UPDATE');

        // For partner-shared entities, allow partner edits
        const ownerIds = await this.getOwnerIds(userId, op.entity);
        const existing = await (model as any).findFirst({
          where: { id: op.entityId, userId: { in: ownerIds } },
        });
        // If not found via ownership, check shared calendars for events
        if (!existing) {
          if (op.entity === 'event') {
            const calendarEntity = await this.findViaSharedCalendar(userId, op.entity, op.entityId);
            if (!calendarEntity) throw new BadRequestException('Entity not found or not owned by user');
          } else {
            throw new BadRequestException('Entity not found or not owned by user');
          }
        }

        return (model as any).update({
          where: { id: op.entityId },
          data: op.data,
        });
      }

      case 'DELETE': {
        if (!op.entityId) throw new BadRequestException('entityId required for DELETE');

        const deleteOwnerIds = await this.getOwnerIds(userId, op.entity);
        const toDelete = await (model as any).findFirst({
          where: { id: op.entityId, userId: { in: deleteOwnerIds } },
        });
        if (!toDelete) throw new BadRequestException('Entity not found or not owned by user');
        return (model as any).update({
          where: { id: op.entityId },
          data: { deletedAt: new Date() },
        });
      }

      default:
        throw new BadRequestException(`Unknown action: ${op.action}`);
    }
  }

  private async getOwnerIds(userId: string, entity: string): Promise<string[]> {
    if (!PARTNER_SHARED_ENTITIES.has(entity)) return [userId];

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user?.partnerId ? [userId, user.partnerId] : [userId];
  }

  private async findViaSharedCalendar(userId: string, entity: string, entityId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.partnerId) return null;

    const sharedCalendarIds = await this.getSharedCalendarIds(userId, user.partnerId);
    if (sharedCalendarIds.length === 0) return null;

    if (entity === 'event') {
      return this.prisma.calendarEvent.findFirst({
        where: { id: entityId, calendarId: { in: sharedCalendarIds } },
      });
    }
    // Notes don't have calendarId in the Prisma schema
    return null;
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
      case 'event':
        return this.prisma.calendarEvent;
      case 'share':
        return this.prisma.share;
      case 'recipe':
        return this.prisma.recipe;
      case 'recipeIngredient':
        return this.prisma.recipeIngredient;
      case 'mealSlot':
        return this.prisma.mealSlot;
      case 'shoppingItem':
        return this.prisma.shoppingItem;
      default:
        throw new BadRequestException(`Unknown entity: ${entity}`);
    }
  }

  async pullChanges(userId: string, since: string) {
    const sinceDate = new Date(since);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const partnerId = user?.partnerId;

    // User IDs for auto-shared resources (recipes, meal plan, shopping)
    const autoShareUserIds = partnerId ? [userId, partnerId] : [userId];

    // Shared calendar IDs between partners
    const sharedCalendarIds = partnerId
      ? await this.getSharedCalendarIds(userId, partnerId)
      : [];

    const [
      folders,
      categories,
      notes,
      calendars,
      events,
      shares,
      recipes,
      recipeIngredients,
      mealSlots,
      shoppingItems,
    ] = await Promise.all([
      // Personal only
      this.prisma.folder.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.category.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      // Notes: personal only (notes don't have calendarId in DB)
      this.prisma.note.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
      }),
      // Calendars: personal + shared
      this.prisma.calendar.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          OR: [
            { userId },
            ...(sharedCalendarIds.length > 0
              ? [{ id: { in: sharedCalendarIds } }]
              : []),
          ],
        },
      }),
      // Events: personal + from shared calendars
      this.prisma.calendarEvent.findMany({
        where: {
          updatedAt: { gt: sinceDate },
          OR: [
            { userId },
            ...(sharedCalendarIds.length > 0
              ? [{ calendarId: { in: sharedCalendarIds } }]
              : []),
          ],
        },
      }),
      // Shares: owned or received
      this.prisma.share.findMany({
        where: {
          OR: [{ ownerId: userId }, { sharedWithId: userId }],
          createdAt: { gt: sinceDate },
        },
      }),
      // Auto-shared with partner
      this.prisma.recipe.findMany({
        where: { userId: { in: autoShareUserIds }, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.recipeIngredient.findMany({
        where: { recipe: { userId: { in: autoShareUserIds }, updatedAt: { gt: sinceDate } } },
      }),
      this.prisma.mealSlot.findMany({
        where: { userId: { in: autoShareUserIds }, updatedAt: { gt: sinceDate } },
      }),
      this.prisma.shoppingItem.findMany({
        where: { userId: { in: autoShareUserIds }, createdAt: { gt: sinceDate } },
      }),
    ]);

    const toChange = (entity: string, records: any[]) =>
      records.map((r) => ({
        entity,
        entityId: r.id,
        action: r.deletedAt ? ('DELETE' as const) : ('UPDATE' as const),
        data: r,
        updatedAt: (r.updatedAt ?? r.createdAt ?? new Date()).toISOString(),
      }));

    return {
      changes: [
        ...toChange('folder', folders),
        ...toChange('category', categories),
        ...toChange('note', notes),
        ...toChange('calendar', calendars),
        ...toChange('event', events),
        ...toChange('share', shares),
        ...toChange('recipe', recipes),
        ...toChange('recipeIngredient', recipeIngredients),
        ...toChange('mealSlot', mealSlots),
        ...toChange('shoppingItem', shoppingItems),
      ],
      syncedAt: new Date().toISOString(),
    };
  }

  private async getSharedCalendarIds(
    userId: string,
    partnerId: string,
  ): Promise<string[]> {
    const shares = await this.prisma.share.findMany({
      where: {
        resourceType: 'CALENDAR',
        OR: [
          { ownerId: userId, sharedWithId: partnerId },
          { ownerId: partnerId, sharedWithId: userId },
        ],
      },
    });
    return shares.map((s) => s.resourceId);
  }
}
