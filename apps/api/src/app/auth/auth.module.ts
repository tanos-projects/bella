import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { MyConfigModule } from '../infrastructure/config/my-config.module';
import { ModeratorIdentityRepositoryNest } from '../infrastructure/persistence/repositories/moderator-identity-repository-nest';
import { ModeratorIdentity, ModeratorIdentitySchema } from '../infrastructure/persistence/schemas/moderator-identity.schema';
import { UsersModule } from '../infrastructure/users/users.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ModeratorIdentityService } from './moderator-identity.service';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [
    HttpModule,
    MyConfigModule,
    MongooseModule.forFeature([
      { name: ModeratorIdentity.name, schema: ModeratorIdentitySchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    PermissionsGuard,
    ModeratorIdentityRepositoryNest,
    ModeratorIdentityService,
  ],
  exports: [PassportModule, PermissionsGuard, ModeratorIdentityService],
})
export class AuthModule {}
