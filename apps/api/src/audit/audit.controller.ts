import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';
import { AuditAction, AuditSeverity } from '@prisma/client';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('severity') severity?: string,
    @Query('userId') userId?: string,
    @Query('success') success?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.auditService.getLogs({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      action: action as AuditAction | undefined,
      severity: severity as AuditSeverity | undefined,
      userId: userId || undefined,
      success: success !== undefined ? success === 'true' : undefined,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  }

  @Get('stats')
  async getStats() {
    return this.auditService.getStats();
  }

  @Get(':id')
  async getLog(@Param('id') id: string) {
    return this.auditService.getLog(id);
  }

  @Delete('cleanup')
  async cleanup(@Query('days') days?: string) {
    return this.auditService.cleanup(days ? parseInt(days) : 90);
  }
}
