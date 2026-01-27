import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FiltersService } from './filters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';
import { CreateFilterDto, UpdateFilterDto } from '@inzertna-platforma/shared';

@ApiTags('filters')
@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vytvorenie nového filtru' })
  create(@Body() createDto: CreateFilterDto) {
    return this.filtersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Získanie všetkých filtrov' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrovanie podľa kategórie' })
  findAll(@Query('categoryId') categoryId?: string) {
    return this.filtersService.findAll(categoryId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Získanie aktívnych filtrov' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrovanie podľa kategórie' })
  findActive(@Query('categoryId') categoryId?: string) {
    return this.filtersService.findActive(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získanie filtru podľa ID' })
  findOne(@Param('id') id: string) {
    return this.filtersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktualizácia filtru' })
  update(@Param('id') id: string, @Body() updateDto: UpdateFilterDto) {
    return this.filtersService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Odstránenie filtru' })
  remove(@Param('id') id: string) {
    return this.filtersService.remove(id);
  }
}
