import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { MessagesService } from '../messages/messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';
import { MessageStatus, MessageType } from '@inzertna-platforma/shared';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Získanie štatistík platformy' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Získanie všetkých používateľov (admin)' })
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('advertisements')
  @ApiOperation({ summary: 'Získanie všetkých inzerátov (admin)' })
  getAllAdvertisements() {
    return this.adminService.getAllAdvertisements();
  }

  @Get('chart')
  @ApiOperation({ summary: 'Získanie dát pre graf' })
  @ApiQuery({ name: 'period', enum: ['7d', '30d', '3m'], required: false, description: 'Časové obdobie' })
  getChartData(@Query('period') period: '7d' | '30d' | '3m' = '30d') {
    return this.adminService.getChartData(period);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Získanie všetkých správ / kontaktných formulárov (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: MessageStatus })
  @ApiQuery({ name: 'type', required: false, enum: MessageType })
  getMessages(
    @Query('status') status?: MessageStatus,
    @Query('type') type?: MessageType,
  ) {
    return this.messagesService.findAllForAdmin(status, type);
  }
}
