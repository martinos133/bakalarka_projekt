import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateCategoryDto, UpdateCategoryDto } from '@inzertna-platforma/shared';

@Injectable()
export class CategoriesService {
  async create(createDto: CreateCategoryDto) {
    // Vytvor slug z názvu
    const slug = createDto.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Skontroluj, či už existuje kategória s týmto názvom alebo slugom
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: createDto.name },
          { slug },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Kategória s týmto názvom už existuje');
    }

    // Ak je parentId prázdny string, nastav ho na null
    const parentId = createDto.parentId && createDto.parentId.trim() !== '' 
      ? createDto.parentId 
      : null;

    // Skontroluj, či parentId existuje (ak nie je null)
    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parentExists) {
        throw new NotFoundException('Nadradená kategória nebola nájdená');
      }
    }

    return prisma.category.create({
      data: {
        ...createDto,
        slug: createDto.slug || slug,
        parentId,
        status: createDto.status || 'ACTIVE',
      },
    });
  }

  async findAll() {
    return prisma.category.findMany({
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                advertisements: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        filters: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            advertisements: true,
            filters: true,
          },
        },
      },
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findActive() {
    return prisma.category.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        parent: true,
        children: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            _count: {
              select: {
                advertisements: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        filters: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            advertisements: true,
            filters: true,
          },
        },
      },
      orderBy: [
        { parentId: 'asc' },
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategória nebola nájdená');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            _count: {
              select: {
                advertisements: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            advertisements: true,
            filters: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategória nebola nájdená');
    }

    if (category.status !== 'ACTIVE') {
      throw new NotFoundException('Kategória nie je aktívna');
    }

    return category;
  }

  async update(id: string, updateDto: UpdateCategoryDto) {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Kategória nebola nájdená');
    }

    // Ak sa mení názov, vytvor nový slug
    let slug = category.slug;
    if (updateDto.name && updateDto.name !== category.name) {
      slug = updateDto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Skontroluj, či už existuje kategória s týmto slugom
      const existing = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Kategória s týmto názvom už existuje');
      }
    }

    // Ak je parentId prázdny string, nastav ho na null
    let parentId = updateDto.parentId;
    if (parentId !== undefined) {
      parentId = parentId && parentId.trim() !== '' ? parentId : null;
      
      // Skontroluj, či parentId existuje (ak nie je null) a nie je to tá istá kategória
      if (parentId) {
        if (parentId === id) {
          throw new ConflictException('Kategória nemôže byť sama sebe nadradená');
        }
        const parentExists = await prisma.category.findUnique({
          where: { id: parentId },
        });
        if (!parentExists) {
          throw new NotFoundException('Nadradená kategória nebola nájdená');
        }
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...updateDto,
        ...(slug !== category.slug && { slug }),
        ...(parentId !== undefined && { parentId }),
      },
    });
  }

  async remove(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategória nebola nájdená');
    }

    // Ak má kategória inzeráty, len ju deaktivujeme
    if (category._count.advertisements > 0) {
      return prisma.category.update({
        where: { id },
        data: {
          status: 'INACTIVE',
        },
      });
    }

    // Ak nemá inzeráty, môžeme ju odstrániť
    return prisma.category.delete({
      where: { id },
    });
  }

  async updateOrder(categoryIds: string[], parentId?: string) {
    // Ak je zadaný parentId, aktualizuj len podkategórie tejto hlavnej kategórie
    if (parentId) {
      // Skontroluj, či všetky kategórie patria k tejto hlavnej kategórii
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
        include: { children: true },
      });

      if (!parentCategory) {
        throw new NotFoundException('Nadradená kategória nebola nájdená');
      }

      const childIds = parentCategory.children.map(c => c.id);
      const allValid = categoryIds.every(id => childIds.includes(id));
      
      if (!allValid) {
        throw new ConflictException('Niektoré kategórie nepatria k tejto nadradenej kategórii');
      }

      // Aktualizuj order len pre podkategórie
      const updates = categoryIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { order: index },
        })
      );

      await Promise.all(updates);
    } else {
      // Aktualizuj order pre hlavné kategórie
      // Skontroluj, či všetky kategórie sú hlavné (nemajú parentId)
      const mainCategories = await prisma.category.findMany({
        where: { parentId: null },
      });

      const mainCategoryIds = mainCategories.map(c => c.id);
      const allValid = categoryIds.every(id => mainCategoryIds.includes(id));
      
      if (!allValid) {
        throw new ConflictException('Niektoré kategórie nie sú hlavné kategórie');
      }

      // Aktualizuj order pre hlavné kategórie
      const updates = categoryIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { order: index },
        })
      );

      await Promise.all(updates);
    }

    return this.findAll();
  }
}
