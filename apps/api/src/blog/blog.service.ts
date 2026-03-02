import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

@Injectable()
export class BlogService {
  async findAll() {
    return prisma.blogPost.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!post) {
      throw new NotFoundException('Blog príspevok nebol nájdený');
    }
    return post;
  }

  async findBySlug(slug: string) {
    const post = await prisma.blogPost.findUnique({
      where: { slug, status: 'PUBLISHED' },
    });
    if (!post) {
      throw new NotFoundException('Príspevok nebol nájdený');
    }
    return post;
  }

  async findPublished(limit?: number) {
    return prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: limit ? Math.min(limit, 50) : undefined,
    });
  }

  async create(data: {
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
    publishedAt?: Date;
  }) {
    const slug = this.normalizeSlug(data.slug);
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Príspevok s týmto slugom už existuje');
    }
    const publishedAt = data.status === 'PUBLISHED' && !data.publishedAt
      ? new Date()
      : data.publishedAt;
    return prisma.blogPost.create({
      data: {
        ...data,
        slug,
        status: data.status || 'DRAFT',
        publishedAt,
      },
    });
  }

  async update(
    id: string,
    data: {
      slug?: string;
      title?: string;
      excerpt?: string;
      content?: string;
      featuredImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      status?: string;
      publishedAt?: Date;
    },
  ) {
    await this.findOne(id);
    const updateData: any = { ...data };
    if (data.slug) {
      updateData.slug = this.normalizeSlug(data.slug);
    }
    if (data.status === 'PUBLISHED' && !data.publishedAt) {
      const existing = await prisma.blogPost.findUnique({ where: { id } });
      if (existing && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    return prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.blogPost.delete({
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
