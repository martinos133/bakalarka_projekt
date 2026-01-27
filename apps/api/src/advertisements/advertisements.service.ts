import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateAdvertisementDto, UpdateAdvertisementDto } from '@inzertna-platforma/shared';

@Injectable()
export class AdvertisementsService {
  async create(userId: string, createDto: CreateAdvertisementDto) {
    return prisma.advertisement.create({
      data: {
        ...createDto,
        userId,
        images: createDto.images || [],
      },
    });
  }

  async findAll() {
    return prisma.advertisement.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    return advertisement;
  }

  async update(id: string, userId: string, updateDto: UpdateAdvertisementDto) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    if (advertisement.userId !== userId) {
      throw new ForbiddenException('Nemáte oprávnenie upravovať tento inzerát');
    }

    return prisma.advertisement.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, userId: string) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    if (advertisement.userId !== userId) {
      throw new ForbiddenException('Nemáte oprávnenie odstrániť tento inzerát');
    }

    return prisma.advertisement.delete({
      where: { id },
    });
  }

  async findByUser(userId: string) {
    return prisma.advertisement.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
