import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersRepositoryNest } from '../persistence/repositories/users-repository-nest';
import { User, UserSchema } from '../persistence/schemas/user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService, UsersRepositoryNest],
  exports: [UsersService],
})
export class UsersModule {}
