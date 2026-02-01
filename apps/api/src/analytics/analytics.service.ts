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
      averageAge: null as number | null,
    };
  }

  private static ageFromDateOfBirth(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getFullYear() - dateOfBirth.getFullYear();
    const m = now.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) age--;
    return age;
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

  async getClickStats(
    period: '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m' = '30d',
    minutesParam?: number,
    genderFilter?: string,
    accountTypeFilter?: string,
  ) {
    const now = new Date();
    let startDate: Date;
    const minutes = minutesParam != null && Number.isFinite(minutesParam) ? Math.max(1, Math.min(480, Math.floor(minutesParam))) : null;
    if (minutes != null) {
      startDate = new Date(now.getTime() - minutes * 60 * 1000);
    } else {
      switch (period) {
        case '1m':
          startDate = new Date(now.getTime() - 60 * 1000);
          break;
        case '5m':
          startDate = new Date(now.getTime() - 5 * 60 * 1000);
          break;
        case '8h':
          startDate = new Date(now.getTime() - 8 * 60 * 60 * 1000);
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
    }
    const effectivePeriod = minutes != null ? `${minutes}m` : period;

    try {
      if (!(await this.clickEventTableExists())) {
        return this.emptyStats(effectivePeriod);
      }

      const where: { createdAt: { gte: Date }; gender?: null | string; isCompany?: boolean | null } = { createdAt: { gte: startDate } };
      if (genderFilter && genderFilter !== 'all') {
        where.gender = genderFilter === 'unspecified' ? null : genderFilter;
      }
      if (accountTypeFilter && accountTypeFilter !== 'all') {
        where.isCompany = accountTypeFilter === 'company' ? true : accountTypeFilter === 'individual' ? false : null;
      }

      const [total, byGenderRows, byCompanyRows, clickUserIds] = await Promise.all([
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
        prisma.clickEvent.findMany({
          where: { ...where, userId: { not: null } },
          select: { userId: true },
        }),
      ]);

      const userIds = [...new Set((clickUserIds as { userId: string | null }[]).map((e) => e.userId).filter(Boolean))] as string[];
      let averageAge: number | null = null;
      if (userIds.length > 0) {
        const usersWithDob = await prisma.user.findMany({
          where: { id: { in: userIds }, dateOfBirth: { not: null } },
          select: { dateOfBirth: true },
        });
        if (usersWithDob.length > 0) {
          const ages = usersWithDob.map((u) => AnalyticsService.ageFromDateOfBirth(u.dateOfBirth!));
          averageAge = Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10;
        }
      }

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
        period: effectivePeriod,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        byGender,
        byAccountType,
        averageAge,
      };
    } catch (err) {
      console.error('[Analytics] getClickStats failed (table may not exist, run migration):', err);
      return this.emptyStats(effectivePeriod);
    }
  }

  private getStartDate(period: '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m') {
    const now = new Date();
    switch (period) {
      case '1m': return new Date(now.getTime() - 60 * 1000);
      case '5m': return new Date(now.getTime() - 5 * 60 * 1000);
      case '8h': return new Date(now.getTime() - 8 * 60 * 60 * 1000);
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3m': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  async getClickBreakdown(period: '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m' = '30d') {
    const now = new Date();
    const startDate = this.getStartDate(period);
    const emptyBreakdown = {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      byTargetType: {} as Record<string, number>,
      topCategories: [] as { categoryId: string; name: string; slug: string; count: number }[],
      topAdvertisements: [] as { advertisementId: string; title: string; count: number }[],
    };

    try {
      if (!(await this.clickEventTableExists())) {
        return emptyBreakdown;
      }

      const where = {
        createdAt: { gte: startDate },
        targetType: { not: null },
        targetId: { not: null },
      };

      const rows = await prisma.clickEvent.groupBy({
        by: ['targetType', 'targetId'],
        where,
        _count: { id: true },
      });

      const byTargetType: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};
      const adCounts: Record<string, number> = {};

      for (const row of rows) {
        const type = row.targetType!;
        const id = row.targetId!;
        const count = row._count.id;
        byTargetType[type] = (byTargetType[type] ?? 0) + count;
        if (type === 'CATEGORY') {
          categoryCounts[id] = (categoryCounts[id] ?? 0) + count;
        } else if (type === 'AD') {
          adCounts[id] = (adCounts[id] ?? 0) + count;
        }
      }

      const categoryIds = Object.keys(categoryCounts);
      const adIds = Object.keys(adCounts);

      const [categories, advertisements] = await Promise.all([
        categoryIds.length > 0
          ? prisma.category.findMany({
              where: { id: { in: categoryIds } },
              select: { id: true, name: true, slug: true },
            })
          : [],
        adIds.length > 0
          ? prisma.advertisement.findMany({
              where: { id: { in: adIds } },
              select: { id: true, title: true },
            })
          : [],
      ]);

      const topCategories = categories
        .map((c) => ({ categoryId: c.id, name: c.name, slug: c.slug, count: categoryCounts[c.id] ?? 0 }))
        .sort((a, b) => b.count - a.count);

      const topAdvertisements = advertisements
        .map((a) => ({ advertisementId: a.id, title: a.title, count: adCounts[a.id] ?? 0 }))
        .sort((a, b) => b.count - a.count);

      return {
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        byTargetType,
        topCategories,
        topAdvertisements,
      };
    } catch (err) {
      console.error('[Analytics] getClickBreakdown failed:', err);
      return emptyBreakdown;
    }
  }
}
