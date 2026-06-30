import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';
import { RelicSetType } from '@prisma/client';

export class ListRelicSetsQueryDto extends CursorPaginationQueryDto {
  @IsOptional()
  @Type(() => String)
  @IsEnum(RelicSetType)
  type?: RelicSetType;
}
