import { Injectable } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

@Injectable()
export class AdminService {
  async getStats() {
    const [usersCount, advertisementsCount, activeAdvertisementsCount, activeUsersCount] = await Promise.all([
      prisma.user.count(),
      prisma.advertisement.count(),
      prisma.advertisement.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.user.count({
        where: {
          advertisements: {
            some: {},
          },
        },
      }),
    ]);

    return {
      users: usersCount,
      activeUsers: activeUsersCount,
      advertisements: advertisementsCount,
      activeAdvertisements: activeAdvertisementsCount,
    };
  }

  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
    });
  }

  async getAllAdvertisements() {
    return prisma.advertisement.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getChartData(period: '7d' | '30d' | '3m') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
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

    // Získame všetky inzeráty vytvorené v danom období
    const advertisements = await prisma.advertisement.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Zoskupíme podľa dní
    const dataMap = new Map<string, { date: string; advertisements: number; active: number }>();

    advertisements.forEach((ad) => {
      const date = new Date(ad.createdAt).toISOString().split('T')[0];
      const existing = dataMap.get(date) || { date, advertisements: 0, active: 0 };
      existing.advertisements++;
      if (ad.status === 'ACTIVE') {
        existing.active++;
      }
      dataMap.set(date, existing);
    });

    // Vyplníme všetky dni v období
    const result: Array<{ date: string; advertisements: number; active: number }> = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const data = dataMap.get(dateStr) || { date: dateStr, advertisements: 0, active: 0 };
      result.push(data);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }
}
