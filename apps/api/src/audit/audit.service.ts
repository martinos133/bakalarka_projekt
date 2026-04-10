import { Injectable } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { AuditAction, AuditSeverity, Prisma } from '@prisma/client';

export interface AuditEntry {
  action: AuditAction;
  severity?: AuditSeverity;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  async log(entry: AuditEntry) {
    try {
      await prisma.auditLog.create({
        data: {
          action: entry.action,
          severity: entry.severity || AuditSeverity.INFO,
          userId: entry.userId || null,
          userEmail: entry.userEmail || null,
          ip: entry.ip || null,
          userAgent: entry.userAgent ? entry.userAgent.substring(0, 500) : null,
          resource: entry.resource || null,
          resourceId: entry.resourceId || null,
          details: entry.details ? (entry.details as any) : undefined,
          success: entry.success ?? true,
          errorMessage: entry.errorMessage || null,
        },
      });
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err);
    }
  }

  async getLogs(params: {
    page?: number;
    limit?: number;
    action?: AuditAction;
    severity?: AuditSeverity;
    userId?: string;
    success?: boolean;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 200);
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (params.action) where.action = params.action;
    if (params.severity) where.severity = params.severity;
    if (params.userId) where.userId = params.userId;
    if (params.success !== undefined) where.success = params.success;

    if (params.search) {
      where.OR = [
        { userEmail: { contains: params.search, mode: 'insensitive' } },
        { resource: { contains: params.search, mode: 'insensitive' } },
        { errorMessage: { contains: params.search, mode: 'insensitive' } },
        { ip: { contains: params.search } },
      ];
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo + 'T23:59:59.999Z');
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalToday,
      loginsToday,
      failedLoginsToday,
      errorsToday,
      totalWeek,
      errorsWeek,
      recentErrors,
      loginsByDay,
    ] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { action: 'LOGIN_SUCCESS', createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { severity: { in: ['ERROR', 'CRITICAL'] }, createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.auditLog.count({ where: { severity: { in: ['ERROR', 'CRITICAL'] }, createdAt: { gte: weekAgo } } }),
      prisma.auditLog.findMany({
        where: { severity: { in: ['ERROR', 'CRITICAL'] } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.$queryRaw`
        SELECT DATE(\"createdAt\") as date,
               COUNT(*) FILTER (WHERE action = 'LOGIN_SUCCESS') as success,
               COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED') as failed
        FROM "AuditLog"
        WHERE "createdAt" >= ${weekAgo}
          AND action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED')
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      ` as Promise<any[]>,
    ]);

    return {
      today: { total: totalToday, logins: loginsToday, failedLogins: failedLoginsToday, errors: errorsToday },
      week: { total: totalWeek, errors: errorsWeek },
      recentErrors,
      loginsByDay: loginsByDay.map((r: any) => ({
        date: r.date,
        success: Number(r.success),
        failed: Number(r.failed),
      })),
    };
  }

  async getLog(id: string) {
    return prisma.auditLog.findUnique({ where: { id } });
  }

  async cleanup(olderThanDays = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return { deleted: result.count };
  }
}
