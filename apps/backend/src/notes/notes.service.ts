import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters?: {
      folderId?: string;
      categoryId?: string;
      search?: string;
      pinned?: string;
    },
  ) {
    const where: Prisma.NoteWhereInput = { userId, deletedAt: null };

    if (filters?.folderId) {
      where.folderId = filters.folderId;
    }
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.pinned === 'true') {
      where.isPinned = true;
    }
    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Note not found');
    return item;
  }

  async create(userId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: {
        ...dto,
        userId,
      } as Prisma.NoteUncheckedCreateInput,
    });
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.findOne(userId, id);
    return this.prisma.note.update({
      where: { id },
      data: dto as Prisma.NoteUncheckedUpdateInput,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
