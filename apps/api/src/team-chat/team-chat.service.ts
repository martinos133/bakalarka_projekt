import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  lastLoginAt: true,
};

@Injectable()
export class TeamChatService {
  async getConversations(userId: string) {
    const conversations = await prisma.teamConversation.findMany({
      where: {
        OR: [{ participantA: userId }, { participantB: userId }],
      },
      include: {
        userA: { select: userSelect },
        userB: { select: userSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations.map((c) => {
      const partner = c.participantA === userId ? c.userB : c.userA;
      const lastMsg = c.messages[0] || null;
      return {
        id: c.id,
        partner,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              senderId: lastMsg.senderId,
              createdAt: lastMsg.createdAt,
              read: !!lastMsg.readAt,
            }
          : null,
        createdAt: c.createdAt,
      };
    });
  }

  async getUnreadCounts(userId: string) {
    const conversations = await prisma.teamConversation.findMany({
      where: {
        OR: [{ participantA: userId }, { participantB: userId }],
      },
      select: { id: true },
    });

    const counts: Record<string, number> = {};
    let total = 0;

    for (const conv of conversations) {
      const count = await prisma.teamMessage.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          readAt: null,
        },
      });
      counts[conv.id] = count;
      total += count;
    }

    return { counts, total };
  }

  async getOrCreateConversation(userId: string, partnerId: string) {
    if (!partnerId || !userId) {
      throw new ForbiddenException('Chýba userId alebo partnerId');
    }
    if (userId === partnerId) {
      throw new ForbiddenException('Nemôžete chatovať sám so sebou');
    }

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, role: true },
    });
    if (!partner || partner.role !== 'ADMIN') {
      throw new NotFoundException('Člen tímu nebol nájdený');
    }

    const [a, b] = [userId, partnerId].sort();

    let conversation = await prisma.teamConversation.findUnique({
      where: { participantA_participantB: { participantA: a, participantB: b } },
    });

    if (!conversation) {
      conversation = await prisma.teamConversation.create({
        data: { participantA: a, participantB: b },
      });
    }

    return conversation;
  }

  async getMessages(userId: string, conversationId: string, cursor?: string) {
    const conv = await prisma.teamConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Konverzácia neexistuje');
    if (conv.participantA !== userId && conv.participantB !== userId) {
      throw new ForbiddenException('Nemáte prístup k tejto konverzácii');
    }

    const take = 50;
    const messages = await prisma.teamMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      include: {
        sender: { select: userSelect },
      },
    });

    const hasMore = messages.length > take;
    if (hasMore) messages.pop();

    await prisma.teamMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return {
      messages: messages.reverse(),
      hasMore,
      nextCursor: hasMore ? messages[0]?.id : null,
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
    attachments?: any[],
  ) {
    const conv = await prisma.teamConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Konverzácia neexistuje');
    if (conv.participantA !== userId && conv.participantB !== userId) {
      throw new ForbiddenException('Nemáte prístup k tejto konverzácii');
    }

    const [message] = await prisma.$transaction([
      prisma.teamMessage.create({
        data: {
          content: (content || '').trim(),
          senderId: userId,
          conversationId,
          ...(attachments?.length ? { attachments } : {}),
        },
        include: {
          sender: { select: userSelect },
        },
      }),
      prisma.teamConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  async markAsRead(userId: string, conversationId: string) {
    const conv = await prisma.teamConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Konverzácia neexistuje');
    if (conv.participantA !== userId && conv.participantB !== userId) {
      throw new ForbiddenException('Nemáte prístup k tejto konverzácii');
    }

    await prisma.teamMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  async getTeamMembers(userId: string) {
    return prisma.user.findMany({
      where: {
        role: 'ADMIN',
        id: { not: userId },
      },
      select: userSelect,
      orderBy: { firstName: 'asc' },
    });
  }
}
