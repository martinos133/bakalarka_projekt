import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

@Injectable()
export class UsersService {
  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }

    return user;
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
