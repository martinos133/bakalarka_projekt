import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInquiryDto, MessageStatus, MessageType } from '@inzertna-platforma/shared';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('inquiry')
  @ApiOperation({ summary: 'Vytvoriť dotaz na inzerát' })
  async createInquiry(
    @Request() req,
    @Body() createDto: CreateInquiryDto,
  ) {
    return this.messagesService.createInquiry(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Získať všetky správy používateľa' })
  @ApiQuery({ name: 'status', required: false, enum: MessageStatus })
  @ApiQuery({ name: 'type', required: false, enum: MessageType })
  async findAll(
    @Request() req,
    @Query('status') status?: MessageStatus,
    @Query('type') type?: MessageType,
  ) {
    return this.messagesService.findAll(req.user.userId, status, type);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Získať počet neprečítaných správ' })
  async getUnreadCount(@Request() req) {
    return { count: await this.messagesService.getUnreadCount(req.user.userId) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Získať detail správy' })
  async findOne(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.messagesService.findOne(req.user.userId, id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Označiť správu ako prečítanú' })
  async markAsRead(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.messagesService.markAsRead(req.user.userId, id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archivovať správu' })
  async markAsArchived(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.messagesService.markAsArchived(req.user.userId, id);
  }
}
