import { Observable } from 'rxjs';
import { UserEntity } from './user.entity';
import { UsersRepository } from './users.repository';

export class UsersService {
  constructor(private usersRepository: UsersRepository) {}
  create(user: UserEntity): Observable<UserEntity> {
    return this.usersRepository.createNew(user);
  }

  update(idpId: string, user: UserEntity): Observable<UserEntity> {
    return this.usersRepository.updateOne(idpId, user);
  }

  updateOneByIdpId(idpId: string, user: UserEntity): Observable<UserEntity> {
    return this.usersRepository.updateOneByIdpId(idpId, user);
  }

  deleteOneByIdpId(idpId: string): Observable<void> {
    return this.usersRepository.deleteOneByIdpId(idpId);
  }

  delete(id: string): Observable<UserEntity> {
    return this.usersRepository.deleteOne(id);
  }

  findOne(id: string): Observable<UserEntity> {
    return this.usersRepository.findOne(id);
  }

  findOneByIdpId(id: string): Observable<UserEntity> {
    return this.usersRepository.findOneByIdpId(id);
  }

  findByUsername(username: string): Observable<UserEntity> {
    return this.usersRepository.findByUsername(username);
  }

  findAll(): Observable<UserEntity[]> {
    return this.usersRepository.findAll();
  }
}
