import { Test, TestingModule } from '@nestjs/testing';
import { SyncService, SyncOperation } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SyncService', () => {
  let service: SyncService;

  const mockFolder = {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };

  const mockCategory = {
    findMany: jest.fn(),
  };

  const mockNote = {
    findMany: jest.fn(),
  };

  const mockCalendar = {
    findMany: jest.fn(),
  };

  const mockCalendarEvent = {
    findMany: jest.fn(),
  };

  const mockShare = {
    findMany: jest.fn(),
  };

  const mockPrisma = {
    folder: mockFolder,
    category: mockCategory,
    note: mockNote,
    calendar: mockCalendar,
    calendarEvent: mockCalendarEvent,
    share: mockShare,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    jest.clearAllMocks();
  });

  describe('pushChanges', () => {
    it('should apply CREATE operations', async () => {
      const op: SyncOperation = {
        id: 'op-1',
        entity: 'folder',
        action: 'CREATE',
        data: { name: 'New Folder' },
      };
      const created = { id: 'folder-1', name: 'New Folder', userId: 'user-1' };
      mockFolder.create.mockResolvedValue(created);

      const result = await service.pushChanges('user-1', [op]);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        operationId: 'op-1',
        success: true,
        serverEntity: created,
      });
    });

    it('should apply UPDATE operations', async () => {
      const op: SyncOperation = {
        id: 'op-2',
        entity: 'folder',
        action: 'UPDATE',
        data: { name: 'Updated' },
        entityId: 'folder-1',
      };
      const existing = { id: 'folder-1', userId: 'user-1' };
      const updated = { ...existing, name: 'Updated' };
      mockFolder.findFirst.mockResolvedValue(existing);
      mockFolder.update.mockResolvedValue(updated);

      const result = await service.pushChanges('user-1', [op]);

      expect(result.results[0].success).toBe(true);
      expect(result.results[0].serverEntity).toEqual(updated);
    });

    it('should handle errors gracefully', async () => {
      const op: SyncOperation = {
        id: 'op-3',
        entity: 'folder',
        action: 'UPDATE',
        data: { name: 'Updated' },
        entityId: 'bad-id',
      };
      mockFolder.findFirst.mockResolvedValue(null);

      const result = await service.pushChanges('user-1', [op]);

      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBeDefined();
    });
  });

  describe('pullChanges', () => {
    it('should return all changes since timestamp', async () => {
      const folder = { id: 'f-1', name: 'Folder', userId: 'user-1' };
      const note = { id: 'n-1', title: 'Note', userId: 'user-1' };

      mockFolder.findMany.mockResolvedValue([folder]);
      mockCategory.findMany.mockResolvedValue([]);
      mockNote.findMany.mockResolvedValue([note]);
      mockCalendar.findMany.mockResolvedValue([]);
      mockCalendarEvent.findMany.mockResolvedValue([]);
      mockShare.findMany.mockResolvedValue([]);

      const result = await service.pullChanges(
        'user-1',
        '2026-01-01T00:00:00Z',
      );

      expect(result.changes).toHaveLength(2);
      expect(result.changes[0]).toEqual({ entity: 'folder', data: folder });
      expect(result.changes[1]).toEqual({ entity: 'note', data: note });
      expect(result.serverTime).toBeDefined();
    });
  });
});
