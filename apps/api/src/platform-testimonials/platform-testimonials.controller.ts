import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformTestimonialsService } from './platform-testimonials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlatformTestimonialDto, UpdatePlatformTestimonialDto } from '@inzertna-platforma/shared';

@ApiTags('platform-testimonials')
@Controller('platform-testimonials')
export class PlatformTestimonialsController {
  constructor(private readonly platformTestimonialsService: PlatformTestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'Verejný zoznam schválených referencií na homepage' })
  findPublic() {
    return this.platformTestimonialsService.findPublic();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vlastná referencia (ak existuje)' })
  findMine(@Request() req: { user: { userId: string } }) {
    return this.platformTestimonialsService.findMine(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pridať referenciu na platformu (raz na účet)' })
  create(@Request() req: { user: { userId: string } }, @Body() dto: CreatePlatformTestimonialDto) {
    return this.platformTestimonialsService.create(req.user.userId, dto);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upraviť vlastnú referenciu' })
  update(@Request() req: { user: { userId: string } }, @Body() dto: UpdatePlatformTestimonialDto) {
    return this.platformTestimonialsService.update(req.user.userId, dto);
  }
}
