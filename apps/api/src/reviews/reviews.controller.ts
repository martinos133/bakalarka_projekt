import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto, UpdateReviewDto, ReplyToReviewDto } from '@inzertna-platforma/shared';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pridať recenziu k inzerátu' })
  create(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @Get('advertisement/:advertisementId')
  @ApiOperation({ summary: 'Získať recenzie pre inzerát' })
  findByAdvertisement(@Param('advertisementId') advertisementId: string) {
    return this.reviewsService.findByAdvertisement(advertisementId);
  }

  @Get('advertisement/:advertisementId/stats')
  @ApiOperation({ summary: 'Získať štatistiky recenzií pre inzerát' })
  getStats(@Param('advertisementId') advertisementId: string) {
    return this.reviewsService.getStats(advertisementId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Získať štatistiky recenzií pre používateľa (všetky jeho inzeráty)' })
  getUserStats(@Param('userId') userId: string) {
    return this.reviewsService.getUserStats(userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upraviť vlastnú recenziu' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, req.user.userId, dto);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Odpovedať na recenziu (len majiteľ inzerátu)' })
  reply(@Request() req, @Param('id') id: string, @Body() dto: ReplyToReviewDto) {
    return this.reviewsService.reply(id, req.user.userId, dto);
  }

  @Delete(':id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Zmazať odpoveď na recenziu (len majiteľ inzerátu)' })
  deleteReply(@Request() req, @Param('id') id: string) {
    return this.reviewsService.deleteReply(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Zmazať vlastnú recenziu' })
  remove(@Request() req, @Param('id') id: string) {
    return this.reviewsService.remove(id, req.user.userId);
  }
}
