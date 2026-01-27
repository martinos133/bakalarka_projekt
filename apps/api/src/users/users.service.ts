import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { BanUserDto } from '@inzertna-platforma/shared';
import * as bcrypt from 'bcrypt';

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
        gender: updateData.gender as any,
        isCompany: updateData.isCompany || false,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
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
