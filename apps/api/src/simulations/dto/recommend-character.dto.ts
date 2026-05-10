import { IsInt, Min } from 'class-validator';

export class RecommendCharacterDto {
  @IsInt()
  @Min(1)
  targetCharacterId!: number;
}
