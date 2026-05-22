import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserCharacterStatsDto } from '../../user-characters/dto/user-character-stats.dto';

export class SimulateDamageDto {
  @IsInt()
  @Min(1)
  characterId!: number;

  @ValidateNested()
  @Type(() => UserCharacterStatsDto)
  stats!: UserCharacterStatsDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  teammateCharacterIds?: number[];
}
