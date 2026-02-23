import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CalendarsService', () => {
  let service: CalendarsService;

  const mockPrisma = {
    calendar: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CalendarsService>(CalendarsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all calendars for user', async () => {
      const calendars = [
        { id: '1', name: 'Work', color: '#FF0000', userId: 'user-1' },
        { id: '2', name: 'Personal', color: '#00FF00', userId: 'user-1' },
      ];
      mockPrisma.calendar.findMany.mockResolvedValue(calendars);

      const result = await service.findAll('user-1');

      expect(result).toEqual(calendars);
      expect(mockPrisma.calendar.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a new calendar', async () => {
      const dto = { name: 'Work', color: '#FF0000' };
      const created = { id: '1', ...dto, userId: 'user-1' };
      mockPrisma.calendar.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(created);
      expect(mockPrisma.calendar.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });
  });

  describe('update', () => {
    it('should update an existing calendar', async () => {
      const existing = { id: '1', name: 'Old', color: '#FF0000', userId: 'user-1' };
      const updated = { ...existing, name: 'Updated' };
      mockPrisma.calendar.findFirst.mockResolvedValue(existing);
      mockPrisma.calendar.update.mockResolvedValue(updated);

      const result = await service.update('user-1', '1', { name: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if calendar not found', async () => {
      mockPrisma.calendar.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'bad-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a calendar', async () => {
      const existing = { id: '1', name: 'Cal', color: '#FF0000', userId: 'user-1' };
      mockPrisma.calendar.findFirst.mockResolvedValue(existing);
      mockPrisma.calendar.update.mockResolvedValue({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await service.remove('user-1', '1');

      expect(result.deletedAt).toBeDefined();
      expect(mockPrisma.calendar.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
