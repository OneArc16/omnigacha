import { PartialType } from '@nestjs/mapped-types';
import { CreateLightConeDto } from './create-light-cone.dto';

export class UpdateLightConeDto extends PartialType(CreateLightConeDto) {}
