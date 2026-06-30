import { CatalogStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLightConeDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsNotEmpty()
  path!: string;

  @IsInt()
  @Min(1)
  rarity!: number;

  @IsOptional()
  @IsNotEmpty()
  effectDescription?: string;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  splashArtAssetId?: number | null;
}
