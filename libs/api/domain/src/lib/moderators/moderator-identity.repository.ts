import { Observable } from 'rxjs';
import { ModeratorIdentityEntity } from './moderator-identity.entity';

export interface ModeratorIdentityRepository {
  upsert(identity: ModeratorIdentityEntity): Observable<ModeratorIdentityEntity>;
}
