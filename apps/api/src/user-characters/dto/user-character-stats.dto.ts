import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UserCharacterStatsDto {
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
  crit_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  crit_damage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  break_effect?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  energy_regen_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  effect_hit_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  effect_res?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  elemental_dmg_bonus?: number;
}
