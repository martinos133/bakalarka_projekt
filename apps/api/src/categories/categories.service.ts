import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma, Prisma } from '@inzertna-platforma/database';
import { CreateCategoryDto, UpdateCategoryDto } from '@inzertna-platforma/shared';

type CategoryDelegate = (typeof prisma)['category'];

@Injectable()
export class CategoriesService {
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /** Slug je globálne jedinečný; pri kolízii pridá `-2`, `-3`, … */
  private async ensureUniqueSlug(
    db: { category: CategoryDelegate },
    base: string,
    excludeCategoryId?: string,
  ): Promise<string> {
    let slug = base;
    let n = 0;
    for (;;) {
      const existing = await db.category.findFirst({
        where: {
          slug,
          ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {}),
        },
      });
      if (!existing) return slug;
      n += 1;
      slug = `${base}-${n}`;
    }
  }

  async create(createDto: CreateCategoryDto) {
    const parentId =
      createDto.parentId && createDto.parentId.trim() !== '' ? createDto.parentId.trim() : null;

    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parentExists) {
        throw new NotFoundException('Nadradená kategória nebola nájdená');
      }
    }

    const nameDup = await prisma.category.findFirst({
      where: parentId
        ? { parentId, name: createDto.name }
        : { parentId: null, name: createDto.name },
    });
    if (nameDup) {
      throw new ConflictException(
        parentId
          ? 'Podkategória s týmto názvom už v tejto kategórii existuje.'
          : 'Hlavná kategória s týmto názvom už existuje.',
      );
    }

    const baseSlug =
      createDto.slug && createDto.slug.trim() !== ''
        ? CategoriesService.slugify(createDto.slug.trim())
        : CategoriesService.slugify(createDto.name);

    let finalSlug: string;
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Nadradená kategória nebola nájdená');
      finalSlug = await this.ensureUniqueSlug(prisma, `${parent.slug}-${baseSlug}`);
    } else {
      finalSlug = await this.ensureUniqueSlug(prisma, baseSlug);
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const created = await tx.category.create({
          data: {
            ...createDto,
            slug: finalSlug,
            parentId,
            status: createDto.status || 'ACTIVE',
          },
        });

        if (!parentId) {
          const hasOstatne = await tx.category.findFirst({
            where: { parentId: created.id, name: 'Ostatné' },
          });
          if (!hasOstatne) {
            const oSlug = await this.ensureUniqueSlug(tx, `${created.slug}-ostatne`);
            await tx.category.create({
              data: {
                name: 'Ostatné',
                slug: oSlug,
                parentId: created.id,
                status: 'ACTIVE',
                order: 9999,
              },
            });
          }
        }

        return created;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const targets = ((e.meta as { target?: string[] })?.target ?? []).map(String);
        if (targets.some((t) => t.includes('name'))) {
          throw new ConflictException(
            'Databáza má ešte starú schému (globálne jedinečný názov kategórie). V priečinku packages/database spustite: npm run db:push — alebo prisma migrate deploy — potom reštartujte API.',
          );
        }
      }
      throw e;
    }
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
        parent: {
          include: {
            children: {
              where: { status: 'ACTIVE' },
              include: {
                _count: { select: { advertisements: true } },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
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

    const nameChanged =
      updateDto.name !== undefined && updateDto.name !== category.name;

    if (nameChanged && updateDto.name) {
      const pid = category.parentId;
      const dup = await prisma.category.findFirst({
        where: pid
          ? { parentId: pid, name: updateDto.name, id: { not: id } }
          : { parentId: null, name: updateDto.name, id: { not: id } },
      });
      if (dup) {
        throw new ConflictException(
          pid
            ? 'Podkategória s týmto názvom už v tejto kategórii existuje.'
            : 'Hlavná kategória s týmto názvom už existuje.',
        );
      }
    }

    let slug = category.slug;
    const slugFromBody =
      updateDto.slug !== undefined && String(updateDto.slug).trim() !== ''
        ? CategoriesService.slugify(String(updateDto.slug).trim())
        : null;

    if (slugFromBody !== null) {
      slug = await this.ensureUniqueSlug(prisma, slugFromBody, id);
    } else if (nameChanged && updateDto.name) {
      const base = CategoriesService.slugify(updateDto.name);
      if (category.parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: category.parentId },
        });
        if (!parent) {
          throw new NotFoundException('Nadradená kategória nebola nájdená');
        }
        slug = await this.ensureUniqueSlug(prisma, `${parent.slug}-${base}`, id);
      } else {
        slug = await this.ensureUniqueSlug(prisma, base, id);
      }
    }

    let parentId = updateDto.parentId;
    if (parentId !== undefined) {
      parentId = parentId && parentId.trim() !== '' ? parentId : null;

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

    try {
      return await prisma.category.update({
        where: { id },
        data: {
          ...updateDto,
          ...(slug !== category.slug && { slug }),
          ...(parentId !== undefined && { parentId }),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const targets = ((e.meta as { target?: string[] })?.target ?? []).map(String);
        if (targets.some((t) => t.includes('name'))) {
          throw new ConflictException(
            'Databáza má ešte starú schému (globálne jedinečný názov). Spustite npm run db:push v packages/database a reštartujte API.',
          );
        }
      }
      throw e;
    }
  }

  async remove(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Kategória nebola nájdená');
    }

    // Natrvalo odstrániť kategóriu. Inzeráty majú categoryId optional + FK onDelete: SetNull,
    // podkategórie a filtre rieši schéma (Cascade). Admin očakáva, že riadok zo zoznamu zmizne.
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
