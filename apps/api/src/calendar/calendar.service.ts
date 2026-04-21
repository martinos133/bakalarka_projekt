import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import {
  CALENDAR_COLOR_BLOCKED,
  CALENDAR_COLOR_BOOKING,
  rangesOverlapYmd,
  ymdRangeFromStoredEvent,
  iterateYmdRangeLocal,
} from '@inzertna-platforma/shared';

@Injectable()
export class CalendarService {
  /**
   * Udalosti používateľa; ak sú from/to, vráti len tie, čo sa s daným mesiacom/obdobím prekrývajú.
   */
  async findByUser(userId: string, from?: string, to?: string) {
    const events = await prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    if (!from?.trim() && !to?.trim()) return events;
    const f = (from || '1970-01-01').slice(0, 10);
    const t = (to || '2999-12-31').slice(0, 10);
    const window = { startYmd: f, endYmd: t };
    return events.filter((e) => {
      const ev = ymdRangeFromStoredEvent(e.date, e.endDate);
      return rangesOverlapYmd(window, ev);
    });
  }

  /** Blokované sloty predajcu, ktoré sa prekrývajú s intervalom dotazu. */
  async findBlockedOverlapsForSeller(
    sellerId: string,
    startYmd: string,
    endYmd: string,
  ) {
    const blocks = await prisma.calendarEvent.findMany({
      where: { userId: sellerId, color: CALENDAR_COLOR_BLOCKED },
      orderBy: { date: 'asc' },
    });
    const q = { startYmd, endYmd };
    return blocks.filter((e) =>
      rangesOverlapYmd(q, ymdRangeFromStoredEvent(e.date, e.endDate)),
    );
  }

  /** Blok + potvrdená rezervácia – pre validáciu žiadosti a verejný kalendár. */
  async findBusyOverlapsForSeller(
    sellerId: string,
    startYmd: string,
    endYmd: string,
  ) {
    const rows = await prisma.calendarEvent.findMany({
      where: {
        userId: sellerId,
        color: { in: [CALENDAR_COLOR_BLOCKED, CALENDAR_COLOR_BOOKING] },
      },
      orderBy: { date: 'asc' },
    });
    const q = { startYmd, endYmd };
    return rows.filter((e) =>
      rangesOverlapYmd(q, ymdRangeFromStoredEvent(e.date, e.endDate)),
    );
  }

  /** Zoznam YYYY-MM-DD pre všetky obsadené dni predajcu (bez citlivých údajov). */
  async getOccupiedYmdsForSellerPublic(sellerUserId: string): Promise<string[]> {
    const rows = await prisma.calendarEvent.findMany({
      where: {
        userId: sellerUserId,
        color: { in: [CALENDAR_COLOR_BLOCKED, CALENDAR_COLOR_BOOKING] },
      },
      select: { date: true, endDate: true },
    });
    const set = new Set<string>();
    for (const e of rows) {
      const { startYmd, endYmd } = ymdRangeFromStoredEvent(e.date, e.endDate);
      for (const ymd of iterateYmdRangeLocal(startYmd, endYmd)) {
        set.add(ymd);
      }
    }
    return Array.from(set).sort();
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
