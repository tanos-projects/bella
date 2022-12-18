import { Injectable } from '@nestjs/common';
import { UsersService as UsersDomainService } from '@bella/api/domain';
import { UsersRepositoryNest } from '../persistence/repositories/users-repository-nest';

@Injectable()
export class UsersService extends UsersDomainService {
  constructor(readonly userRepository: UsersRepositoryNest) {
    super(userRepository);
  }
}
