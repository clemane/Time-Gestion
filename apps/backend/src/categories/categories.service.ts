import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.category.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Category not found');
    return item;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...dto,
        userId,
      } as Prisma.CategoryUncheckedCreateInput,
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(userId, id);
    return this.prisma.category.update({
      where: { id },
      data: dto as Prisma.CategoryUncheckedUpdateInput,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
