import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService, PlatformConfig, AdminConfig } from './config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Získanie nastavení platformy (verejné)' })
  getPlatformConfig() {
    return this.configService.getPlatformConfig();
  }

  @Get('admin')
  @ApiOperation({ summary: 'Získanie nastavení adminu (verejné pre admin)' })
  getAdminConfig() {
    return this.configService.getAdminConfig();
  }

  @Get(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie konfigurácie (admin)' })
  getConfig(@Param('key') key: 'platform' | 'admin') {
    return this.configService.getConfig(key);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktualizácia konfigurácie (admin)' })
  updateConfig(
    @Param('key') key: 'platform' | 'admin',
    @Body() value: PlatformConfig | AdminConfig
  ) {
    return this.configService.updateConfig(key, value);
  }
}
