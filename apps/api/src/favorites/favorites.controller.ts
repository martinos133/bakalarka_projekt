import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie obľúbených inzerátov' })
  findAll(@Request() req) {
    return this.favoritesService.findAll(req.user.userId);
  }

  @Get('check/:advertisementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Skontrola, či je inzerát v obľúbených' })
  async check(@Request() req, @Param('advertisementId') advertisementId: string) {
    const isFavorite = await this.favoritesService.isFavorite(req.user.userId, advertisementId);
    return { isFavorite };
  }

  @Post(':advertisementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pridať inzerát do obľúbených' })
  add(@Request() req, @Param('advertisementId') advertisementId: string) {
    return this.favoritesService.add(req.user.userId, advertisementId);
  }

  @Delete(':advertisementId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Odstrániť inzerát z obľúbených' })
  remove(@Request() req, @Param('advertisementId') advertisementId: string) {
    return this.favoritesService.remove(req.user.userId, advertisementId);
  }
}
