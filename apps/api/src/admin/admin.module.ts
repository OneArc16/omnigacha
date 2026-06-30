import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CharactersModule } from '../characters/characters.module';
import { LightConesModule } from '../light-cones/light-cones.module';
import { MediaModule } from '../media/media.module';
import { RelicSetsModule } from '../relic-sets/relic-sets.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminCharactersController } from './admin-characters.controller';
import { AdminLightConesController } from './admin-light-cones.controller';
import { AdminRelicSetsController } from './admin-relic-sets.controller';
import { AdminUsersController } from './admin-users.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UsersModule,
    CharactersModule,
    LightConesModule,
    MediaModule,
    RelicSetsModule,
  ],
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminCharactersController,
    AdminLightConesController,
    AdminRelicSetsController,
  ],
  providers: [RolesGuard, AdminDashboardService],
})
export class AdminModule {}
