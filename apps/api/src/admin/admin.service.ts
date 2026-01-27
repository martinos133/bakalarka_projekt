import { Injectable } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

@Injectable()
export class AdminService {
  async getStats() {
    const [usersCount, advertisementsCount, activeAdvertisementsCount] = await Promise.all([
      prisma.user.count(),
      prisma.advertisement.count(),
      prisma.advertisement.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    return {
      users: usersCount,
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
}
