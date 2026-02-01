import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Štatistiky kliknutí podľa pohlavia a typu účtu (admin)' })
  @ApiQuery({ name: 'period', enum: ['1m', '5m', '8h', '1d', '7d', '30d', '3m'], required: false })
  @ApiQuery({ name: 'minutes', description: 'Obdobie v minútach (1–480), má prednosť pred period', required: false })
  @ApiQuery({ name: 'gender', description: 'Filter podľa pohlavia: MALE, FEMALE, OTHER, unspecified', required: false })
  @ApiQuery({ name: 'accountType', description: 'Filter podľa typu účtu: company, individual, unspecified', required: false })
  getClickStats(
    @Query('period') period: '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m' = '30d',
    @Query('minutes') minutes?: string,
    @Query('gender') gender?: string,
    @Query('accountType') accountType?: string,
  ) {
    const minutesNum = minutes != null ? parseInt(minutes, 10) : undefined;
    return this.analyticsService.getClickStats(period, minutesNum, gender, accountType);
  }

  @Get('stats/breakdown')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rozklad kliknutí podľa kategórií a inzerátov (admin)' })
  @ApiQuery({ name: 'period', enum: ['1m', '5m', '8h', '1d', '7d', '30d', '3m'], required: false })
  getClickBreakdown(@Query('period') period: '1m' | '5m' | '8h' | '1d' | '7d' | '30d' | '3m' = '30d') {
    return this.analyticsService.getClickBreakdown(period);
  }

  @Post('click')
  @ApiOperation({ summary: 'Zaznamenať kliknutie – pohlavie a typ účtu z body (platforma pošle pri prihlásenom userovi)' })
  async recordClick(
    @Body()
    body: {
      eventType?: string;
      targetType?: string;
      targetId?: string;
      sessionId?: string;
      userId?: string;
      gender?: string;
      isCompany?: boolean;
    },
  ) {
    let gender: 'MALE' | 'FEMALE' | 'OTHER' | undefined;
    if (body.gender && ['MALE', 'FEMALE', 'OTHER'].includes(body.gender)) {
      gender = body.gender as 'MALE' | 'FEMALE' | 'OTHER';
    }
    const isCompany = body.isCompany !== undefined ? body.isCompany : undefined;

    return this.analyticsService.recordClick({
      userId: body.userId ?? undefined,
      sessionId: body.sessionId ?? undefined,
      gender,
      isCompany,
      eventType: body.eventType ?? 'CLICK',
      targetType: body.targetType ?? undefined,
      targetId: body.targetId ?? undefined,
    });
  }
}
