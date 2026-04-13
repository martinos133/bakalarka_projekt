import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '@inzertna-platforma/database';
import {
  CreatePlatformTestimonialDto,
  UpdatePlatformTestimonialDto,
  PlatformTestimonialPublic,
} from '@inzertna-platforma/shared';

@Injectable()
export class PlatformTestimonialsService {
  private readonly userSelect = {
    firstName: true,
    lastName: true,
    avatarUrl: true,
    companyName: true,
    isCompany: true,
    banned: true,
    bannedUntil: true,
  };

  private assertNotBanned(user: { banned: boolean; bannedUntil: Date | null }) {
    if (!user.banned) return;
    if (user.bannedUntil && user.bannedUntil < new Date()) return;
    throw new ForbiddenException('Účet nemôže pridávať referencie');
  }

  private validateRating(rating: number) {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new BadRequestException('Hodnotenie musí byť celé číslo od 1 do 5');
    }
  }

  private validateComment(comment: string) {
    const t = comment.trim();
    if (t.length < 10) {
      throw new BadRequestException('Text musí mať aspoň 10 znakov');
    }
    if (t.length > 4000) {
      throw new BadRequestException('Text môže mať najviac 4000 znakov');
    }
    return t;
  }

  /** Chýbajúca tabuľka po `schema.prisma` bez aplikovanej migrácie na danú DB. */
  private handleMissingPlatformTable(e: unknown): void {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return;
    const msg = e.message ?? '';
    if (
      e.code === 'P2021' ||
      (/PlatformTestimonial/i.test(msg) && /does not exist/i.test(msg))
    ) {
      throw new ServiceUnavailableException(
        'Databáza nemá tabuľku pre referencie. V priečinku packages/database spustite: npx dotenv -e ../../.env -- prisma migrate deploy',
      );
    }
  }

  private mapPublic(row: {
    id: string;
    rating: number;
    comment: string;
    roleLabel: string | null;
    createdAt: Date;
    user: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      companyName: string | null;
      isCompany: boolean;
    };
  }): PlatformTestimonialPublic {
    return {
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      roleLabel: row.roleLabel,
      createdAt: row.createdAt.toISOString(),
      author: {
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        avatarUrl: row.user.avatarUrl,
        companyName: row.user.companyName,
        isCompany: row.user.isCompany,
      },
    };
  }

  async findPublic(): Promise<PlatformTestimonialPublic[]> {
    let rows;
    try {
      rows = await prisma.platformTestimonial.findMany({
        where: { approved: true },
        include: { user: { select: this.userSelect } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (e) {
      this.handleMissingPlatformTable(e);
      throw e;
    }
    return rows
      .filter((r) => {
        const u = r.user;
        if (!u.banned) return true;
        if (u.bannedUntil && u.bannedUntil < new Date()) return true;
        return false;
      })
      .map((r) =>
        this.mapPublic({
          ...r,
          user: {
            firstName: r.user.firstName,
            lastName: r.user.lastName,
            avatarUrl: r.user.avatarUrl,
            companyName: r.user.companyName,
            isCompany: r.user.isCompany,
          },
        }),
      );
  }

  async findMine(userId: string): Promise<PlatformTestimonialPublic | null> {
    let row;
    try {
      row = await prisma.platformTestimonial.findUnique({
        where: { userId },
        include: { user: { select: this.userSelect } },
      });
    } catch (e) {
      this.handleMissingPlatformTable(e);
      throw e;
    }
    if (!row) return null;
    return this.mapPublic(row);
  }

  async create(userId: string, dto: CreatePlatformTestimonialDto): Promise<PlatformTestimonialPublic> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }
    this.assertNotBanned(user);

    let existing;
    try {
      existing = await prisma.platformTestimonial.findUnique({ where: { userId } });
    } catch (e) {
      this.handleMissingPlatformTable(e);
      throw e;
    }
    if (existing) {
      throw new ConflictException('Referenciu už máte — upravte ju cez úpravu.');
    }

    this.validateRating(dto.rating);
    const comment = this.validateComment(dto.comment);

    const roleLabel =
      dto.roleLabel != null && dto.roleLabel.trim() !== '' ? dto.roleLabel.trim().slice(0, 200) : null;

    let row;
    try {
      row = await prisma.platformTestimonial.create({
        data: {
          userId,
          rating: dto.rating,
          comment,
          roleLabel,
          approved: true,
        },
        include: { user: { select: this.userSelect } },
      });
    } catch (e) {
      this.handleMissingPlatformTable(e);
      throw e;
    }

    return this.mapPublic(row);
  }

  async update(userId: string, dto: UpdatePlatformTestimonialDto): Promise<PlatformTestimonialPublic> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }
    this.assertNotBanned(user);

    let existing;
    try {
      existing = await prisma.platformTestimonial.findUnique({ where: { userId } });
    } catch (e) {
      this.handleMissingPlatformTable(e);
      throw e;
    }
    if (!existing) {
      throw new NotFoundException('Nemáte uloženú referenciu');
    }

    const data: { rating?: number; comment?: string; roleLabel?: string | null } = {};

    if (dto.rating !== undefined) {
      this.validateRating(dto.rating);
      data.rating = dto.rating;
    }
    if (dto.comment !== undefined) {
      data.comment = this.validateComment(dto.comment);
    }
    if (dto.roleLabel !== undefined) {
      const t = dto.roleLabel.trim();
      data.roleLabel = t === '' ? null : t.slice(0, 200);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Nič na úpravu');
    }

    let row;
    try {
      row = await prisma.platformTestimonial.update({
        where: { userId },
        data,
        include: { user: { select: this.userSelect } },
      });
    } catch (e) {
      this.handleMissingPlatformTable(e);
      throw e;
    }

    return this.mapPublic(row);
  }
}
