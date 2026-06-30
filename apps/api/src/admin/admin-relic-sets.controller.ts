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
import { CreateRelicSetDto } from '../relic-sets/dto/create-relic-set.dto';
import { ListRelicSetsQueryDto } from '../relic-sets/dto/list-relic-sets-query.dto';
import { UpdateRelicSetDto } from '../relic-sets/dto/update-relic-set.dto';
import { RelicSetsService } from '../relic-sets/relic-sets.service';
import { MediaService } from '../media/media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/relic-sets')
export class AdminRelicSetsController {
  constructor(
    private readonly relicSetsService: RelicSetsService,
    private readonly mediaService: MediaService,
  ) {}

  @Post()
  create(@Body() dto: CreateRelicSetDto) {
    return this.relicSetsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListRelicSetsQueryDto) {
    return this.relicSetsService.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.relicSetsService.findOneAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRelicSetDto,
  ) {
    return this.relicSetsService.update(id, dto);
  }

  @Delete(':id')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.relicSetsService.archive(id);
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
    const relicSet = await this.relicSetsService.findOneAdmin(id);
    const previousAssetId = relicSet.splashArtAssetId;
    const asset = await this.mediaService.saveSplashArt(
      file,
      user.sub,
      'relic-sets',
      relicSet.slug,
    );

    try {
      const updated = await this.relicSetsService.update(id, {
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
    const relicSet = await this.relicSetsService.findOneAdmin(id);

    if (!relicSet.splashArtAssetId) {
      return relicSet;
    }

    const previousAssetId = relicSet.splashArtAssetId;
    const updated = await this.relicSetsService.update(id, {
      splashArtAssetId: null,
    });

    await this.mediaService.deleteAsset(previousAssetId);
    return updated;
  }
}
