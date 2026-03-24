import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { BanUserDto } from '@inzertna-platforma/shared';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  async findOne(id: string) {
    await this.expireSubscriptionIfNeeded(id);
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

  async updateProfile(userId: string, updateData: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null,
        gender: updateData.gender && ['MALE', 'FEMALE', 'OTHER'].includes(updateData.gender) ? updateData.gender : null,
        isCompany: updateData.hasOwnProperty('isCompany') ? Boolean(updateData.isCompany) : user.isCompany,
        companyName: updateData.companyName,
        companyId: updateData.companyId,
        companyTaxId: updateData.companyTaxId,
        address: updateData.address,
        city: updateData.city,
        postalCode: updateData.postalCode,
        country: updateData.country,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        isCompany: true,
        companyName: true,
        companyId: true,
        companyTaxId: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        role: true,
        sellerPlan: true,
        sellerPlanValidUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /** Po „platbe“ (demo checkout) nastaví balík, platnosť a zvýrazní inzeráty podľa limitu. */
  async activateDemoCheckout(userId: string, planRaw: string) {
    const normalized = String(planRaw || '').toUpperCase();
    if (!['PLUS', 'PRO', 'FIRMA'].includes(normalized)) {
      throw new BadRequestException('Neplatný balík');
    }
    await this.expireSubscriptionIfNeeded(userId);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    await prisma.user.update({
      where: { id: userId },
      data: {
        sellerPlan: normalized as any,
        sellerPlanValidUntil: validUntil,
      },
    });
    await this.syncPriorityBoostsForUser(userId);
    return this.findOne(userId);
  }

  private maxPrioritySlots(plan: string): number {
    switch (plan) {
      case 'PLUS':
        return 1;
      case 'PRO':
        return 3;
      case 'FIRMA':
        return 10;
      default:
        return 0;
    }
  }

  private async expireSubscriptionIfNeeded(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sellerPlan: true, sellerPlanValidUntil: true },
    });
    if (!user) return;
    const now = new Date();
    if (
      user.sellerPlan !== 'STANDARD' &&
      user.sellerPlanValidUntil &&
      user.sellerPlanValidUntil < now
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          sellerPlan: 'STANDARD',
          sellerPlanValidUntil: null,
        },
      });
      await prisma.advertisement.updateMany({
        where: { userId },
        data: { priorityBoosted: false },
      });
    }
  }

  /** Verejné pre synchronizáciu po vytvorení / zmene inzerátu. */
  async syncPriorityBoostsForUser(userId: string) {
    await this.expireSubscriptionIfNeeded(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sellerPlan: true, sellerPlanValidUntil: true },
    });
    if (!user) return;
    const now = new Date();
    const effectivePlan =
      user.sellerPlan !== 'STANDARD' && user.sellerPlanValidUntil && user.sellerPlanValidUntil > now
        ? user.sellerPlan
        : 'STANDARD';
    const max = this.maxPrioritySlots(effectivePlan);
    const toBoost = await prisma.advertisement.findMany({
      where: { userId, status: 'ACTIVE' as any },
      orderBy: { createdAt: 'desc' },
      take: max,
      select: { id: true },
    });
    const boosted = new Set(toBoost.map((a) => a.id));
    await prisma.advertisement.updateMany({
      where: { userId },
      data: { priorityBoosted: false },
    });
    for (const id of boosted) {
      await prisma.advertisement.update({
        where: { id },
        data: { priorityBoosted: true },
      });
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Pôvodné heslo je nesprávne');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Heslo bolo úspešne zmenené' };
  }
}
