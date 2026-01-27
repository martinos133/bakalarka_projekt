import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateAdvertisementDto, UpdateAdvertisementDto, MessageType } from '@inzertna-platforma/shared';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class AdvertisementsService {
  constructor(private readonly messagesService: MessagesService) {}
  async create(userId: string, createDto: CreateAdvertisementDto) {
    // Skontroluj, či používateľ nie je zabanovaný
    const user = await prisma.user.findUnique({
      where: { id: userId },
    }) as any;

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }

    if (user.banned) {
      const now = new Date();
      if (user.bannedUntil && user.bannedUntil > now) {
        throw new ForbiddenException('Nemáte oprávnenie vytvárať inzeráty. Váš účet je zabanovaný.');
      } else if (!user.bannedUntil) {
        throw new ForbiddenException('Nemáte oprávnenie vytvárať inzeráty. Váš účet je trvalo zabanovaný.');
      }
    }

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

    const updated = await prisma.advertisement.update({
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

    // Vytvor systémovú správu o schválení
    await this.messagesService.createSystemMessage(
      advertisement.userId,
      'AD_APPROVED' as any,
      'Váš inzerát bol schválený',
      `Váš inzerát "${advertisement.title}" bol schválený a je teraz aktívny na platforme.`,
      {
        advertisementId: id,
      },
    );

    return updated;
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

    const updated = await prisma.advertisement.update({
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

    // Vytvor systémovú správu o zamietnutí
    await this.messagesService.createSystemMessage(
      advertisement.userId,
      'AD_REJECTED' as any,
      'Váš inzerát bol zamietnutý',
      `Váš inzerát "${advertisement.title}" bol zamietnutý.\n\n${reason ? `Dôvod: ${reason}` : 'Bez uvedeného dôvodu'}`,
      {
        advertisementId: id,
        reason,
      },
    );

    return updated;
  }
}
