import { Module } from '@nestjs/common';
import { UserCharactersController } from './user-characters.controller';
import { UserCharactersService } from './user-characters.service';

@Module({
  controllers: [UserCharactersController],
  providers: [UserCharactersService],
  exports: [UserCharactersService],
})
export class UserCharactersModule {}
