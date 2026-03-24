import { Injectable } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

const SUGGESTIONS_LIMIT = 5;

@Injectable()
export class SearchService {
  async getSuggestions(q: string) {
    const query = q.trim();
    if (query.length < 3) {
      return { categories: [], advertisements: [] };
    }

    const [categories, advertisements] = await Promise.all([
      prisma.category.findMany({
        where: {
          status: 'ACTIVE' as any,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        take: SUGGESTIONS_LIMIT,
      }),
      prisma.advertisement.findMany({
        where: {
          status: 'ACTIVE' as any,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
        },
        orderBy: [{ priorityBoosted: 'desc' }, { createdAt: 'desc' }],
        take: SUGGESTIONS_LIMIT,
      }),
    ]);

    return { categories, advertisements };
  }
}
