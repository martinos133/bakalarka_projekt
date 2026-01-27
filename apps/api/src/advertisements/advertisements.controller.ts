import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdvertisementsService } from './advertisements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAdvertisementDto, UpdateAdvertisementDto } from '@inzertna-platforma/shared';

@ApiTags('advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vytvorenie nového inzerátu' })
  create(@Request() req, @Body() createDto: CreateAdvertisementDto) {
    return this.advertisementsService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Získanie všetkých inzerátov' })
  findAll() {
    return this.advertisementsService.findAll();
  }

  @Get('popular/services')
  @ApiOperation({ summary: 'Získanie populárnych služieb' })
  findPopularServices() {
    return this.advertisementsService.findPopularServices(6);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Získanie inzerátov používateľa' })
  findByUser(@Param('userId') userId: string) {
    return this.advertisementsService.findByUser(userId);
  }

  @Get('me/my-advertisements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie vlastných inzerátov' })
  getMyAdvertisements(@Request() req) {
    return this.advertisementsService.findByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získanie inzerátu podľa ID' })
  findOne(@Param('id') id: string) {
    return this.advertisementsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktualizácia inzerátu' })
  update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateAdvertisementDto) {
    return this.advertisementsService.update(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Odstránenie inzerátu' })
  remove(@Request() req, @Param('id') id: string) {
    return this.advertisementsService.remove(id, req.user.userId);
  }

  @Get('pending/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie všetkých čakajúcich inzerátov (len admin)' })
  findPending() {
    return this.advertisementsService.findPending();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schválenie inzerátu (len admin)' })
  approve(@Param('id') id: string) {
    return this.advertisementsService.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Zamietnutie inzerátu (len admin)' })
  reject(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.advertisementsService.reject(id, body?.reason);
  }
}
