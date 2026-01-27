import { Module } from '@nestjs/common';
import { AdvertisementsController } from './advertisements.controller';
import { AdvertisementsService } from './advertisements.service';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [MessagesModule],
  controllers: [AdvertisementsController],
  providers: [AdvertisementsService],
})
export class AdvertisementsModule {}
