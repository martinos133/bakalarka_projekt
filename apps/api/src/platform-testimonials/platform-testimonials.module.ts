import { Module } from '@nestjs/common';
import { PlatformTestimonialsController } from './platform-testimonials.controller';
import { PlatformTestimonialsService } from './platform-testimonials.service';

@Module({
  controllers: [PlatformTestimonialsController],
  providers: [PlatformTestimonialsService],
  exports: [PlatformTestimonialsService],
})
export class PlatformTestimonialsModule {}
