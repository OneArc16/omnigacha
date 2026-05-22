import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { UserCharacterStatsDto } from '../../user-characters/dto/user-character-stats.dto';

export class RecommendTargetStatsDto extends UserCharacterStatsDto {}

export class RecommendCharacterDto {
  @IsInt()
  @Min(1)
  targetCharacterId!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecommendTargetStatsDto)
  targetStats?: RecommendTargetStatsDto;
}
