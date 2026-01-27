import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { UsersModule } from '../users/users.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [UsersModule, MessagesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
