import { ModeratorIdentityRepositoryNest } from './moderator-identity-repository-nest';

describe('ModeratorIdentityRepositoryNest', () => {
  let repository: ModeratorIdentityRepositoryNest;
  let moderatorIdentityModel: any;

  beforeEach(() => {
    moderatorIdentityModel = {};
    moderatorIdentityModel.findOneAndUpdate = jest.fn();
    repository = new ModeratorIdentityRepositoryNest(moderatorIdentityModel);
  });

  describe('upsert', () => {
    it('upserts by idpId, stamping a fresh updatedAt and asking for the post-update document', (done) => {
      const before = Date.now();
      moderatorIdentityModel.findOneAndUpdate.mockReturnValue(
        Promise.resolve({ idpId: 'auth0|mod-1', email: 'mod@bella.test' })
      );

      repository
        .upsert({ idpId: 'auth0|mod-1', email: 'mod@bella.test' })
        .subscribe(() => {
          expect(moderatorIdentityModel.findOneAndUpdate).toHaveBeenCalledTimes(
            1
          );
          const [filter, update, options] =
            moderatorIdentityModel.findOneAndUpdate.mock.calls[0];

          expect(filter).toEqual({ idpId: 'auth0|mod-1' });
          expect(update).toMatchObject({
            idpId: 'auth0|mod-1',
            email: 'mod@bella.test',
          });
          expect(update.updatedAt).toBeInstanceOf(Date);
          expect(update.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
          expect(options).toEqual({ upsert: true, returnDocument: 'after' });
          done();
        });
    });
  });
});
