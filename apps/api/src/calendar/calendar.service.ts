import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

@Injectable()
export class CalendarService {
  async findByUser(userId: string, from?: string, to?: string) {
    const where: any = { userId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Udalosť nebola nájdená');
    if (event.userId !== userId)
      throw new ForbiddenException('Nemáte oprávnenie');
    return event;
  }

  async create(
    userId: string,
    data: {
      title: string;
      description?: string;
      type?: 'EVENT' | 'REMINDER' | 'TASK';
      date: string;
      endDate?: string;
      allDay?: boolean;
      color?: string;
    },
  ) {
    return prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type || 'EVENT',
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        allDay: data.allDay ?? true,
        color: data.color || null,
        userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      type?: 'EVENT' | 'REMINDER' | 'TASK';
      date?: string;
      endDate?: string;
      allDay?: boolean;
      color?: string;
      completed?: boolean;
    },
  ) {
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Udalosť nebola nájdená');
    if (event.userId !== userId)
      throw new ForbiddenException('Nemáte oprávnenie');

    return prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.color !== undefined && { color: data.color || null }),
        ...(data.completed !== undefined && { completed: data.completed }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Udalosť nebola nájdená');
    if (event.userId !== userId)
      throw new ForbiddenException('Nemáte oprávnenie');

    await prisma.calendarEvent.delete({ where: { id } });
    return { success: true };
  }
}
