import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
  @IsString()
  lightConeName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  lightConeLevel?: number;

  @IsInt()
  @Min(0)
  atk!: number;

  @IsNumber()
  @Min(0)
  critRate!: number;

  @IsNumber()
  @Min(0)
  critDamage!: number;

  @IsInt()
  @Min(0)
  speed!: number;
}
