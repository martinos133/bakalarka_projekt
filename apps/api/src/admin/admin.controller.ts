import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
