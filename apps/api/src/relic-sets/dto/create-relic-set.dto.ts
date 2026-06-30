import { CatalogStatus, RelicSetType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRelicSetDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsEnum(RelicSetType)
  type!: RelicSetType;

  @IsInt()
  @Min(1)
  rarity!: number;

  @IsNotEmpty()
  twoPieceBonus!: string;

  @IsOptional()
  @IsString()
  fourPieceBonus?: string;

  @IsOptional()
  @IsString()
  gameVersion?: string;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  splashArtAssetId?: number | null;
}
