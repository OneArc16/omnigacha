import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ListRelicSetsQueryDto } from './dto/list-relic-sets-query.dto';
import { RelicSetsService } from './relic-sets.service';

@Controller('relic-sets')
export class RelicSetsController {
  constructor(private readonly relicSetsService: RelicSetsService) {}

  @Get()
  findAll(@Query() query: ListRelicSetsQueryDto) {
    return this.relicSetsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.relicSetsService.findOne(id);
  }
}
