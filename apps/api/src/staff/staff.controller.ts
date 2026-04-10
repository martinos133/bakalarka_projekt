import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService, ALL_PERMISSIONS } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'Zoznam členov admin tímu' })
  findAll() {
    return this.staffService.findAll();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Zoznam všetkých dostupných oprávnení' })
  getPermissions() {
    return ALL_PERMISSIONS;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail člena tímu' })
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Vytvoriť nového člena tímu (brigádnik)' })
  create(@Body() body: any) {
    return this.staffService.create(body);
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Upraviť oprávnenia člena tímu' })
  updatePermissions(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { permissions: string[] },
  ) {
    return this.staffService.updatePermissions(id, req.user.userId, body.permissions);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Resetovať heslo člena tímu' })
  resetPassword(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.staffService.resetPassword(id, req.user.userId, body.password);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Odstrániť člena tímu (degradovať na USER)' })
  remove(@Request() req, @Param('id') id: string) {
    return this.staffService.remove(id, req.user.userId);
  }
}
