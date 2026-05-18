import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecommendTargetStatsDto {
  @IsNumber()
  @Min(1)
  atk!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  critRate!: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  critDamage!: number;

  @IsNumber()
  @Min(1)
  speed!: number;
}

export class RecommendCharacterDto {
  @IsInt()
  @Min(1)
  targetCharacterId!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecommendTargetStatsDto)
  targetStats?: RecommendTargetStatsDto;
}
