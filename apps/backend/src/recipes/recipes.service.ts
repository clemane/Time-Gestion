import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters?: { search?: string; tag?: string; favorite?: string },
  ) {
    const where: Prisma.RecipeWhereInput = { userId, deletedAt: null };

    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters?.tag) {
      where.tags = { has: filters.tag };
    }
    if (filters?.favorite === 'true') {
      where.isFavorite = true;
    }

    return this.prisma.recipe.findMany({
      where,
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.recipe.findFirst({
      where: { id, userId, deletedAt: null },
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Recipe not found');
    return item;
  }

  async create(userId: string, dto: CreateRecipeDto) {
    const { ingredients, ...recipeData } = dto;
    return this.prisma.recipe.create({
      data: {
        ...recipeData,
        userId,
        ingredients: ingredients
          ? { create: ingredients.map((ing, i) => ({ ...ing, sortOrder: ing.sortOrder ?? i })) }
          : undefined,
      } as Prisma.RecipeUncheckedCreateInput & { ingredients?: { create: unknown[] } },
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateRecipeDto) {
    await this.findOne(userId, id);
    const { ingredients, ...recipeData } = dto;

    if (ingredients) {
      await this.prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    }

    return this.prisma.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        ingredients: ingredients
          ? { create: ingredients.map((ing, i) => ({ ...ing, sortOrder: ing.sortOrder ?? i })) }
          : undefined,
      } as Prisma.RecipeUncheckedUpdateInput & { ingredients?: { create: unknown[] } },
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.recipe.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
