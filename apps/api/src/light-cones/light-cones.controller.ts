import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { CreateLightConeDto } from './dto/create-light-cone.dto';
import { UpdateLightConeDto } from './dto/update-light-cone.dto';
import { LightConesService } from './light-cones.service';

@Controller('light-cones')
export class LightConesController {
  constructor(private readonly lightConesService: LightConesService) {}

  @Post()
  create(@Body() dto: CreateLightConeDto) {
    return this.lightConesService.create(dto);
  }

  @Get()
  findAll(@Query() query: CursorPaginationQueryDto) {
    return this.lightConesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lightConesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLightConeDto,
  ) {
    return this.lightConesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lightConesService.remove(id);
  }
}
