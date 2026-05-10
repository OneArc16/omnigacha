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
  UseGuards,
} from '@nestjs/common';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateUserCharacterDto } from './dto/create-user-character.dto';
import { UpdateUserCharacterDto } from './dto/update-user-character.dto';
import { UserCharactersService } from './user-characters.service';

@UseGuards(JwtAuthGuard)
@Controller('user-characters')
export class UserCharactersController {
  constructor(private readonly userCharactersService: UserCharactersService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserCharacterDto) {
    return this.userCharactersService.create(user.sub, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.userCharactersService.findAll(user.sub, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userCharactersService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserCharacterDto,
  ) {
    return this.userCharactersService.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userCharactersService.remove(user.sub, id);
  }
}
