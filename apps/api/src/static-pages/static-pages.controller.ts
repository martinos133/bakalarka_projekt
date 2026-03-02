import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaticPagesService } from './static-pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';

@ApiTags('static-pages')
@Controller('static-pages')
export class StaticPagesController {
  constructor(private readonly staticPagesService: StaticPagesService) {}

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Získanie publikovanej statickej stránky podľa slug (verejné)' })
  findBySlug(@Param('slug') slug: string) {
    return this.staticPagesService.findBySlug(slug);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie všetkých statických stránok (admin)' })
  findAll() {
    return this.staticPagesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie statickej stránky podľa ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.staticPagesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vytvorenie statickej stránky (admin)' })
  create(@Body() body: any) {
    return this.staticPagesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktualizácia statickej stránky (admin)' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.staticPagesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Odstránenie statickej stránky (admin)' })
  remove(@Param('id') id: string) {
    return this.staticPagesService.remove(id);
  }
}
