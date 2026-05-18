import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CharactersModule } from './characters/characters.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LightConesModule } from './light-cones/light-cones.module';
import { PrismaModule } from './prisma/prisma.module';
import { SimulationsModule } from './simulations/simulations.module';
import { UserCharactersModule } from './user-characters/user-characters.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CharactersModule,
    DashboardModule,
    LightConesModule,
    UserCharactersModule,
    SimulationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
