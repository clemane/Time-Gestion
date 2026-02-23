import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FoldersService', () => {
  let service: FoldersService;

  const mockPrisma = {
    folder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoldersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FoldersService>(FoldersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all folders for user', async () => {
      const folders = [
        { id: '1', name: 'Folder 1', userId: 'user-1', sortOrder: 0 },
        { id: '2', name: 'Folder 2', userId: 'user-1', sortOrder: 1 },
      ];
      mockPrisma.folder.findMany.mockResolvedValue(folders);

      const result = await service.findAll('user-1');

      expect(result).toEqual(folders);
      expect(mockPrisma.folder.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a new folder', async () => {
      const dto = { name: 'New Folder' };
      const created = { id: '1', ...dto, userId: 'user-1', sortOrder: 0 };
      mockPrisma.folder.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(created);
      expect(mockPrisma.folder.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });
  });

  describe('update', () => {
    it('should update an existing folder', async () => {
      const existing = { id: '1', name: 'Old', userId: 'user-1' };
      const updated = { ...existing, name: 'Updated' };
      mockPrisma.folder.findFirst.mockResolvedValue(existing);
      mockPrisma.folder.update.mockResolvedValue(updated);

      const result = await service.update('user-1', '1', { name: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if folder not found', async () => {
      mockPrisma.folder.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'bad-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a folder', async () => {
      const existing = { id: '1', name: 'Folder', userId: 'user-1' };
      mockPrisma.folder.findFirst.mockResolvedValue(existing);
      mockPrisma.folder.update.mockResolvedValue({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await service.remove('user-1', '1');

      expect(result.deletedAt).toBeDefined();
      expect(mockPrisma.folder.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
