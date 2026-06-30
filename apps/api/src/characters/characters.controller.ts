import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { CharactersService } from './characters.service';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  findAll(@Query() query: CursorPaginationQueryDto) {
    return this.charactersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.findOne(id);
  }
}
