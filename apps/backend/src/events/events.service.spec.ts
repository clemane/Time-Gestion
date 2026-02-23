import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrisma = {
    calendarEvent: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all events for user', async () => {
      const events = [
        { id: '1', title: 'Meeting', userId: 'user-1', calendarId: 'cal-1' },
      ];
      mockPrisma.calendarEvent.findMany.mockResolvedValue(events);

      const result = await service.findAll('user-1');

      expect(result).toEqual(events);
      expect(mockPrisma.calendarEvent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
        orderBy: { startAt: 'asc' },
      });
    });

    it('should filter by calendarId and date range', async () => {
      mockPrisma.calendarEvent.findMany.mockResolvedValue([]);

      await service.findAll('user-1', {
        calendarId: 'cal-1',
        from: '2026-01-01',
        to: '2026-01-31',
      });

      expect(mockPrisma.calendarEvent.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          deletedAt: null,
          calendarId: 'cal-1',
          startAt: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-01-31'),
          },
        },
        orderBy: { startAt: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const dto = {
        title: 'Meeting',
        calendarId: 'cal-1',
        startAt: '2026-01-15T10:00:00Z',
        endAt: '2026-01-15T11:00:00Z',
      };
      const created = { id: '1', ...dto, userId: 'user-1' };
      mockPrisma.calendarEvent.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(created);
      expect(mockPrisma.calendarEvent.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });
  });

  describe('update', () => {
    it('should update an existing event', async () => {
      const existing = { id: '1', title: 'Old', userId: 'user-1' };
      const updated = { ...existing, title: 'Updated' };
      mockPrisma.calendarEvent.findFirst.mockResolvedValue(existing);
      mockPrisma.calendarEvent.update.mockResolvedValue(updated);

      const result = await service.update('user-1', '1', { title: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrisma.calendarEvent.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'bad-id', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an event', async () => {
      const existing = { id: '1', title: 'Event', userId: 'user-1' };
      mockPrisma.calendarEvent.findFirst.mockResolvedValue(existing);
      mockPrisma.calendarEvent.update.mockResolvedValue({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await service.remove('user-1', '1');

      expect(result.deletedAt).toBeDefined();
      expect(mockPrisma.calendarEvent.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
