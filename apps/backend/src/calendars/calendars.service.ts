import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@Injectable()
export class CalendarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.calendar.findMany({
      where: { userId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.calendar.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Calendar not found');
    return item;
  }

  async create(userId: string, dto: CreateCalendarDto) {
    return this.prisma.calendar.create({
      data: { ...dto, userId },
    });
  }

  async update(userId: string, id: string, dto: UpdateCalendarDto) {
    await this.findOne(userId, id);
    return this.prisma.calendar.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.calendar.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
