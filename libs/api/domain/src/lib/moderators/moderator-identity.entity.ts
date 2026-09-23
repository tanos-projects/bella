// Local cache of a moderator's display identity (email/name), keyed by
// their Auth0 `sub`. Never used for authentication or authorization -
// that stays entirely on the `permissions` claim checked on every
// request by PermissionsGuard. Deliberately separate from UserEntity
// (the marketplace user): a moderator has none of a marketplace user's
// fields (mobilePhone, birthdate, profile completion, ...), and mixing
// the two would make one carry assumptions that only apply to the other.
export class ModeratorIdentityEntity {
  idpId: string;
  email?: string;
  name?: string;
  updatedAt?: Date;
}
