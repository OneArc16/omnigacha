import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class SimulateDamageDto {
  @IsInt()
  @Min(1)
  characterId!: number;

  @IsInt()
  @Min(-9999)
  @Max(9999)
  atkDelta!: number;

  @IsNumber()
  @Min(-100)
  @Max(100)
  critRateDelta!: number;

  @IsNumber()
  @Min(-300)
  @Max(300)
  critDamageDelta!: number;

  @IsInt()
  @Min(-200)
  @Max(200)
  speedDelta!: number;
}
