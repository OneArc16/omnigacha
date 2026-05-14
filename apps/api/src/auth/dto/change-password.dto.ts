import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
