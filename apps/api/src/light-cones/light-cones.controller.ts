import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { LightConesService } from './light-cones.service';

@Controller('light-cones')
export class LightConesController {
  constructor(private readonly lightConesService: LightConesService) {}

  @Get()
  findAll(@Query() query: CursorPaginationQueryDto) {
    return this.lightConesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lightConesService.findOne(id);
  }
}
