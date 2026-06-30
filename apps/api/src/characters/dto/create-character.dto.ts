import { CatalogStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCharacterDto {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsNotEmpty()
  element!: string;

  @IsNotEmpty()
  path!: string;

  @IsNotEmpty()
  role!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseHp?: number;

  @IsInt()
  @Min(0)
  baseAtk!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  baseDef?: number;

  @IsNumber()
  @Min(0)
  baseCritRate!: number;

  @IsNumber()
  @Min(0)
  baseCritDamage!: number;

  @IsInt()
  @Min(0)
  baseSpeed!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rarity?: number;

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
