# Meal Planning Module — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full meal planning module with recipe library, weekly meal planning with flexible slots, and auto-generated shopping lists.

**Architecture:** Hybrid approach — dedicated Prisma/Dexie entities for structured data (recipes, ingredients, meal slots, shopping items) with TipTap JSON for recipe instructions. Follows existing offline-first sync patterns with Pinia stores + Dexie.js + sync queue.

**Tech Stack:** Vue 3, Pinia, Dexie.js, TipTap, NestJS, Prisma, PostgreSQL, TypeScript

**Design doc:** `docs/plans/2026-03-02-meal-planning-design.md`

---

## Task 1: Shared Types

**Files:**
- Create: `packages/shared/src/types/recipe.ts`
- Create: `packages/shared/src/types/meal-plan.ts`
- Create: `packages/shared/src/types/shopping.ts`
- Modify: `packages/shared/src/types/sync.ts:2`
- Modify: `packages/shared/src/index.ts:8`

**Step 1: Create recipe types**

Create `packages/shared/src/types/recipe.ts`:

```typescript
export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  instructions: Record<string, unknown>;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  imageUrl: string | null;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  sortOrder: number;
}

export interface CreateRecipeDto {
  title: string;
  description?: string;
  instructions?: Record<string, unknown>;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  tags?: string[];
  isFavorite?: boolean;
  ingredients?: Omit<RecipeIngredient, 'id' | 'recipeId'>[];
}

export interface UpdateRecipeDto {
  title?: string;
  description?: string | null;
  instructions?: Record<string, unknown>;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  imageUrl?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  ingredients?: Omit<RecipeIngredient, 'id' | 'recipeId'>[];
}
```

**Step 2: Create meal-plan types**

Create `packages/shared/src/types/meal-plan.ts`:

```typescript
export interface MealSlot {
  id: string;
  userId: string;
  recipeId: string | null;
  date: string;
  slotName: string;
  customTitle: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateMealSlotDto {
  recipeId?: string;
  date: string;
  slotName: string;
  customTitle?: string;
  sortOrder?: number;
}

export interface UpdateMealSlotDto {
  recipeId?: string | null;
  date?: string;
  slotName?: string;
  customTitle?: string | null;
  sortOrder?: number;
}
```

**Step 3: Create shopping types**

Create `packages/shared/src/types/shopping.ts`:

```typescript
export interface ShoppingItem {
  id: string;
  userId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  isChecked: boolean;
  sourceRecipeId: string | null;
  weekStart: string;
  createdAt: string;
}

export interface CreateShoppingItemDto {
  name: string;
  quantity?: number;
  unit?: string;
  weekStart: string;
}

export interface GenerateShoppingDto {
  weekStart: string;
}
```

**Step 4: Update SyncEntity type**

Modify `packages/shared/src/types/sync.ts:2` — change line 2 from:

```typescript
export type SyncEntity = 'note' | 'folder' | 'category' | 'calendar' | 'event' | 'share';
```

to:

```typescript
export type SyncEntity = 'note' | 'folder' | 'category' | 'calendar' | 'event' | 'share' | 'recipe' | 'recipeIngredient' | 'mealSlot' | 'shoppingItem';
```

**Step 5: Update shared index exports**

Add to end of `packages/shared/src/index.ts`:

```typescript
export * from './types/recipe';
export * from './types/meal-plan';
export * from './types/shopping';
```

**Step 6: Commit**

```bash
git add packages/shared/src/types/recipe.ts packages/shared/src/types/meal-plan.ts packages/shared/src/types/shopping.ts packages/shared/src/types/sync.ts packages/shared/src/index.ts
git commit -m "feat(shared): add recipe, meal-plan, and shopping types"
```

---

## Task 2: Prisma Schema + Migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma:10-27` (add User relations)
- Modify: `apps/backend/prisma/schema.prisma` (append new models at end)

**Step 1: Add new models to Prisma schema**

Append after the `Share` model (after line 137) in `apps/backend/prisma/schema.prisma`:

```prisma
model Recipe {
  id           String    @id @default(uuid()) @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  title        String
  description  String?
  instructions Json      @default("{}")
  prepTime     Int?      @map("prep_time")
  cookTime     Int?      @map("cook_time")
  servings     Int?
  imageUrl     String?   @map("image_url")
  tags         String[]  @default([])
  isFavorite   Boolean   @default(false) @map("is_favorite")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  ingredients RecipeIngredient[]
  mealSlots   MealSlot[]
  shoppingItems ShoppingItem[]

  @@map("recipes")
}

model RecipeIngredient {
  id        String  @id @default(uuid()) @db.Uuid
  recipeId  String  @map("recipe_id") @db.Uuid
  name      String
  quantity  Float?
  unit      String?
  sortOrder Int     @default(0) @map("sort_order")

  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@map("recipe_ingredients")
}

model MealSlot {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  recipeId    String?   @map("recipe_id") @db.Uuid
  date        DateTime  @db.Date
  slotName    String    @map("slot_name")
  customTitle String?   @map("custom_title")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe? @relation(fields: [recipeId], references: [id])

  @@map("meal_slots")
}

model ShoppingItem {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  name           String
  quantity       Float?
  unit           String?
  isChecked      Boolean  @default(false) @map("is_checked")
  sourceRecipeId String?  @map("source_recipe_id") @db.Uuid
  weekStart      DateTime @map("week_start") @db.Date
  createdAt      DateTime @default(now()) @map("created_at")

  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceRecipe Recipe? @relation(fields: [sourceRecipeId], references: [id])

  @@map("shopping_items")
}
```

**Step 2: Add User relations**

Add to the `User` model (around lines 18-24), after `receivedShares`:

```prisma
  recipes       Recipe[]
  mealSlots     MealSlot[]
  shoppingItems ShoppingItem[]
```

**Step 3: Generate migration**

Run: `cd apps/backend && npx prisma migrate dev --name add-meal-planning-models`

Expected: Migration created successfully, Prisma client regenerated.

**Step 4: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "feat(backend): add Prisma models for recipes, meal slots, shopping items"
```

---

## Task 3: Backend — Recipes Module

**Files:**
- Create: `apps/backend/src/recipes/dto/create-recipe.dto.ts`
- Create: `apps/backend/src/recipes/dto/update-recipe.dto.ts`
- Create: `apps/backend/src/recipes/recipes.service.ts`
- Create: `apps/backend/src/recipes/recipes.controller.ts`
- Create: `apps/backend/src/recipes/recipes.module.ts`
- Modify: `apps/backend/src/app.module.ts:13-28`

**Step 1: Create DTOs**

Create `apps/backend/src/recipes/dto/create-recipe.dto.ts`:

```typescript
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

export class IngredientDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateRecipeDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  instructions?: Prisma.InputJsonValue;

  @IsOptional()
  @IsInt()
  prepTime?: number;

  @IsOptional()
  @IsInt()
  cookTime?: number;

  @IsOptional()
  @IsInt()
  servings?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients?: IngredientDto[];
}
```

Create `apps/backend/src/recipes/dto/update-recipe.dto.ts`:

```typescript
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { IngredientDto } from './create-recipe.dto';

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  instructions?: Prisma.InputJsonValue;

  @IsOptional()
  @IsInt()
  prepTime?: number;

  @IsOptional()
  @IsInt()
  cookTime?: number;

  @IsOptional()
  @IsInt()
  servings?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients?: IngredientDto[];
}
```

**Step 2: Create service**

Create `apps/backend/src/recipes/recipes.service.ts`:

```typescript
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
```

**Step 3: Create controller**

Create `apps/backend/src/recipes/recipes.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private service: RecipesService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('favorite') favorite?: string,
  ) {
    return this.service.findAll(userId, { search, tag, favorite });
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRecipeDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
```

**Step 4: Create module**

Create `apps/backend/src/recipes/recipes.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
```

**Step 5: Register in AppModule**

In `apps/backend/src/app.module.ts`, add import and register:

```typescript
import { RecipesModule } from './recipes/recipes.module';
```

Add `RecipesModule` to the imports array (after `SyncModule`).

**Step 6: Commit**

```bash
git add apps/backend/src/recipes/
git commit -m "feat(backend): add recipes module with CRUD + ingredients"
```

---

## Task 4: Backend — Meal Plans Module

**Files:**
- Create: `apps/backend/src/meal-plans/dto/create-meal-slot.dto.ts`
- Create: `apps/backend/src/meal-plans/dto/update-meal-slot.dto.ts`
- Create: `apps/backend/src/meal-plans/meal-plans.service.ts`
- Create: `apps/backend/src/meal-plans/meal-plans.controller.ts`
- Create: `apps/backend/src/meal-plans/meal-plans.module.ts`
- Modify: `apps/backend/src/app.module.ts`

**Step 1: Create DTOs**

Create `apps/backend/src/meal-plans/dto/create-meal-slot.dto.ts`:

```typescript
import { IsString, IsOptional, IsUUID, IsDateString, IsInt } from 'class-validator';

export class CreateMealSlotDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @IsDateString()
  date!: string;

  @IsString()
  slotName!: string;

  @IsOptional()
  @IsString()
  customTitle?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
```

Create `apps/backend/src/meal-plans/dto/update-meal-slot.dto.ts`:

```typescript
import { IsString, IsOptional, IsUUID, IsDateString, IsInt } from 'class-validator';

export class UpdateMealSlotDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  slotName?: string;

  @IsOptional()
  @IsString()
  customTitle?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
```

**Step 2: Create service**

Create `apps/backend/src/meal-plans/meal-plans.service.ts`:

```typescript
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
```

**Step 3: Create controller**

Create `apps/backend/src/meal-plans/meal-plans.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MealPlansService } from './meal-plans.service';
import { CreateMealSlotDto } from './dto/create-meal-slot.dto';
import { UpdateMealSlotDto } from './dto/update-meal-slot.dto';

@Controller('meal-slots')
@UseGuards(JwtAuthGuard)
export class MealPlansController {
  constructor(private service: MealPlansService) {}

  @Get()
  findByWeek(
    @CurrentUser('id') userId: string,
    @Query('week') week: string,
  ) {
    return this.service.findByWeek(userId, week);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateMealSlotDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMealSlotDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
```

**Step 4: Create module and register**

Create `apps/backend/src/meal-plans/meal-plans.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MealPlansController } from './meal-plans.controller';
import { MealPlansService } from './meal-plans.service';

@Module({
  controllers: [MealPlansController],
  providers: [MealPlansService],
  exports: [MealPlansService],
})
export class MealPlansModule {}
```

Register `MealPlansModule` in `apps/backend/src/app.module.ts`.

**Step 5: Commit**

```bash
git add apps/backend/src/meal-plans/
git commit -m "feat(backend): add meal plans module with CRUD"
```

---

## Task 5: Backend — Shopping Module

**Files:**
- Create: `apps/backend/src/shopping/dto/create-shopping-item.dto.ts`
- Create: `apps/backend/src/shopping/dto/update-shopping-item.dto.ts`
- Create: `apps/backend/src/shopping/dto/generate-shopping.dto.ts`
- Create: `apps/backend/src/shopping/shopping.service.ts`
- Create: `apps/backend/src/shopping/shopping.controller.ts`
- Create: `apps/backend/src/shopping/shopping.module.ts`
- Modify: `apps/backend/src/app.module.ts`

**Step 1: Create DTOs**

Create `apps/backend/src/shopping/dto/create-shopping-item.dto.ts`:

```typescript
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateShoppingItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsDateString()
  weekStart!: string;
}
```

Create `apps/backend/src/shopping/dto/update-shopping-item.dto.ts`:

```typescript
import { IsOptional, IsBoolean, IsString, IsNumber } from 'class-validator';

export class UpdateShoppingItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isChecked?: boolean;
}
```

Create `apps/backend/src/shopping/dto/generate-shopping.dto.ts`:

```typescript
import { IsDateString } from 'class-validator';

export class GenerateShoppingDto {
  @IsDateString()
  weekStart!: string;
}
```

**Step 2: Create service**

Create `apps/backend/src/shopping/shopping.service.ts`:

```typescript
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
```

**Step 3: Create controller**

Create `apps/backend/src/shopping/shopping.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShoppingService } from './shopping.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { GenerateShoppingDto } from './dto/generate-shopping.dto';

@Controller('shopping')
@UseGuards(JwtAuthGuard)
export class ShoppingController {
  constructor(private service: ShoppingService) {}

  @Get('items')
  findByWeek(
    @CurrentUser('id') userId: string,
    @Query('week') week: string,
  ) {
    return this.service.findByWeek(userId, week);
  }

  @Post('items')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShoppingItemDto) {
    return this.service.create(userId, dto);
  }

  @Patch('items/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShoppingItemDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete('items/:id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }

  @Post('generate')
  generate(@CurrentUser('id') userId: string, @Body() dto: GenerateShoppingDto) {
    return this.service.generate(userId, dto.weekStart);
  }
}
```

**Step 4: Create module and register**

Create `apps/backend/src/shopping/shopping.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ShoppingController } from './shopping.controller';
import { ShoppingService } from './shopping.service';

@Module({
  controllers: [ShoppingController],
  providers: [ShoppingService],
  exports: [ShoppingService],
})
export class ShoppingModule {}
```

Register `ShoppingModule` in `apps/backend/src/app.module.ts`.

**Step 5: Commit**

```bash
git add apps/backend/src/shopping/ apps/backend/src/app.module.ts
git commit -m "feat(backend): add shopping module with auto-generation from meal plan"
```

---

## Task 6: Frontend — Dexie Schema + Sync Engine Update

**Files:**
- Modify: `apps/frontend/src/db/schema.ts`
- Modify: `apps/frontend/src/sync/engine.ts:11`

**Step 1: Update Dexie schema**

In `apps/frontend/src/db/schema.ts`:

Add imports for new types:

```typescript
import type { Note, Folder, Category, Calendar, CalendarEvent, Share, Recipe, RecipeIngredient, MealSlot, ShoppingItem } from '@time-gestion/shared';
```

Add table declarations in the class (after line 26):

```typescript
  recipes!: Table<Recipe>;
  recipeIngredients!: Table<RecipeIngredient>;
  mealSlots!: Table<MealSlot>;
  shoppingItems!: Table<ShoppingItem>;
```

Add version 3 migration after the version(2) block (after line 44):

```typescript
    this.version(3).stores({
      recipes: 'id, userId, isFavorite, updatedAt',
      recipeIngredients: 'id, recipeId',
      mealSlots: 'id, userId, date, recipeId, updatedAt',
      shoppingItems: 'id, userId, weekStart, isChecked',
    });
```

**Step 2: Update sync engine entity mapping**

In `apps/frontend/src/sync/engine.ts:11`, update the entity type cast to include new entities:

Change line 11 from:

```typescript
    entity: op.entity as 'note' | 'folder' | 'category' | 'calendar' | 'event' | 'share',
```

to:

```typescript
    entity: op.entity as 'note' | 'folder' | 'category' | 'calendar' | 'event' | 'share' | 'recipe' | 'recipeIngredient' | 'mealSlot' | 'shoppingItem',
```

**Step 3: Commit**

```bash
git add apps/frontend/src/db/schema.ts apps/frontend/src/sync/engine.ts
git commit -m "feat(frontend): add Dexie tables and sync support for meal planning"
```

---

## Task 7: Frontend — Pinia Stores

**Files:**
- Create: `apps/frontend/src/stores/recipes.ts`
- Create: `apps/frontend/src/stores/mealPlan.ts`
- Create: `apps/frontend/src/stores/shopping.ts`

**Step 1: Create recipes store**

Create `apps/frontend/src/stores/recipes.ts`:

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { Recipe, RecipeIngredient, CreateRecipeDto, UpdateRecipeDto } from '@time-gestion/shared';

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<(Recipe & { ingredients: RecipeIngredient[] })[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    const allRecipes = await db.recipes.filter(r => !r.deletedAt).toArray();
    const allIngredients = await db.recipeIngredients.toArray();
    recipes.value = allRecipes.map(r => ({
      ...r,
      ingredients: allIngredients
        .filter(i => i.recipeId === r.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  async function create(dto: CreateRecipeDto): Promise<Recipe> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const recipe: Recipe = {
      id,
      userId: '',
      title: dto.title,
      description: dto.description || null,
      instructions: dto.instructions || {},
      prepTime: dto.prepTime ?? null,
      cookTime: dto.cookTime ?? null,
      servings: dto.servings ?? null,
      imageUrl: dto.imageUrl || null,
      tags: dto.tags || [],
      isFavorite: dto.isFavorite || false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const ingredients: RecipeIngredient[] = (dto.ingredients || []).map((ing, i) => ({
      id: crypto.randomUUID(),
      recipeId: id,
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit || null,
      sortOrder: ing.sortOrder ?? i,
    }));

    await db.recipes.put(recipe);
    if (ingredients.length > 0) {
      await db.recipeIngredients.bulkPut(ingredients);
    }

    await db.syncQueue.add({
      entity: 'recipe',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    recipes.value = [{ ...recipe, ingredients }, ...recipes.value];
    return recipe;
  }

  async function update(id: string, dto: UpdateRecipeDto) {
    const now = new Date().toISOString();
    const { ingredients: newIngredients, ...recipeData } = dto;

    await db.recipes.update(id, { ...recipeData, updatedAt: now } as Partial<Recipe>);

    if (newIngredients) {
      await db.recipeIngredients.where('recipeId').equals(id).delete();
      const ingredients: RecipeIngredient[] = newIngredients.map((ing, i) => ({
        id: crypto.randomUUID(),
        recipeId: id,
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit || null,
        sortOrder: ing.sortOrder ?? i,
      }));
      if (ingredients.length > 0) {
        await db.recipeIngredients.bulkPut(ingredients);
      }
    }

    await db.syncQueue.add({
      entity: 'recipe',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    const idx = recipes.value.findIndex(r => r.id === id);
    if (idx >= 0) {
      const updatedIngredients = newIngredients
        ? newIngredients.map((ing, i) => ({
            id: crypto.randomUUID(),
            recipeId: id,
            name: ing.name,
            quantity: ing.quantity ?? null,
            unit: ing.unit || null,
            sortOrder: ing.sortOrder ?? i,
          }))
        : recipes.value[idx].ingredients;
      recipes.value[idx] = { ...recipes.value[idx], ...recipeData, updatedAt: now, ingredients: updatedIngredients };
    }
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.recipes.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'recipe',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    recipes.value = recipes.value.filter(r => r.id !== id);
  }

  async function toggleFavorite(id: string) {
    const recipe = recipes.value.find(r => r.id === id);
    if (recipe) {
      await update(id, { isFavorite: !recipe.isFavorite });
    }
  }

  return { recipes, loading, loadFromLocal, create, update, remove, toggleFavorite };
});
```

**Step 2: Create meal plan store**

Create `apps/frontend/src/stores/mealPlan.ts`:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '@/db/schema';
import type { MealSlot, CreateMealSlotDto, UpdateMealSlotDto } from '@time-gestion/shared';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export const useMealPlanStore = defineStore('mealPlan', () => {
  const mealSlots = ref<MealSlot[]>([]);
  const currentWeekStart = ref(getWeekStart(new Date()));
  const loading = ref(false);

  const slotsByDay = computed(() => {
    const grouped: Record<string, MealSlot[]> = {};
    for (const slot of mealSlots.value) {
      const day = slot.date.split('T')[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(slot);
    }
    // Sort slots within each day
    for (const day of Object.keys(grouped)) {
      grouped[day].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return grouped;
  });

  async function loadWeek(weekStart?: string) {
    if (weekStart) currentWeekStart.value = weekStart;
    const start = currentWeekStart.value;
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    mealSlots.value = await db.mealSlots
      .where('date')
      .between(start, end.toISOString().split('T')[0], true, false)
      .filter(s => !s.deletedAt)
      .toArray();
  }

  async function addSlot(dto: CreateMealSlotDto): Promise<MealSlot> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const slot: MealSlot = {
      id,
      userId: '',
      recipeId: dto.recipeId || null,
      date: dto.date,
      slotName: dto.slotName,
      customTitle: dto.customTitle || null,
      sortOrder: dto.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await db.mealSlots.put(slot);
    await db.syncQueue.add({
      entity: 'mealSlot',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    mealSlots.value = [...mealSlots.value, slot];
    return slot;
  }

  async function assignRecipe(slotId: string, recipeId: string | null) {
    await updateSlot(slotId, { recipeId });
  }

  async function updateSlot(id: string, dto: UpdateMealSlotDto) {
    const now = new Date().toISOString();
    await db.mealSlots.update(id, { ...dto, updatedAt: now } as Partial<MealSlot>);
    await db.syncQueue.add({
      entity: 'mealSlot',
      entityId: id,
      action: 'UPDATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    const idx = mealSlots.value.findIndex(s => s.id === id);
    if (idx >= 0) {
      mealSlots.value[idx] = { ...mealSlots.value[idx], ...dto, updatedAt: now };
    }
  }

  async function removeSlot(id: string) {
    const now = new Date().toISOString();
    await db.mealSlots.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'mealSlot',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: now,
    });
    mealSlots.value = mealSlots.value.filter(s => s.id !== id);
  }

  function prevWeek() {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() - 7);
    loadWeek(d.toISOString().split('T')[0]);
  }

  function nextWeek() {
    const d = new Date(currentWeekStart.value);
    d.setDate(d.getDate() + 7);
    loadWeek(d.toISOString().split('T')[0]);
  }

  return {
    mealSlots, currentWeekStart, loading, slotsByDay,
    loadWeek, addSlot, assignRecipe, updateSlot, removeSlot,
    prevWeek, nextWeek,
  };
});
```

**Step 3: Create shopping store**

Create `apps/frontend/src/stores/shopping.ts`:

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import type { ShoppingItem, CreateShoppingItemDto } from '@time-gestion/shared';
import type { RecipeIngredient } from '@time-gestion/shared';

export const useShoppingStore = defineStore('shopping', () => {
  const items = ref<ShoppingItem[]>([]);
  const loading = ref(false);

  async function loadByWeek(weekStart: string) {
    items.value = await db.shoppingItems
      .where('weekStart')
      .equals(weekStart)
      .toArray();
    items.value.sort((a, b) => {
      if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }

  async function addManualItem(dto: CreateShoppingItemDto): Promise<ShoppingItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const item: ShoppingItem = {
      id,
      userId: '',
      name: dto.name,
      quantity: dto.quantity ?? null,
      unit: dto.unit || null,
      isChecked: false,
      sourceRecipeId: null,
      weekStart: dto.weekStart,
      createdAt: now,
    };

    await db.shoppingItems.put(item);
    await db.syncQueue.add({
      entity: 'shoppingItem',
      entityId: id,
      action: 'CREATE',
      payload: dto as unknown as Record<string, unknown>,
      timestamp: now,
    });

    items.value = [...items.value, item];
    return item;
  }

  async function toggleCheck(id: string) {
    const item = items.value.find(i => i.id === id);
    if (!item) return;

    const isChecked = !item.isChecked;
    await db.shoppingItems.update(id, { isChecked });
    await db.syncQueue.add({
      entity: 'shoppingItem',
      entityId: id,
      action: 'UPDATE',
      payload: { isChecked },
      timestamp: new Date().toISOString(),
    });

    const idx = items.value.findIndex(i => i.id === id);
    if (idx >= 0) {
      items.value[idx] = { ...items.value[idx], isChecked };
    }
  }

  async function removeItem(id: string) {
    await db.shoppingItems.delete(id);
    await db.syncQueue.add({
      entity: 'shoppingItem',
      entityId: id,
      action: 'DELETE',
      payload: {},
      timestamp: new Date().toISOString(),
    });
    items.value = items.value.filter(i => i.id !== id);
  }

  async function clearChecked(weekStart: string) {
    const checked = items.value.filter(i => i.isChecked);
    for (const item of checked) {
      await removeItem(item.id);
    }
  }

  async function generateFromPlan(weekStart: string) {
    // Get all meal slots for the week
    const start = weekStart;
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 7);
    const end = endDate.toISOString().split('T')[0];

    const slots = await db.mealSlots
      .where('date')
      .between(start, end, true, false)
      .filter(s => !s.deletedAt && !!s.recipeId)
      .toArray();

    // Aggregate ingredients
    const aggregated = new Map<string, { name: string; quantity: number; unit: string | null; sourceRecipeId: string }>();

    for (const slot of slots) {
      if (!slot.recipeId) continue;
      const ingredients = await db.recipeIngredients
        .where('recipeId')
        .equals(slot.recipeId)
        .toArray();

      for (const ing of ingredients) {
        const key = `${ing.name.toLowerCase().trim()}|${(ing.unit || '').toLowerCase().trim()}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.quantity += ing.quantity || 0;
        } else {
          aggregated.set(key, {
            name: ing.name,
            quantity: ing.quantity || 0,
            unit: ing.unit,
            sourceRecipeId: slot.recipeId,
          });
        }
      }
    }

    // Remove old generated items
    const oldGenerated = items.value.filter(i => i.sourceRecipeId);
    for (const item of oldGenerated) {
      await db.shoppingItems.delete(item.id);
    }

    // Create new items
    const now = new Date().toISOString();
    const newItems: ShoppingItem[] = Array.from(aggregated.values()).map(agg => ({
      id: crypto.randomUUID(),
      userId: '',
      name: agg.name,
      quantity: agg.quantity || null,
      unit: agg.unit,
      isChecked: false,
      sourceRecipeId: agg.sourceRecipeId,
      weekStart,
      createdAt: now,
    }));

    if (newItems.length > 0) {
      await db.shoppingItems.bulkPut(newItems);
    }

    // Reload
    await loadByWeek(weekStart);
  }

  return { items, loading, loadByWeek, addManualItem, toggleCheck, removeItem, clearChecked, generateFromPlan };
});
```

**Step 4: Commit**

```bash
git add apps/frontend/src/stores/recipes.ts apps/frontend/src/stores/mealPlan.ts apps/frontend/src/stores/shopping.ts
git commit -m "feat(frontend): add Pinia stores for recipes, meal plan, and shopping"
```

---

## Task 8: Frontend — Routes + BottomNav

**Files:**
- Modify: `apps/frontend/src/router/index.ts:6-53`
- Modify: `apps/frontend/src/components/layout/BottomNav.vue`

**Step 1: Add routes**

In `apps/frontend/src/router/index.ts`, add after the calendar route (line 36) and before the search route:

```typescript
    {
      path: '/menu',
      name: 'menu',
      component: () => import('@/views/MenuView.vue'),
    },
    {
      path: '/menu/recipes/new',
      name: 'recipe-new',
      component: () => import('@/views/RecipeFormView.vue'),
    },
    {
      path: '/menu/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
    },
    {
      path: '/menu/recipes/:id/edit',
      name: 'recipe-edit',
      component: () => import('@/views/RecipeFormView.vue'),
    },
```

**Step 2: Add Menu to BottomNav**

In `apps/frontend/src/components/layout/BottomNav.vue`:

Add `UtensilsCrossed` to imports:

```typescript
import { FileText, Calendar, UtensilsCrossed, Search, Settings } from 'lucide-vue-next';
```

Add Menu nav item after Calendar and before Search in the template:

```vue
    <RouterLink to="/menu" class="nav-item" :class="{ active: route.path.startsWith('/menu') }">
      <UtensilsCrossed :size="22" :stroke-width="route.path.startsWith('/menu') ? 2 : 1.5" />
      <span>Menu</span>
    </RouterLink>
```

**Step 3: Commit**

```bash
git add apps/frontend/src/router/index.ts apps/frontend/src/components/layout/BottomNav.vue
git commit -m "feat(frontend): add menu routes and bottom nav tab"
```

---

## Task 9: Frontend — MenuView (Main Tab Container)

**Files:**
- Create: `apps/frontend/src/views/MenuView.vue`
- Create: `apps/frontend/src/components/menu/RecipeCard.vue`
- Create: `apps/frontend/src/components/menu/WeekNavigator.vue`
- Create: `apps/frontend/src/components/menu/MealSlotCard.vue`
- Create: `apps/frontend/src/components/menu/ShoppingItemRow.vue`
- Create: `apps/frontend/src/components/menu/RecipePicker.vue`
- Create: `apps/frontend/src/components/menu/TagsInput.vue`

> **Note:** This is a large task. The implementing agent should create each component one at a time, testing build after each. Use the CalendarView.vue pattern (tabs, pull-to-refresh, FAB, iOS styling) as reference.

**Step 1: Create MenuView**

Create `apps/frontend/src/views/MenuView.vue` following the CalendarView pattern with:
- Pull-to-refresh
- Header with "Menu" title and segmented control (3 tabs: Recettes, Planning, Courses)
- Tab "Recettes": search bar, tag filter chips, grid of RecipeCard, FAB to create, empty state
- Tab "Planning": WeekNavigator, list of days with MealSlotCards, button to add slot
- Tab "Courses": generate button, ShoppingItemRow list, add manual item input, clear checked button
- FAB navigates to `/menu/recipes/new` on Recettes tab

Reference files:
- `apps/frontend/src/views/CalendarView.vue` — tab switching, pull-to-refresh, FAB pattern
- `apps/frontend/src/views/NotesView.vue` — search, filter chips, card grid pattern
- `apps/frontend/src/styles/main.css` — CSS variables

**Step 2: Create RecipeCard component**

Create `apps/frontend/src/components/menu/RecipeCard.vue`:
- Props: recipe (Recipe with ingredients)
- Display: image (or placeholder with icon), title, total time (prep + cook), servings, tags as small chips, favorite heart icon
- Click navigates to recipe detail
- CSS following NoteCard pattern (elevated bg, border-radius, shadow)

Reference: `apps/frontend/src/components/notes/NoteCard.vue`

**Step 3: Create WeekNavigator component**

Create `apps/frontend/src/components/menu/WeekNavigator.vue`:
- Props: currentWeekStart (string)
- Emits: prev, next
- Display: chevron-left button, "Semaine du {date}" label, chevron-right button
- Format date in French (e.g., "Semaine du 3 mars")

**Step 4: Create MealSlotCard component**

Create `apps/frontend/src/components/menu/MealSlotCard.vue`:
- Props: slot (MealSlot), recipeName (string, optional)
- Emits: assign (pick recipe), remove, edit
- Display: slot name label, recipe title or custom title, action buttons

**Step 5: Create ShoppingItemRow component**

Create `apps/frontend/src/components/menu/ShoppingItemRow.vue`:
- Props: item (ShoppingItem)
- Emits: toggle, remove
- Display: checkbox, name, quantity + unit, swipe-to-delete or X button
- Checked items get strikethrough styling

**Step 6: Create RecipePicker component**

Create `apps/frontend/src/components/menu/RecipePicker.vue`:
- Props: open (boolean)
- Emits: select(recipeId), close
- Modal overlay with list of recipes to pick from
- Search input to filter
- Uses useRecipesStore

Reference: `apps/frontend/src/components/sharing/ShareDialog.vue` for modal pattern

**Step 7: Create TagsInput component**

Create `apps/frontend/src/components/menu/TagsInput.vue`:
- Props: modelValue (string[])
- Emits: update:modelValue
- Display: chips for existing tags + text input for new tag
- Enter/comma adds a new tag, X removes a tag

**Step 8: Commit**

```bash
git add apps/frontend/src/views/MenuView.vue apps/frontend/src/components/menu/
git commit -m "feat(frontend): add MenuView with recipe cards, week planning, and shopping list"
```

---

## Task 10: Frontend — RecipeFormView

**Files:**
- Create: `apps/frontend/src/views/RecipeFormView.vue`
- Create: `apps/frontend/src/components/menu/RecipeIngredientRow.vue`

**Step 1: Create RecipeIngredientRow**

Create `apps/frontend/src/components/menu/RecipeIngredientRow.vue`:
- Props: ingredient ({ name, quantity, unit, sortOrder }), index (number)
- Emits: update, remove
- Display: 3 inline inputs (name text, quantity number, unit select/text) + remove button
- Unit options: g, kg, ml, L, c. a soupe, c. a cafe, piece, tranche, pincee

**Step 2: Create RecipeFormView**

Create `apps/frontend/src/views/RecipeFormView.vue`:
- Route params: check if `:id` exists (edit mode) or new
- Header: "Nouvelle recette" or "Modifier la recette" + back button + save button
- Form fields:
  - Title input (required)
  - Description textarea
  - Image URL input (future: file upload)
  - Prep time + cook time (number inputs, side by side, suffix "min")
  - Servings (number input, suffix "portions")
  - TagsInput component for tags
  - Ingredients section: list of RecipeIngredientRow + "Ajouter un ingredient" button
  - Instructions: NoteEditor component (TipTap) for rich text instructions
- Save action: calls recipesStore.create or .update, then navigates back
- Delete button in edit mode

Reference files:
- `apps/frontend/src/components/calendar/EventForm.vue` — form pattern
- `apps/frontend/src/components/editor/NoteEditor.vue` — TipTap integration
- `apps/frontend/src/views/NoteDetailView.vue` — detail view with editor

**Step 3: Commit**

```bash
git add apps/frontend/src/views/RecipeFormView.vue apps/frontend/src/components/menu/RecipeIngredientRow.vue
git commit -m "feat(frontend): add recipe form with ingredients and TipTap editor"
```

---

## Task 11: Frontend — RecipeDetailView

**Files:**
- Create: `apps/frontend/src/views/RecipeDetailView.vue`

**Step 1: Create RecipeDetailView**

Create `apps/frontend/src/views/RecipeDetailView.vue`:
- Route param: `:id`
- Header: back button + title + edit button (navigates to `/menu/recipes/:id/edit`) + favorite toggle
- Hero section: image (or placeholder gradient with UtensilsCrossed icon)
- Info badges: prep time (Clock icon), cook time (Flame icon), servings (Users icon)
- Ingredients section: ordered list with quantity + unit + name
- Instructions section: TipTap editor in read-only mode (editable: false)
- Delete button at bottom
- Uses useRecipesStore to load recipe

Reference: `apps/frontend/src/views/NoteDetailView.vue`

**Step 2: Commit**

```bash
git add apps/frontend/src/views/RecipeDetailView.vue
git commit -m "feat(frontend): add recipe detail view with ingredients and instructions"
```

---

## Task 12: Final Integration + Build Check

**Files:**
- Modify: `apps/backend/src/app.module.ts` (verify all 3 new modules registered)
- Modify: `apps/frontend/src/db/schema.ts` (verify version 3)

**Step 1: Verify backend compiles**

Run: `cd apps/backend && npx tsc --noEmit`

Expected: No errors

**Step 2: Verify frontend compiles**

Run: `cd apps/frontend && npx vue-tsc --noEmit`

Expected: No errors (or only pre-existing warnings)

**Step 3: Verify Prisma client is generated**

Run: `cd apps/backend && npx prisma generate`

Expected: Success

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete meal planning module integration"
```

---

## Summary of all files

### New files (27 files)

**Shared types (3):**
- `packages/shared/src/types/recipe.ts`
- `packages/shared/src/types/meal-plan.ts`
- `packages/shared/src/types/shopping.ts`

**Backend modules (15):**
- `apps/backend/src/recipes/recipes.module.ts`
- `apps/backend/src/recipes/recipes.controller.ts`
- `apps/backend/src/recipes/recipes.service.ts`
- `apps/backend/src/recipes/dto/create-recipe.dto.ts`
- `apps/backend/src/recipes/dto/update-recipe.dto.ts`
- `apps/backend/src/meal-plans/meal-plans.module.ts`
- `apps/backend/src/meal-plans/meal-plans.controller.ts`
- `apps/backend/src/meal-plans/meal-plans.service.ts`
- `apps/backend/src/meal-plans/dto/create-meal-slot.dto.ts`
- `apps/backend/src/meal-plans/dto/update-meal-slot.dto.ts`
- `apps/backend/src/shopping/shopping.module.ts`
- `apps/backend/src/shopping/shopping.controller.ts`
- `apps/backend/src/shopping/shopping.service.ts`
- `apps/backend/src/shopping/dto/create-shopping-item.dto.ts`
- `apps/backend/src/shopping/dto/update-shopping-item.dto.ts`
- `apps/backend/src/shopping/dto/generate-shopping.dto.ts`

**Frontend stores (3):**
- `apps/frontend/src/stores/recipes.ts`
- `apps/frontend/src/stores/mealPlan.ts`
- `apps/frontend/src/stores/shopping.ts`

**Frontend views (3):**
- `apps/frontend/src/views/MenuView.vue`
- `apps/frontend/src/views/RecipeFormView.vue`
- `apps/frontend/src/views/RecipeDetailView.vue`

**Frontend components (7):**
- `apps/frontend/src/components/menu/RecipeCard.vue`
- `apps/frontend/src/components/menu/RecipeIngredientRow.vue`
- `apps/frontend/src/components/menu/MealSlotCard.vue`
- `apps/frontend/src/components/menu/WeekNavigator.vue`
- `apps/frontend/src/components/menu/ShoppingItemRow.vue`
- `apps/frontend/src/components/menu/RecipePicker.vue`
- `apps/frontend/src/components/menu/TagsInput.vue`

### Modified files (6)
- `packages/shared/src/types/sync.ts` — add new entity types
- `packages/shared/src/index.ts` — export new types
- `apps/backend/prisma/schema.prisma` — add 4 models + User relations
- `apps/backend/src/app.module.ts` — register 3 new modules
- `apps/frontend/src/db/schema.ts` — add 4 Dexie tables (v3)
- `apps/frontend/src/sync/engine.ts` — update entity type cast
- `apps/frontend/src/router/index.ts` — add menu routes
- `apps/frontend/src/components/layout/BottomNav.vue` — add Menu tab
