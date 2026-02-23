import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto } from './dto/create-share.dto';

@Injectable()
export class SharingService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateShareDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.sharedWithEmail },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found with that email');
    }

    return this.prisma.share.create({
      data: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        ownerId,
        sharedWithId: targetUser.id,
        permission: dto.permission,
      },
    });
  }

  async findSharedWithMe(userId: string) {
    return this.prisma.share.findMany({
      where: { sharedWithId: userId },
      include: { owner: { select: { id: true, email: true, displayName: true } } },
    });
  }

  async remove(userId: string, id: string) {
    const share = await this.prisma.share.findUnique({ where: { id } });
    if (!share) throw new NotFoundException('Share not found');
    if (share.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can remove a share');
    }
    return this.prisma.share.delete({ where: { id } });
  }
}
