import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EMPTY, from, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { UserEntity } from '@bella/api/domain';
import {
  UserSearchCriteria,
  UsersRepository,
} from '@bella/api/domain';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepositoryNest implements UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  createNew(createUser: UserEntity): Observable<UserEntity> {
    const createdUser = new this.userModel(createUser);
    return from(createdUser.save());
  }

  updateOne(username: string, update: UserEntity): Observable<UserEntity> {
    return from(
      this.userModel.findOneAndUpdate({ username }, update, {
        new: true,
        useFindAndModify: false,
      }),
    );
  }

  updateOneByIdpId(idpId: string, update: UserEntity): Observable<UserEntity> {
    return from(
      this.userModel.findOneAndUpdate({ idpId }, update, {
        new: true,
        useFindAndModify: false,
      }),
    );
  }

  deleteOne(id: string): Observable<void> {
    return from(this.userModel.deleteOne({ _id: id })).pipe(
      concatMap(() => EMPTY),
    );
  }

  deleteOneByIdpId(idpId: string): Observable<void> {
    return from(this.userModel.deleteOne({ idpId })).pipe(
      concatMap(() => EMPTY),
    );
  }

  findAll(criteria?: UserSearchCriteria): Observable<UserEntity[]> {
    return from(this.userModel.find({ ...criteria }).exec());
  }

  findOne(id: string): Observable<UserEntity> {
    return from(this.userModel.findById(id).exec());
  }

  findOneByIdpId(idpId: string): Observable<UserEntity> {
    return from(this.userModel.findOne({ idpId }).exec());
  }

  findByUsername(username: string): Observable<UserEntity> {
    return from(this.userModel.findOne({ username }).exec());
  }
}
