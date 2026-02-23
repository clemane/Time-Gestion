import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters?: {
      calendarId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const where: Record<string, unknown> = { userId, deletedAt: null };

    if (filters?.calendarId) {
      where.calendarId = filters.calendarId;
    }
    if (filters?.from || filters?.to) {
      const startAtFilter: Record<string, Date> = {};
      if (filters.from) startAtFilter.gte = new Date(filters.from);
      if (filters.to) startAtFilter.lte = new Date(filters.to);
      where.startAt = startAtFilter;
    }

    return this.prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.calendarEvent.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Event not found');
    return item;
  }

  async create(userId: string, dto: CreateEventDto) {
    return this.prisma.calendarEvent.create({
      data: { ...dto, userId },
    });
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    await this.findOne(userId, id);
    return this.prisma.calendarEvent.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.calendarEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
