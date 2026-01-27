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

  @Get('user/:userId')
  @ApiOperation({ summary: 'Získanie inzerátov používateľa' })
  findByUser(@Param('userId') userId: string) {
    return this.advertisementsService.findByUser(userId);
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
}
