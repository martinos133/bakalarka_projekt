import { Module } from '@nestjs/common';
import { TeamChatController } from './team-chat.controller';
import { TeamChatService } from './team-chat.service';

@Module({
  controllers: [TeamChatController],
  providers: [TeamChatService],
  exports: [TeamChatService],
})
export class TeamChatModule {}
