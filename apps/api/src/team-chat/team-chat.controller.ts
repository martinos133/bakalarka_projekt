import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@inzertna-platforma/shared';
import { TeamChatService } from './team-chat.service';

@Controller('team-chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TeamChatController {
  constructor(private readonly chatService: TeamChatService) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Get('unread')
  getUnreadCounts(@Req() req: any) {
    return this.chatService.getUnreadCounts(req.user.userId);
  }

  @Get('members')
  getTeamMembers(@Req() req: any) {
    return this.chatService.getTeamMembers(req.user.userId);
  }

  @Post('conversations')
  getOrCreateConversation(
    @Req() req: any,
    @Body() body: any,
  ) {
    const partnerId = body?.partnerId;
    if (!partnerId) {
      throw new BadRequestException('partnerId je povinný');
    }
    return this.chatService.getOrCreateConversation(req.user.userId, partnerId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(req.user.userId, id, cursor);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.chatService.sendMessage(
      req.user.userId,
      id,
      body?.content,
      body?.attachments,
    );
  }

  @Post('conversations/:id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.chatService.markAsRead(req.user.userId, id);
  }
}
