import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateAdvertisementDto, UpdateAdvertisementDto, MessageType } from '@inzertna-platforma/shared';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { validateCategorySpecifications } from './specifications.validation';

@Injectable()
export class AdvertisementsService {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}
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

    const { specifications: specsRaw, ...createRest } = createDto as CreateAdvertisementDto & {
      specifications?: Record<string, unknown> | null;
    };

    const specifications = await validateCategorySpecifications(
      createRest.categoryId,
      specsRaw === undefined || specsRaw === null
        ? {}
        : (specsRaw as Record<string, unknown>),
    );

    const created = await prisma.advertisement.create({
      data: {
        ...createRest,
        userId,
        images: createRest.images || [],
        type: (createRest.type as any) || 'SERVICE',
        features: createRest.features || [],
        packages: createRest.packages ? JSON.parse(JSON.stringify(createRest.packages)) : null,
        faq: createRest.faq ? JSON.parse(JSON.stringify(createRest.faq)) : null,
        specifications,
      } as any,
    });
    await this.usersService.syncPriorityBoostsForUser(userId).catch(() => undefined);
    return created;
  }

  async findForMap(filters: { categoryId?: string; type?: 'SERVICE' | 'RENTAL'; region?: string }) {
    const where: any = { status: 'ACTIVE' };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.type) where.type = filters.type;
    if (filters.region && filters.region.trim()) {
      where.location = { contains: filters.region.trim(), mode: 'insensitive' };
    }
    const list = await prisma.advertisement.findMany({
      where,
      select: {
        id: true,
        title: true,
        location: true,
        latitude: true,
        longitude: true,
        type: true,
        price: true,
        images: true,
        priorityBoosted: true,
        categoryId: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ priorityBoosted: 'desc' }, { createdAt: 'desc' }],
    });
    return list.map((ad) => ({
      id: ad.id,
      title: ad.title,
      location: ad.location,
      latitude: ad.latitude,
      longitude: ad.longitude,
      type: ad.type,
      price: ad.price,
      image: Array.isArray(ad.images) && ad.images.length > 0 ? ad.images[0] : null,
      category: ad.category ? { id: ad.category.id, name: ad.category.name, slug: ad.category.slug } : null,
    }));
  }

  async findAll() {
    return prisma.advertisement.findMany({
      where: { status: 'ACTIVE' as any },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            sellerPlan: true,
            sellerPlanValidUntil: true,
            avatarUrl: true,
          },
        },
        category: true,
      } as any,
      orderBy: [{ priorityBoosted: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async search(query: string) {
    return prisma.advertisement.findMany({
      where: {
        status: 'ACTIVE' as any,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            sellerPlan: true,
            sellerPlanValidUntil: true,
            avatarUrl: true,
          },
        },
        category: true,
      } as any,
      orderBy: [{ priorityBoosted: 'desc' }, { createdAt: 'desc' }],
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
            sellerPlan: true,
            sellerPlanValidUntil: true,
            avatarUrl: true,
          },
        },
        category: true,
      } as any,
      orderBy: [{ priorityBoosted: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  async findTopFreelancers(limit: number = 4) {
    const usersWithAds = await prisma.user.findMany({
      where: {
        banned: false,
        advertisements: {
          some: { status: 'ACTIVE' as any },
        },
      },
      include: {
        advertisements: {
          where: { status: 'ACTIVE' as any },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
          },
        },
        _count: {
          select: { advertisements: true },
        },
      },
      take: limit * 3,
    })

    const sorted = usersWithAds
      .filter((u) => u.advertisements.length > 0)
      .sort((a, b) => (b._count as any).advertisements - (a._count as any).advertisements)
      .slice(0, limit)

    return sorted.map((user) => {
      const ad = user.advertisements[0] as any
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.email?.split('@')[0] || 'Predajca'
      const image =
        ad?.images?.[0] ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
      return {
        id: user.id,
        adId: ad?.id,
        name: displayName,
        title: ad?.title || 'Služby',
        image,
        avatarUrl: (user as { avatarUrl?: string | null }).avatarUrl ?? null,
        adsCount: (user._count as any).advertisements,
        price: ad?.price ?? 0,
      }
    })
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
            sellerPlan: true,
            sellerPlanValidUntil: true,
            avatarUrl: true,
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

    const { specifications: specsRaw, ...updateRest } = updateDto as UpdateAdvertisementDto & {
      specifications?: Record<string, unknown> | null;
    };

    const categoryChanged =
      updateDto.categoryId !== undefined && updateDto.categoryId !== advertisement.categoryId;

    let specifications: Record<string, unknown> | null | undefined = undefined;
    if (categoryChanged) {
      if (specsRaw !== undefined) {
        specifications = await validateCategorySpecifications(
          updateDto.categoryId ?? null,
          specsRaw === null ? {} : (specsRaw as Record<string, unknown>),
        );
      } else {
        specifications = null;
      }
    } else if (specsRaw !== undefined) {
      specifications = await validateCategorySpecifications(
        advertisement.categoryId,
        specsRaw === null ? {} : (specsRaw as Record<string, unknown>),
      );
    }

    const data: Record<string, unknown> = {
      ...updateRest,
      images: updateDto.images !== undefined ? updateDto.images : advertisement.images,
      features: updateDto.features !== undefined ? updateDto.features : (advertisement as any).features,
      packages:
        updateDto.packages !== undefined
          ? updateDto.packages
            ? JSON.parse(JSON.stringify(updateDto.packages))
            : null
          : (advertisement as any).packages,
      faq:
        updateDto.faq !== undefined
          ? updateDto.faq
            ? JSON.parse(JSON.stringify(updateDto.faq))
            : null
          : (advertisement as any).faq,
    };
    if (specifications !== undefined) {
      data.specifications = specifications;
    }

    const updated = await prisma.advertisement.update({
      where: { id },
      data: data as any,
      include: {
        category: true,
      } as any,
    });
    await this.usersService.syncPriorityBoostsForUser(userId).catch(() => undefined);
    return updated;
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

    const deleted = await prisma.advertisement.delete({
      where: { id },
    });
    await this.usersService.syncPriorityBoostsForUser(userId).catch(() => undefined);
    return deleted;
  }

  async findByUser(userId: string) {
    return prisma.advertisement.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByCategorySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Kategória nebola nájdená');
    }

    const categoryIds = [category.id];
    const subcategories = await prisma.category.findMany({
      where: {
        parentId: category.id,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    categoryIds.push(...subcategories.map((sub) => sub.id));

    return prisma.advertisement.findMany({
      where: {
        categoryId: { in: categoryIds },
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            sellerPlan: true,
            sellerPlanValidUntil: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ priorityBoosted: 'desc' }, { createdAt: 'desc' }],
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
            avatarUrl: true,
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
            avatarUrl: true,
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

    await this.usersService.syncPriorityBoostsForUser(advertisement.userId).catch(() => undefined);

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
            avatarUrl: true,
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

    await this.usersService.syncPriorityBoostsForUser(advertisement.userId).catch(() => undefined);

    return updated;
  }
}
