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

  async seedDefaults(userId: string) {
    const defaults = [
      {
        name: 'Note',
        icon: '📝',
        style: { backgroundColor: '#ffffff', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
        defaultContent: null,
        sortOrder: 0,
      },
      {
        name: 'Checklist',
        icon: '✅',
        style: { backgroundColor: '#f0fdf4', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
        defaultContent: {
          type: 'doc',
          content: [
            {
              type: 'taskList',
              content: [
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
              ],
            },
          ],
        },
        sortOrder: 1,
      },
      {
        name: 'Liste de courses',
        icon: '🛒',
        style: { backgroundColor: '#fefce8', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
        defaultContent: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Courses' }],
            },
            {
              type: 'taskList',
              content: [
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
              ],
            },
          ],
        },
        sortOrder: 2,
      },
      {
        name: 'Journal',
        icon: '📔',
        style: { backgroundColor: '#fdf4ff', lineStyle: 'lined', fontFamily: 'Georgia, serif', fontSize: 16 },
        defaultContent: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }],
            },
            { type: 'paragraph' },
          ],
        },
        sortOrder: 3,
      },
      {
        name: 'Idees',
        icon: '💡',
        style: { backgroundColor: '#eff6ff', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
        defaultContent: null,
        sortOrder: 4,
      },
      {
        name: 'Reunion',
        icon: '🤝',
        style: { backgroundColor: '#fef2f2', lineStyle: 'lined', fontFamily: 'sans-serif', fontSize: 15 },
        defaultContent: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Ordre du jour' }],
            },
            {
              type: 'bulletList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph' }] },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Notes' }],
            },
            { type: 'paragraph' },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Actions' }],
            },
            {
              type: 'taskList',
              content: [
                { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] },
              ],
            },
          ],
        },
        sortOrder: 5,
      },
      {
        name: 'Recette',
        icon: '🍳',
        style: { backgroundColor: '#fff7ed', lineStyle: 'none', fontFamily: 'sans-serif', fontSize: 16 },
        defaultContent: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Ingredients' }],
            },
            {
              type: 'bulletList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph' }] },
              ],
            },
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Etapes' }],
            },
            {
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph' }] },
              ],
            },
          ],
        },
        sortOrder: 6,
      },
    ];

    await this.prisma.category.createMany({
      data: defaults.map((cat) => ({
        userId,
        name: cat.name,
        icon: cat.icon,
        style: cat.style,
        defaultContent: cat.defaultContent ?? Prisma.DbNull,
        isDefault: true,
        sortOrder: cat.sortOrder,
      })),
    });
  }
}
