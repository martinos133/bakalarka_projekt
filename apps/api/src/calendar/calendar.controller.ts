import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Získať udalosti prihláseného používateľa' })
  findAll(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.calendarService.findByUser(req.user.userId, from, to);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získať detail udalosti' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.calendarService.findOne(id, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Vytvoriť novú udalosť' })
  create(@Request() req, @Body() body: any) {
    return this.calendarService.create(req.user.userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Upraviť udalosť' })
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.calendarService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Zmazať udalosť' })
  remove(@Request() req, @Param('id') id: string) {
    return this.calendarService.remove(id, req.user.userId);
  }
}
