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
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateReportDto, ResolveReportDto } from '@inzertna-platforma/shared';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nahlásenie inzerátu' })
  create(@Request() req, @Body() createDto: CreateReportDto) {
    return this.reportsService.create(req.user.userId, createDto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie všetkých čakajúcich nahlásení (len admin)' })
  findAllPending() {
    return this.reportsService.findAllPending();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie všetkých nahlásení (len admin)' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Získanie nahlásenia podľa ID (len admin)' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vyriešenie nahlásenia (len admin)' })
  resolve(@Request() req, @Param('id') id: string, @Body() resolveDto: ResolveReportDto) {
    return this.reportsService.resolve(id, req.user.userId, resolveDto);
  }

  @Delete('advertisement/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Odstránenie nahláseného inzerátu (len admin)' })
  deleteAdvertisement(@Param('id') id: string, @Body() body: { reportId: string }) {
    return this.reportsService.deleteAdvertisement(id, body.reportId);
  }
}
