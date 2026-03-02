import { Module } from '@nestjs/common';
import { StaticPagesController } from './static-pages.controller';
import { StaticPagesService } from './static-pages.service';

@Module({
  controllers: [StaticPagesController],
  providers: [StaticPagesService],
})
export class StaticPagesModule {}
