import { PartialType } from '@nestjs/mapped-types';
import { CreateRelicSetDto } from './create-relic-set.dto';

export class UpdateRelicSetDto extends PartialType(CreateRelicSetDto) {}
