import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateFilterDto, UpdateFilterDto, FilterType } from '@inzertna-platforma/shared';

@Injectable()
export class FiltersService {
  async create(createDto: CreateFilterDto) {
    // Vytvor slug z názvu
    const slug = createDto.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Skontroluj, či kategória existuje
    const category = await prisma.category.findUnique({
      where: { id: createDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Kategória nebola nájdená');
    }

    // Skontroluj, či už existuje filter s týmto slugom v tejto kategórii
    const existing = await prisma.filter.findUnique({
      where: {
        categoryId_slug: {
          categoryId: createDto.categoryId,
          slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Filter s týmto názvom už existuje v tejto kategórii');
    }

    // Validácia: SELECT a MULTISELECT musia mať options
    if (
      (createDto.type === FilterType.SELECT || createDto.type === FilterType.MULTISELECT) &&
      (!createDto.options || createDto.options.length === 0)
    ) {
      throw new BadRequestException('SELECT a MULTISELECT filtre musia mať definované možnosti');
    }

    return prisma.filter.create({
      data: {
        ...createDto,
        slug,
        options: createDto.options || [],
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(categoryId?: string) {
    return prisma.filter.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findActive(categoryId?: string) {
    return prisma.filter.findMany({
      where: {
        isActive: true,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const filter = await prisma.filter.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!filter) {
      throw new NotFoundException('Filter nebol nájdený');
    }

    return filter;
  }

  async update(id: string, updateDto: UpdateFilterDto) {
    const filter = await prisma.filter.findUnique({
      where: { id },
    });

    if (!filter) {
      throw new NotFoundException('Filter nebol nájdený');
    }

    // Ak sa mení názov, vytvor nový slug
    let slug = filter.slug;
    if (updateDto.name && updateDto.name !== filter.name) {
      slug = updateDto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Skontroluj, či už existuje filter s týmto slugom v tejto kategórii
      const existing = await prisma.filter.findUnique({
        where: {
          categoryId_slug: {
            categoryId: filter.categoryId,
            slug,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Filter s týmto názvom už existuje v tejto kategórii');
      }
    }

    // Validácia: SELECT a MULTISELECT musia mať options
    const newType = updateDto.type || filter.type;
    const newOptions = updateDto.options !== undefined ? updateDto.options : filter.options;
    
    if (
      (newType === FilterType.SELECT || newType === FilterType.MULTISELECT) &&
      (!newOptions || newOptions.length === 0)
    ) {
      throw new BadRequestException('SELECT a MULTISELECT filtre musia mať definované možnosti');
    }

    return prisma.filter.update({
      where: { id },
      data: {
        ...updateDto,
        ...(slug !== filter.slug && { slug }),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    const filter = await prisma.filter.findUnique({
      where: { id },
    });

    if (!filter) {
      throw new NotFoundException('Filter nebol nájdený');
    }

    return prisma.filter.delete({
      where: { id },
    });
  }
}
