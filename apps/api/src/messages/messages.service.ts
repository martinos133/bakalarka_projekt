import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { CreateMessageDto, CreateInquiryDto, MessageType, MessageStatus } from '@inzertna-platforma/shared';

@Injectable()
export class MessagesService {
  async create(userId: string, createDto: CreateMessageDto) {
    return prisma.message.create({
      data: {
        ...createDto,
        senderId: createDto.senderId || userId,
      } as any,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        advertisement: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
    });
  }

  async createInquiry(userId: string, createDto: CreateInquiryDto) {
    // Získaj informácie o inzeráte
    const advertisement = await prisma.advertisement.findUnique({
      where: { id: createDto.advertisementId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!advertisement) {
      throw new NotFoundException('Inzerát nebol nájdený');
    }

    // Vytvor správu pre majiteľa inzerátu
    return prisma.message.create({
      data: {
        type: 'INQUIRY' as any,
        subject: createDto.subject,
        content: createDto.content,
        recipientId: advertisement.userId,
        senderId: userId,
        advertisementId: createDto.advertisementId,
      } as any,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        advertisement: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
    });
  }

  async findAllForAdmin(status?: MessageStatus, type?: MessageType) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    return prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        advertisement: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(userId: string, status?: MessageStatus, type?: MessageType) {
    const where: any = {
      recipientId: userId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    return prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        advertisement: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        advertisement: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Správa nebola nájdená');
    }

    if (message.recipientId !== userId) {
      throw new ForbiddenException('Nemáte oprávnenie zobraziť túto správu');
    }

    // Označ správu ako prečítanú, ak ešte nie je
    if (message.status !== 'READ') {
      await prisma.message.update({
        where: { id },
        data: {
          status: 'READ' as any,
          readAt: new Date(),
        },
      });
    }

    return {
      ...message,
      status: 'READ' as any,
      readAt: message.readAt || new Date(),
    };
  }

  async markAsRead(userId: string, id: string) {
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Správa nebola nájdená');
    }

    if (message.recipientId !== userId) {
      throw new ForbiddenException('Nemáte oprávnenie upraviť túto správu');
    }

    return prisma.message.update({
      where: { id },
      data: {
        status: 'READ' as any,
        readAt: new Date(),
      },
    });
  }

  async markAsArchived(userId: string, id: string) {
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Správa nebola nájdená');
    }

    if (message.recipientId !== userId) {
      throw new ForbiddenException('Nemáte oprávnenie upraviť túto správu');
    }

    return prisma.message.update({
      where: { id },
      data: {
        status: 'ARCHIVED' as any,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.message.count({
      where: {
        recipientId: userId,
        status: 'UNREAD' as any,
      },
    });
  }

  async createSystemMessage(recipientId: string, type: MessageType, subject: string, content: string, metadata?: any) {
    return prisma.message.create({
      data: {
        type: type as any,
        subject,
        content,
        recipientId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      } as any,
    });
  }
}
