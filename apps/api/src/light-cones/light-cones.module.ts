import { Module } from '@nestjs/common';
import { LightConesController } from './light-cones.controller';
import { LightConesService } from './light-cones.service';

@Module({
  controllers: [LightConesController],
  providers: [LightConesService],
  exports: [LightConesService],
})
export class LightConesModule {}
