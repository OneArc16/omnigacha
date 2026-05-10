import { PartialType } from '@nestjs/mapped-types';
import { CreateUserCharacterDto } from './create-user-character.dto';

export class UpdateUserCharacterDto extends PartialType(CreateUserCharacterDto) {}
