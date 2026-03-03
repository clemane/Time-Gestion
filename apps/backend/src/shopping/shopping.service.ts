import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';

@Injectable()
export class ShoppingService {
  constructor(private prisma: PrismaService) {}

  async findByWeek(userId: string, weekStart: string) {
    return this.prisma.shoppingItem.findMany({
      where: { userId, weekStart: new Date(weekStart) },
      orderBy: [{ isChecked: 'asc' }, { name: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateShoppingItemDto) {
    return this.prisma.shoppingItem.create({
      data: { ...dto, userId } as Prisma.ShoppingItemUncheckedCreateInput,
    });
  }

  async update(userId: string, id: string, dto: UpdateShoppingItemDto) {
    const item = await this.prisma.shoppingItem.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Shopping item not found');
    return this.prisma.shoppingItem.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.shoppingItem.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Shopping item not found');
    return this.prisma.shoppingItem.delete({ where: { id } });
  }

  async generate(userId: string, weekStart: string) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    // Get all meal slots for the week with their recipe ingredients
    const slots = await this.prisma.mealSlot.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { gte: start, lt: end },
        recipeId: { not: null },
      },
      include: { recipe: { include: { ingredients: true } } },
    });

    // Aggregate ingredients, merging duplicates (same name + unit)
    const aggregated = new Map<string, { name: string; quantity: number; unit: string | null; sourceRecipeId: string }>();

    for (const slot of slots) {
      if (!slot.recipe) continue;
      for (const ing of slot.recipe.ingredients) {
        const key = `${ing.name.toLowerCase().trim()}|${(ing.unit || '').toLowerCase().trim()}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity += ing.quantity || 0;
        } else {
          aggregated.set(key, {
            name: ing.name,
            quantity: ing.quantity || 0,
            unit: ing.unit,
            sourceRecipeId: slot.recipe.id,
          });
        }
      }
    }

    // Delete old generated items for this week
    await this.prisma.shoppingItem.deleteMany({
      where: { userId, weekStart: start, sourceRecipeId: { not: null } },
    });

    // Create new items
    const items = Array.from(aggregated.values()).map(item => ({
      userId,
      name: item.name,
      quantity: item.quantity || null,
      unit: item.unit,
      isChecked: false,
      sourceRecipeId: item.sourceRecipeId,
      weekStart: start,
    }));

    if (items.length > 0) {
      await this.prisma.shoppingItem.createMany({ data: items });
    }

    return this.findByWeek(userId, weekStart);
  }
}
