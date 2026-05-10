import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateCharacterDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  element!: string;

  @IsNotEmpty()
  path!: string;

  @IsNotEmpty()
  role!: string;

  @IsInt()
  @Min(0)
  baseAtk!: number;

  @IsNumber()
  @Min(0)
  baseCritRate!: number;

  @IsNumber()
  @Min(0)
  baseCritDamage!: number;

  @IsInt()
  @Min(0)
  baseSpeed!: number;
}
