import { Injectable } from '@nestjs/common';
import { UsersService as UsersDomainService } from '../../domain/users/users.service';
import { UsersRepositoryNest } from '../persistence/repositories/users-repository-nest';

@Injectable()
export class UsersService extends UsersDomainService {
  constructor(readonly userRepository: UsersRepositoryNest) {
    super(userRepository);
  }
}
