import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { RecommendCharacterDto } from './dto/recommend-character.dto';
import { SimulateDamageDto } from './dto/simulate-damage.dto';
import { SimulationsService } from './simulations.service';

@UseGuards(JwtAuthGuard)
@Controller('simulations')
export class SimulationsController {
  constructor(private readonly simulationsService: SimulationsService) {}

  @Get('recommendations')
  listRecommendations(
    @CurrentUser() user: JwtPayload,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.simulationsService.listRecommendations(user.sub, query);
  }

  @Get('recommendations/:id')
  findRecommendationById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.simulationsService.findRecommendationById(user.sub, id);
  }

  @Get('history')
  listHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.simulationsService.listHistory(user.sub, query);
  }

  @Get('history/:id')
  findHistoryById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.simulationsService.findHistoryById(user.sub, id);
  }

  @Post('recommend')
  recommend(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecommendCharacterDto,
  ) {
    return this.simulationsService.recommend(user.sub, dto);
  }

  @Post('damage')
  simulateDamage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SimulateDamageDto,
  ) {
    return this.simulationsService.simulateDamage(user.sub, dto);
  }
}
