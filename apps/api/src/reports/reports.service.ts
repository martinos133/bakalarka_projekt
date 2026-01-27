import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateReportDto, ResolveReportDto, MessageType } from '@inzertna-platforma/shared';
import { UsersService } from '../users/users.service';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
  ) {}
  async create(reporterId: string, createDto: CreateReportDto) {
    // Skontroluj, či inzerát existuje
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: createDto.advertisementId },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    // Skontroluj, či používateľ už nahlásil tento inzerát
    const existingReport = await prisma.report.findFirst({
      where: {
        advertisementId: createDto.advertisementId,
        reporterId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      throw new BadRequestException('Tento inzerát ste už nahlásili');
    }

    return prisma.report.create({
      data: {
        ...createDto,
        reporterId,
      },
      include: {
        advertisement: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            category: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAllPending() {
    return prisma.report.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        advertisement: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            category: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAll() {
    return prisma.report.findMany({
      include: {
        advertisement: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            category: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        advertisement: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            category: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Nahlásenie nebolo nájdené');
    }

    return report;
  }

  async resolve(id: string, adminId: string, resolveDto: ResolveReportDto) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        advertisement: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Nahlásenie nebolo nájdené');
    }

    if (report.status !== 'PENDING') {
      throw new BadRequestException('Nahlásenie už bolo spracované');
    }

    // Ak má byť používateľ zabanovaný
    if (resolveDto.status === 'RESOLVED' && resolveDto.banUser && report.advertisement) {
      const userId = report.advertisement.userId;
      let bannedUntil: Date | null = null;

      if (resolveDto.banDuration === 'permanent') {
        bannedUntil = null;
      } else if (resolveDto.banDuration && resolveDto.banDurationValue) {
        const now = new Date();
        const durationMs = {
          minutes: resolveDto.banDurationValue * 60 * 1000,
          hours: resolveDto.banDurationValue * 60 * 60 * 1000,
          days: resolveDto.banDurationValue * 24 * 60 * 60 * 1000,
          months: resolveDto.banDurationValue * 30 * 24 * 60 * 60 * 1000,
        }[resolveDto.banDuration];

        if (durationMs) {
          bannedUntil = new Date(now.getTime() + durationMs);
        }
      }

      const banReason = resolveDto.banReason || `Nahlásenie inzerátu: ${resolveDto.resolutionNote || 'Bez poznámky'}`;
      
      await this.usersService.banUser(userId, {
        banned: true,
        bannedUntil,
        banReason,
      });

      // Vytvor systémovú správu o banu
      const banDurationText = resolveDto.banDuration === 'permanent' 
        ? 'trvalo' 
        : `${resolveDto.banDurationValue} ${resolveDto.banDuration === 'minutes' ? 'minút' : resolveDto.banDuration === 'hours' ? 'hodín' : resolveDto.banDuration === 'days' ? 'dní' : 'mesiacov'}`;
      
      await this.messagesService.createSystemMessage(
        userId,
        'BAN_NOTIFICATION' as any,
        'Váš účet bol zabanovaný',
        `Váš účet bol zabanovaný na dobu ${banDurationText}.\n\nDôvod: ${banReason}\n\n${resolveDto.resolutionNote ? `Poznámka: ${resolveDto.resolutionNote}` : ''}`,
        {
          banDuration: resolveDto.banDuration,
          banDurationValue: resolveDto.banDurationValue,
          bannedUntil: bannedUntil?.toISOString(),
        },
      );
    }

    return prisma.report.update({
      where: { id },
      data: {
        status: resolveDto.status,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolutionNote: resolveDto.resolutionNote,
      },
      include: {
        advertisement: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            category: true,
          },
        },
        reporter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteAdvertisement(id: string, reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Nahlásenie nebolo nájdené');
    }

    // Odstráň inzerát
    await prisma.advertisement.delete({
      where: { id },
    });

    // Označ všetky reporty pre tento inzerát ako resolved
    await prisma.report.updateMany({
      where: {
        advertisementId: id,
        status: 'PENDING',
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    return { success: true };
  }
}
