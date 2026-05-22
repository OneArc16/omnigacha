import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { UserCharacterStatsDto } from './user-character-stats.dto';

export class CreateUserCharacterDto {
  @IsInt()
  @Min(1)
  characterId!: number;

  @IsInt()
  @Min(1)
  level!: number;

  @IsInt()
  @Min(0)
  eidolon!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  lightConeId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  lightConeLevel?: number | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserCharacterStatsDto)
  stats?: UserCharacterStatsDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  hp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  atk?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  def?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  critRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  critDamage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  breakEffect?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  energyRegenRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  effectHitRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  effectRes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  elementalDmgBonus?: number;
}
