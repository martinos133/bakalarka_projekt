import { Injectable } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { Gender } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private emptyStats(period: string) {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      total: 0,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      byGender: { male: 0, female: 0, other: 0, unspecified: 0 },
      byAccountType: { company: 0, individual: 0, unspecified: 0 },
    };
  }

  private async clickEventTableExists(): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ClickEvent'
      ) as exists
    `;
    return !!result[0]?.exists;
  }

  async recordClick(data: {
    userId?: string;
    sessionId?: string;
    gender?: Gender;
    isCompany?: boolean;
    eventType?: string;
    targetType?: string;
    targetId?: string;
  }) {
    if (!(await this.clickEventTableExists())) {
      return { id: '', recorded: false };
    }
    try {
      const event = await prisma.clickEvent.create({
        data: {
          userId: data.userId ?? null,
          sessionId: data.sessionId ?? null,
          gender: data.gender ?? null,
          isCompany: data.isCompany ?? null,
          eventType: data.eventType ?? 'CLICK',
          targetType: data.targetType ?? null,
          targetId: data.targetId ?? null,
        },
      });
      console.log('[Analytics] Click recorded:', event.id, data.targetType, data.targetId);
      return { ...event, recorded: true };
    } catch (err) {
      console.error('[Analytics] recordClick failed:', err);
      return { id: '', recorded: false };
    }
  }

  async getClickStats(period: '1m' | '5m' | '1d' | '7d' | '30d' | '3m' = '30d') {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '1m':
        startDate = new Date(now.getTime() - 60 * 1000);
        break;
      case '5m':
        startDate = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    try {
      if (!(await this.clickEventTableExists())) {
        return this.emptyStats(period);
      }

      const where = { createdAt: { gte: startDate } };

      const [total, byGenderRows, byCompanyRows] = await Promise.all([
        prisma.clickEvent.count({ where }),
        prisma.clickEvent.groupBy({
          by: ['gender'],
          where,
          _count: { id: true },
        }),
        prisma.clickEvent.groupBy({
          by: ['isCompany'],
          where: { ...where, isCompany: { not: null } },
          _count: { id: true },
        }),
      ]);

      const byGender = {
        male: 0,
        female: 0,
        other: 0,
        unspecified: 0,
      };
      byGenderRows.forEach((row) => {
        if (row.gender === 'MALE') byGender.male = row._count.id;
        else if (row.gender === 'FEMALE') byGender.female = row._count.id;
        else if (row.gender === 'OTHER') byGender.other = row._count.id;
        else byGender.unspecified = row._count.id;
      });

      const byAccountType = {
        company: 0,
        individual: 0,
        unspecified: 0,
      };
      byCompanyRows.forEach((row) => {
        if (row.isCompany === true) byAccountType.company = row._count.id;
        else if (row.isCompany === false) byAccountType.individual = row._count.id;
      });
      const withAccountType = byCompanyRows.reduce((s, r) => s + r._count.id, 0);
      byAccountType.unspecified = total - withAccountType;

      return {
        total,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        byGender,
        byAccountType,
      };
    } catch (err) {
      console.error('[Analytics] getClickStats failed (table may not exist, run migration):', err);
      return this.emptyStats(period);
    }
  }
}
