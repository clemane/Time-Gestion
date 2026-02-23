import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories for user', async () => {
      const categories = [
        { id: '1', name: 'Work', userId: 'user-1', style: { color: 'blue' } },
        { id: '2', name: 'Personal', userId: 'user-1', style: { color: 'green' } },
      ];
      mockPrisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll('user-1');

      expect(result).toEqual(categories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const dto = { name: 'Work', style: { color: 'blue' } };
      const created = { id: '1', ...dto, userId: 'user-1' };
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(created);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const existing = { id: '1', name: 'Old', userId: 'user-1', style: {} };
      const updated = { ...existing, name: 'Updated' };
      mockPrisma.category.findFirst.mockResolvedValue(existing);
      mockPrisma.category.update.mockResolvedValue(updated);

      const result = await service.update('user-1', '1', { name: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'bad-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a category', async () => {
      const existing = { id: '1', name: 'Cat', userId: 'user-1' };
      mockPrisma.category.findFirst.mockResolvedValue(existing);
      mockPrisma.category.update.mockResolvedValue({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await service.remove('user-1', '1');

      expect(result.deletedAt).toBeDefined();
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
