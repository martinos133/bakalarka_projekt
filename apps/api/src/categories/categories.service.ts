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

    return prisma.category.create({
      data: {
        ...createDto,
        slug,
      },
    });
  }

  async findAll() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findActive() {
    return prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
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

    return prisma.category.update({
      where: { id },
      data: {
        ...updateDto,
        ...(slug !== category.slug && { slug }),
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
          isActive: false,
        },
      });
    }

    // Ak nemá inzeráty, môžeme ju odstrániť
    return prisma.category.delete({
      where: { id },
    });
  }
}
