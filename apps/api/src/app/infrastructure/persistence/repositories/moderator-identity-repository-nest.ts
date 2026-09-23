import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';

import { ModeratorIdentityEntity, ModeratorIdentityRepository } from '@bella/api/domain';
import { ModeratorIdentity, ModeratorIdentityDocument } from '../schemas/moderator-identity.schema';

@Injectable()
export class ModeratorIdentityRepositoryNest implements ModeratorIdentityRepository {
  constructor(
    @InjectModel(ModeratorIdentity.name)
    private moderatorIdentityModel: Model<ModeratorIdentityDocument>
  ) {}

  upsert(identity: ModeratorIdentityEntity): Observable<ModeratorIdentityEntity> {
    return from(
      this.moderatorIdentityModel.findOneAndUpdate(
        { idpId: identity.idpId },
        { ...identity, updatedAt: new Date() },
        { upsert: true, returnDocument: 'after' }
      )
    );
  }
}
