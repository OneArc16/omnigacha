import { IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class CreateLightConeDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  path!: string;

  @IsInt()
  @Min(1)
  rarity!: number;

  @IsOptional()
  @IsNotEmpty()
  effectDescription?: string;
}
