import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import * as bcrypt from 'bcrypt';

export const ALL_PERMISSIONS = [
  'dashboard',
  'advertisements',
  'users',
  'categories',
  'specifications',
  'monitoring',
  'contact_forms',
  'pending',
  'reported',
  'static_pages',
  'blog',
  'organizer',
  'team_chat',
  'settings',
  'audit',
  'seo',
  'staff',
  'dev_categories',
  'dev_advertisements',
  'dev_menu',
  'dev_components',
  'dev_config',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const staffSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  adminPermissions: true,
  banned: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class StaffService {
  async findAll() {
    return prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: staffSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: staffSelect,
    });
    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Člen tímu nebol nájdený');
    }
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    permissions: string[];
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('Tento email je už registrovaný');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: 'ADMIN',
        adminPermissions: data.permissions,
      },
      select: staffSelect,
    });
  }

  async updatePermissions(id: string, requesterId: string, permissions: string[]) {
    if (id === requesterId) {
      throw new ForbiddenException('Nemôžete meniť vlastné oprávnenia');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Člen tímu nebol nájdený');
    }

    return prisma.user.update({
      where: { id },
      data: { adminPermissions: permissions },
      select: staffSelect,
    });
  }

  async resetPassword(id: string, requesterId: string, newPassword: string) {
    if (id === requesterId) {
      throw new ForbiddenException('Na zmenu vlastného hesla použite nastavenia');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Člen tímu nebol nájdený');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { success: true };
  }

  async remove(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException('Nemôžete zmazať vlastný účet');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'ADMIN') {
      throw new NotFoundException('Člen tímu nebol nájdený');
    }

    await prisma.user.update({
      where: { id },
      data: { role: 'USER', adminPermissions: null as any },
    });

    return { success: true };
  }

  hasPermission(adminPermissions: unknown, permission: string): boolean {
    if (!adminPermissions) return true;
    if (!Array.isArray(adminPermissions)) return true;
    return adminPermissions.includes(permission);
  }
}
