import { Module } from '@nestjs/common';
import { RelicSetsController } from './relic-sets.controller';
import { RelicSetsService } from './relic-sets.service';

@Module({
  controllers: [RelicSetsController],
  providers: [RelicSetsService],
  exports: [RelicSetsService],
})
export class RelicSetsModule {}
