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
import { LightConesService } from '../light-cones/light-cones.service';
import { CreateLightConeDto } from '../light-cones/dto/create-light-cone.dto';
import { UpdateLightConeDto } from '../light-cones/dto/update-light-cone.dto';
import { MediaService } from '../media/media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/light-cones')
export class AdminLightConesController {
  constructor(
    private readonly lightConesService: LightConesService,
    private readonly mediaService: MediaService,
  ) {}

  @Post()
  create(@Body() dto: CreateLightConeDto) {
    return this.lightConesService.create(dto);
  }

  @Get()
  findAll(@Query() query: CursorPaginationQueryDto) {
    return this.lightConesService.findAllAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lightConesService.findOneAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLightConeDto,
  ) {
    return this.lightConesService.update(id, dto);
  }

  @Delete(':id')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.lightConesService.archive(id);
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
    const lightCone = await this.lightConesService.findOneAdmin(id);
    const previousAssetId = lightCone.splashArtAssetId;
    const asset = await this.mediaService.saveSplashArt(
      file,
      user.sub,
      'light-cones',
      lightCone.slug,
    );

    try {
      const updated = await this.lightConesService.update(id, {
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
    const lightCone = await this.lightConesService.findOneAdmin(id);

    if (!lightCone.splashArtAssetId) {
      return lightCone;
    }

    const previousAssetId = lightCone.splashArtAssetId;
    const updated = await this.lightConesService.update(id, {
      splashArtAssetId: null,
    });

    await this.mediaService.deleteAsset(previousAssetId);
    return updated;
  }
}
