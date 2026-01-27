import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { BanUserDto } from '@inzertna-platforma/shared';

@Injectable()
export class UsersService {
  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll() {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(({ password, ...user }) => user);
  }

  async banUser(id: string, banDto: BanUserDto) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        banned: banDto.banned,
        bannedUntil: banDto.bannedUntil || null,
        banReason: banDto.banReason || null,
      },
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
    });

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async updateLastLogin(id: string) {
    await prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async getUserStats(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }

    const [activeAdvertisements, paymentsReceived, paymentsMade] = await Promise.all([
      prisma.advertisement.count({
        where: {
          userId: id,
          status: 'ACTIVE',
        },
      }),
      prisma.payment.findMany({
        where: {
          ownerId: id,
        },
      }),
      prisma.payment.findMany({
        where: {
          renterId: id,
        },
      }),
    ]);

    const paymentsReceivedAmount = paymentsReceived.reduce((sum, p) => sum + p.amount, 0);
    const paymentsMadeAmount = paymentsMade.reduce((sum, p) => sum + p.amount, 0);
    const completedPaymentsReceived = paymentsReceived.filter(p => p.status === 'COMPLETED').length;
    const completedPaymentsMade = paymentsMade.filter(p => p.status === 'COMPLETED').length;

    return {
      totalAdvertisements: user._count.advertisements,
      activeAdvertisements,
      paymentsReceived: paymentsReceived.length,
      paymentsReceivedAmount,
      paymentsMade: paymentsMade.length,
      paymentsMadeAmount,
      completedPaymentsReceived,
      completedPaymentsMade,
    };
  }
}
