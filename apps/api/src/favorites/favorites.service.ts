import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

@Injectable()
export class FavoritesService {
  async findAll(userId: string) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        advertisement: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, advertisementId: string) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: advertisementId },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_advertisementId: { userId, advertisementId },
      },
    });

    if (existing) {
      throw new BadRequestException('Inzerát už máte v obľúbených');
    }

    return prisma.favorite.create({
      data: { userId, advertisementId },
      include: {
        advertisement: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            category: true,
          },
        },
      },
    });
  }

  async remove(userId: string, advertisementId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_advertisementId: { userId, advertisementId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Obľúbený inzerát nebol nájdený');
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    return { success: true };
  }

  async isFavorite(userId: string, advertisementId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_advertisementId: { userId, advertisementId },
      },
    });
    return !!favorite;
  }
}
