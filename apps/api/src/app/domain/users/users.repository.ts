import { Observable } from 'rxjs';
import { UserEntity } from './user.entity';

export type UserSearchCriteria = UserEntity;

export interface UsersRepository {
  createNew(createUser: UserEntity): Observable<UserEntity>;
  updateOne(username: string, update: UserEntity): Observable<UserEntity>;
  updateOneByIdpId(idpId: string, update: UserEntity): Observable<UserEntity>;
  deleteOneByIdpId(idpId: string): Observable<void>;
  deleteOne(id: string): Observable<any>;
  findAll(criteria?: UserSearchCriteria): Observable<UserEntity[]>;
  findOne(id: string): Observable<UserEntity>;
  findOneByIdpId(idpId: string): Observable<UserEntity>;
  findByUsername(username: string): Observable<UserEntity>;
}
