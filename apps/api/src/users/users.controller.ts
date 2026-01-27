import { Controller, Get, Param, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';
import { BanUserDto } from '@inzertna-platforma/shared';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Získanie všetkých používateľov' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získanie používateľa podľa ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/ban')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ban/Unban používateľa' })
  banUser(@Param('id') id: string, @Body() banDto: BanUserDto) {
    return this.usersService.banUser(id, banDto);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Získanie štatistík používateľa' })
  getUserStats(@Param('id') id: string) {
    return this.usersService.getUserStats(id);
  }

  @Get('me/profile')
  @ApiOperation({ summary: 'Získanie vlastného profilu' })
  getMyProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Aktualizácia vlastného profilu' })
  updateMyProfile(@Request() req, @Body() updateData: any) {
    return this.usersService.updateProfile(req.user.userId, updateData);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Zmena hesla' })
  changePassword(@Request() req, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.userId, body.oldPassword, body.newPassword);
  }
}
