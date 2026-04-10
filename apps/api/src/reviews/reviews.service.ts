import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateReviewDto, UpdateReviewDto, ReplyToReviewDto } from '@inzertna-platforma/shared';

@Injectable()
export class ReviewsService {
  private readonly authorSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  };

  async create(authorId: string, dto: CreateReviewDto) {
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: dto.advertisementId },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    if (advertisement.userId === authorId) {
      throw new BadRequestException('Nemôžete hodnotiť vlastný inzerát');
    }

    const existing = await prisma.review.findUnique({
      where: {
        advertisementId_authorId: {
          advertisementId: dto.advertisementId,
          authorId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Tento inzerát ste už hodnotili');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Hodnotenie musí byť od 1 do 5');
    }

    return prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment || null,
        advertisementId: dto.advertisementId,
        authorId,
      },
      include: {
        author: { select: this.authorSelect },
      },
    });
  }

  async findByAdvertisement(advertisementId: string) {
    return prisma.review.findMany({
      where: { advertisementId },
      include: {
        author: { select: this.authorSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(advertisementId: string) {
    const reviews = await prisma.review.findMany({
      where: { advertisementId },
      select: { rating: true },
    });

    const count = reviews.length;
    const average = count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    return { count, average: Math.round(average * 10) / 10 };
  }

  async getUserStats(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        advertisement: { userId },
      },
      select: { rating: true },
    });

    const count = reviews.length;
    const average = count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    return { count, average: Math.round(average * 10) / 10 };
  }

  async update(reviewId: string, authorId: string, dto: UpdateReviewDto) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Recenzia nebola nájdená');
    }

    if (review.authorId !== authorId) {
      throw new ForbiddenException('Nemáte oprávnenie upraviť túto recenziu');
    }

    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
      throw new BadRequestException('Hodnotenie musí byť od 1 do 5');
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.comment !== undefined && { comment: dto.comment || null }),
      },
      include: {
        author: { select: this.authorSelect },
      },
    });
  }

  async reply(reviewId: string, userId: string, dto: ReplyToReviewDto) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { advertisement: { select: { userId: true } } },
    });

    if (!review) {
      throw new NotFoundException('Recenzia nebola nájdená');
    }

    if (review.advertisement.userId !== userId) {
      throw new ForbiddenException('Len majiteľ inzerátu môže odpovedať na recenzie');
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: {
        ownerReply: dto.reply.trim(),
        ownerReplyAt: new Date(),
      },
      include: {
        author: { select: this.authorSelect },
      },
    });
  }

  async deleteReply(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { advertisement: { select: { userId: true } } },
    });

    if (!review) {
      throw new NotFoundException('Recenzia nebola nájdená');
    }

    if (review.advertisement.userId !== userId) {
      throw new ForbiddenException('Len majiteľ inzerátu môže zmazať odpoveď');
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: {
        ownerReply: null,
        ownerReplyAt: null,
      },
      include: {
        author: { select: this.authorSelect },
      },
    });
  }

  async remove(reviewId: string, authorId: string, isAdmin = false) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Recenzia nebola nájdená');
    }

    if (!isAdmin && review.authorId !== authorId) {
      throw new ForbiddenException('Nemáte oprávnenie zmazať túto recenziu');
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return { success: true };
  }
}
