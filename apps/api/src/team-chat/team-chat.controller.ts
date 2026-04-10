import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TeamChatService } from './team-chat.service';

@Controller('team-chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN' as any)
export class TeamChatController {
  constructor(private readonly chatService: TeamChatService) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('unread')
  getUnreadCounts(@Req() req: any) {
    return this.chatService.getUnreadCounts(req.user.id);
  }

  @Get('members')
  getTeamMembers(@Req() req: any) {
    return this.chatService.getTeamMembers(req.user.id);
  }

  @Post('conversations')
  getOrCreateConversation(
    @Req() req: any,
    @Body('partnerId') partnerId: string,
  ) {
    return this.chatService.getOrCreateConversation(req.user.id, partnerId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.chatService.getMessages(req.user.id, id, cursor);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.chatService.sendMessage(req.user.id, id, content);
  }

  @Post('conversations/:id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.chatService.markAsRead(req.user.id, id);
  }
}
