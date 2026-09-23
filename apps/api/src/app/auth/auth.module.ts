import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MyConfigModule } from '../infrastructure/config/my-config.module';
import { UsersModule } from '../infrastructure/users/users.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ModeratorIdentityService } from './moderator-identity.service';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [
    HttpModule,
    MyConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  providers: [JwtStrategy, JwtAuthGuard, PermissionsGuard, ModeratorIdentityService],
  exports: [PassportModule, PermissionsGuard, ModeratorIdentityService],
})
export class AuthModule {}
