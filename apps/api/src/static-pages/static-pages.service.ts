import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

@Injectable()
export class StaticPagesService {
  async findAll() {
    return prisma.staticPage.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const page = await prisma.staticPage.findUnique({
      where: { id },
    });
    if (!page) {
      throw new NotFoundException('Statická stránka nebola nájdená');
    }
    return page;
  }

  async findBySlug(slug: string) {
    const page = await prisma.staticPage.findUnique({
      where: { slug, status: 'PUBLISHED' },
    });
    if (!page) {
      throw new NotFoundException('Stránka nebola nájdená');
    }
    return page;
  }

  async create(data: {
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
    order?: number;
  }) {
    const slug = this.normalizeSlug(data.slug);
    const existing = await prisma.staticPage.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Stránka s týmto slugom už existuje');
    }
    return prisma.staticPage.create({
      data: {
        ...data,
        slug,
        status: data.status || 'DRAFT',
        order: data.order ?? 0,
      },
    });
  }

  async update(
    id: string,
    data: {
      slug?: string;
      title?: string;
      content?: string;
      metaTitle?: string;
      metaDescription?: string;
      status?: string;
      order?: number;
    },
  ) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.slug) {
      updateData.slug = this.normalizeSlug(data.slug);
    }
    return prisma.staticPage.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.staticPage.delete({
      where: { id },
    });
  }

  private normalizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .trim()
      .replace(/^\//, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
