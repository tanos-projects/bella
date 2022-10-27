import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MyConfigModule } from '../infrastructure/config/my-config.module';
import { UsersModule } from '../infrastructure/users/users.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    MyConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [PassportModule],
})
export class AuthModule {}
