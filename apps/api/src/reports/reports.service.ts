import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateReportDto, ResolveReportDto } from '@inzertna-platforma/shared';

@Injectable()
export class ReportsService {
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
    });

    if (!report) {
      throw new NotFoundException('Nahlásenie nebolo nájdené');
    }

    if (report.status !== 'PENDING') {
      throw new BadRequestException('Nahlásenie už bolo spracované');
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
