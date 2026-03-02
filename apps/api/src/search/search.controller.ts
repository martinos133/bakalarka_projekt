import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('suggestions')
  @ApiOperation({ summary: 'Návrhy pre vyhľadávanie (kategórie a inzeráty)' })
  getSuggestions(@Query('q') q?: string) {
    return this.searchService.getSuggestions(q || '');
  }
}
