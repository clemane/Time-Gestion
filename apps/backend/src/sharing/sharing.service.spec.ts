import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SharingService', () => {
  let service: SharingService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    share: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a share when target user exists', async () => {
      const targetUser = { id: 'user-2', email: 'other@test.com' };
      const dto = {
        resourceType: 'note',
        resourceId: 'note-1',
        sharedWithEmail: 'other@test.com',
        permission: 'read',
      };
      const share = {
        id: 'share-1',
        resourceType: 'note',
        resourceId: 'note-1',
        ownerId: 'user-1',
        sharedWithId: 'user-2',
        permission: 'read',
      };

      mockPrisma.user.findUnique.mockResolvedValue(targetUser);
      mockPrisma.share.create.mockResolvedValue(share);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(share);
      expect(mockPrisma.share.create).toHaveBeenCalledWith({
        data: {
          resourceType: 'note',
          resourceId: 'note-1',
          ownerId: 'user-1',
          sharedWithId: 'user-2',
          permission: 'read',
        },
      });
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          resourceType: 'note',
          resourceId: 'note-1',
          sharedWithEmail: 'unknown@test.com',
          permission: 'read',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSharedWithMe', () => {
    it('should return shares for current user', async () => {
      const shares = [
        {
          id: 'share-1',
          resourceType: 'note',
          resourceId: 'note-1',
          sharedWithId: 'user-1',
          owner: { id: 'user-2', email: 'other@test.com', displayName: 'Other' },
        },
      ];
      mockPrisma.share.findMany.mockResolvedValue(shares);

      const result = await service.findSharedWithMe('user-1');

      expect(result).toEqual(shares);
      expect(mockPrisma.share.findMany).toHaveBeenCalledWith({
        where: { sharedWithId: 'user-1' },
        include: {
          owner: { select: { id: true, email: true, displayName: true } },
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a share if user is owner', async () => {
      const share = { id: 'share-1', ownerId: 'user-1' };
      mockPrisma.share.findUnique.mockResolvedValue(share);
      mockPrisma.share.delete.mockResolvedValue(share);

      const result = await service.remove('user-1', 'share-1');

      expect(result).toEqual(share);
      expect(mockPrisma.share.delete).toHaveBeenCalledWith({
        where: { id: 'share-1' },
      });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const share = { id: 'share-1', ownerId: 'user-2' };
      mockPrisma.share.findUnique.mockResolvedValue(share);

      await expect(service.remove('user-1', 'share-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if share not found', async () => {
      mockPrisma.share.findUnique.mockResolvedValue(null);

      await expect(service.remove('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
