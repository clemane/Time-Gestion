import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealSlotDto } from './dto/create-meal-slot.dto';
import { UpdateMealSlotDto } from './dto/update-meal-slot.dto';

@Injectable()
export class MealPlansService {
  constructor(private prisma: PrismaService) {}

  async findByWeek(userId: string, weekStart: string) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.prisma.mealSlot.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { gte: start, lt: end },
      },
      include: { recipe: { include: { ingredients: true } } },
      orderBy: [{ date: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.mealSlot.findFirst({
      where: { id, userId, deletedAt: null },
      include: { recipe: true },
    });
    if (!item) throw new NotFoundException('Meal slot not found');
    return item;
  }

  async create(userId: string, dto: CreateMealSlotDto) {
    return this.prisma.mealSlot.create({
      data: { ...dto, userId } as Prisma.MealSlotUncheckedCreateInput,
      include: { recipe: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateMealSlotDto) {
    await this.findOne(userId, id);
    return this.prisma.mealSlot.update({
      where: { id },
      data: dto as Prisma.MealSlotUncheckedUpdateInput,
      include: { recipe: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.mealSlot.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
