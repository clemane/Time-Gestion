import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotesService', () => {
  let service: NotesService;

  const mockPrisma = {
    note: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all notes for user', async () => {
      const notes = [
        { id: '1', title: 'Note 1', userId: 'user-1' },
        { id: '2', title: 'Note 2', userId: 'user-1' },
      ];
      mockPrisma.note.findMany.mockResolvedValue(notes);

      const result = await service.findAll('user-1');

      expect(result).toEqual(notes);
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should filter by folderId, categoryId, pinned, and search', async () => {
      mockPrisma.note.findMany.mockResolvedValue([]);

      await service.findAll('user-1', {
        folderId: 'folder-1',
        categoryId: 'cat-1',
        pinned: 'true',
        search: 'hello',
      });

      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          deletedAt: null,
          folderId: 'folder-1',
          categoryId: 'cat-1',
          isPinned: true,
          title: { contains: 'hello', mode: 'insensitive' },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create a new note', async () => {
      const dto = { title: 'New Note' };
      const created = { id: '1', ...dto, userId: 'user-1', content: {} };
      mockPrisma.note.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(created);
      expect(mockPrisma.note.create).toHaveBeenCalledWith({
        data: { ...dto, userId: 'user-1' },
      });
    });
  });

  describe('update', () => {
    it('should update an existing note', async () => {
      const existing = { id: '1', title: 'Old', userId: 'user-1' };
      const updated = { ...existing, title: 'Updated' };
      mockPrisma.note.findFirst.mockResolvedValue(existing);
      mockPrisma.note.update.mockResolvedValue(updated);

      const result = await service.update('user-1', '1', { title: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if note not found', async () => {
      mockPrisma.note.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'bad-id', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a note', async () => {
      const existing = { id: '1', title: 'Note', userId: 'user-1' };
      mockPrisma.note.findFirst.mockResolvedValue(existing);
      mockPrisma.note.update.mockResolvedValue({
        ...existing,
        deletedAt: new Date(),
      });

      const result = await service.remove('user-1', '1');

      expect(result.deletedAt).toBeDefined();
    });
  });
});
