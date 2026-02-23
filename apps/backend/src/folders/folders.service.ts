import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.folder.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Folder not found');
    return item;
  }

  async create(userId: string, dto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: { ...dto, userId },
    });
  }

  async update(userId: string, id: string, dto: UpdateFolderDto) {
    await this.findOne(userId, id);
    return this.prisma.folder.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.folder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
