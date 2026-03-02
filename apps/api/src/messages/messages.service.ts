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
      OR: [{ recipientId: userId }, { senderId: userId, type: 'INQUIRY' as any }],
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const all = await prisma.message.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const inquiryIds = new Set<string>()
    const result: typeof all = []
    for (const m of all) {
      if (m.type === 'INQUIRY') {
        const rootId = (m as any).parentId || m.id
        if (inquiryIds.has(rootId)) continue
        inquiryIds.add(rootId)
      }
      result.push(m)
    }
    return result
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

  async getConversation(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
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

    const rootId = message.parentId || message.id;
    const root = await prisma.message.findUnique({
      where: { id: rootId },
    });

    if (!root) {
      throw new NotFoundException('Konverzácia nebola nájdená');
    }

    const isParticipant =
      root.senderId === userId || root.recipientId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('Nemáte oprávnenie zobraziť túto konverzáciu');
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ id: rootId }, { parentId: rootId }],
      },
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
      orderBy: { createdAt: 'asc' },
    });

    for (const msg of messages) {
      if (msg.recipientId === userId && msg.status !== 'READ') {
        await prisma.message.update({
          where: { id: msg.id },
          data: { status: 'READ' as any, readAt: new Date() },
        });
      }
    }

    return messages.map((m) => ({
      ...m,
      status: m.recipientId === userId ? 'READ' : m.status,
    }));
  }

  async createReply(
    userId: string,
    parentId: string,
    content: string,
    attachments: string[] = [],
  ) {
    const parent = await prisma.message.findUnique({
      where: { id: parentId },
      include: {
        advertisement: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Správa nebola nájdená');
    }

    const rootId = parent.parentId || parent.id;
    const root = await prisma.message.findUnique({
      where: { id: rootId },
    });

    if (!root) {
      throw new NotFoundException('Koreňová správa nebola nájdená');
    }

    const isParticipant =
      root.senderId === userId || root.recipientId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('Nemáte oprávnenie odpovedať na túto správu');
    }

    const recipientId =
      parent.senderId === userId ? parent.recipientId : parent.senderId;

    if (!recipientId) {
      throw new ForbiddenException('Nemôžete odpovedať na túto správu');
    }

    const safeAttachments = Array.isArray(attachments)
      ? attachments.slice(0, 5).filter((a) => typeof a === 'string' && a.length < 5_000_000)
      : [];

    return prisma.message.create({
      data: {
        type: 'INQUIRY' as any,
        subject: parent.subject,
        content: content.trim(),
        recipientId,
        senderId: userId,
        advertisementId: parent.advertisementId,
        parentId: rootId,
        attachments: safeAttachments,
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
