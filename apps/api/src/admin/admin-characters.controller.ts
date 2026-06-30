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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { CharactersService } from '../characters/characters.service';
import { CreateCharacterDto } from '../characters/dto/create-character.dto';
import { UpdateCharacterDto } from '../characters/dto/update-character.dto';
import { MediaService } from '../media/media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/characters')
export class AdminCharactersController {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly mediaService: MediaService,
  ) {}

  @Post()
  create(@Body() dto: CreateCharacterDto) {
    return this.charactersService.create(dto);
  }

  @Get()
  findAll(@Query() query: CursorPaginationQueryDto) {
    return this.charactersService.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.findOneAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, dto);
  }

  @Delete(':id')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.archive(id);
  }

  @Post(':id/splash-art')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadSplashArt(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    const character = await this.charactersService.findOneAdmin(id);
    const previousAssetId = character.splashArtAssetId;
    const asset = await this.mediaService.saveSplashArt(
      file,
      user.sub,
      'characters',
      character.slug,
    );

    try {
      const updated = await this.charactersService.update(id, {
        splashArtAssetId: asset.id,
      });

      if (previousAssetId && previousAssetId !== asset.id) {
        await this.mediaService.deleteAsset(previousAssetId);
      }

      return updated;
    } catch (error) {
      await this.mediaService.deleteAsset(asset.id);
      throw error;
    }
  }

  @Delete(':id/splash-art')
  async removeSplashArt(@Param('id', ParseIntPipe) id: number) {
    const character = await this.charactersService.findOneAdmin(id);

    if (!character.splashArtAssetId) {
      return character;
    }

    const previousAssetId = character.splashArtAssetId;
    const updated = await this.charactersService.update(id, {
      splashArtAssetId: null,
    });

    await this.mediaService.deleteAsset(previousAssetId);
    return updated;
  }
}
