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
        type: (createDto.type as any) || 'SERVICE',
        features: createDto.features || [],
        packages: createDto.packages ? JSON.parse(JSON.stringify(createDto.packages)) : null,
        faq: createDto.faq ? JSON.parse(JSON.stringify(createDto.faq)) : null,
      } as any,
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
        category: true,
      } as any,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPopularServices(limit: number = 6) {
    return prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE' as any,
        type: 'SERVICE' as any,
      } as any,
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
        category: true,
      } as any,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
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
        category: true,
      } as any,
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
      data: {
        ...updateDto,
        images: updateDto.images !== undefined ? updateDto.images : advertisement.images,
        features: updateDto.features !== undefined ? updateDto.features : (advertisement as any).features,
        packages: updateDto.packages !== undefined ? (updateDto.packages ? JSON.parse(JSON.stringify(updateDto.packages)) : null) : (advertisement as any).packages,
        faq: updateDto.faq !== undefined ? (updateDto.faq ? JSON.parse(JSON.stringify(updateDto.faq)) : null) : (advertisement as any).faq,
      } as any,
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

  async findPending() {
    return prisma.advertisement.findMany({
      where: {
        status: 'PENDING' as any,
      },
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
        category: true,
      } as any,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async approve(id: string) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    if ((advertisement.status as string) !== 'PENDING') {
      throw new ForbiddenException('Inzerát už bol spracovaný');
    }

    return prisma.advertisement.update({
      where: { id },
      data: {
        status: 'ACTIVE' as any,
      },
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
        category: true,
      } as any,
    });
  }

  async reject(id: string, reason?: string) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    if ((advertisement.status as string) !== 'PENDING') {
      throw new ForbiddenException('Inzerát už bol spracovaný');
    }

    return prisma.advertisement.update({
      where: { id },
      data: {
        status: 'INACTIVE' as any,
      },
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
        category: true,
      } as any,
    });
  }
}
