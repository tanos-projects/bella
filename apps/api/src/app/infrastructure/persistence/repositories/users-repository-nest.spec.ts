import { UsersRepositoryNest } from './users-repository-nest';

describe('UsersRepositoryNest', () => {
  let repository: UsersRepositoryNest;
  let userModel: any;

  beforeEach(() => {
    userModel = jest.fn().mockImplementation((doc) => ({
      ...doc,
      save: jest.fn().mockResolvedValue({ ...doc, id: 'new-id' }),
    }));
    userModel.find = jest.fn();
    userModel.findById = jest.fn();
    userModel.findOne = jest.fn();
    userModel.findOneAndUpdate = jest.fn();
    userModel.deleteOne = jest.fn();
    repository = new UsersRepositoryNest(userModel);
  });

  describe('createNew', () => {
    it('saves a new document built from the given entity', (done) => {
      repository.createNew({ username: 'jdoe' } as any).subscribe((result) => {
        expect(userModel).toHaveBeenCalledWith({ username: 'jdoe' });
        expect(result).toEqual({ username: 'jdoe', id: 'new-id' });
        done();
      });
    });
  });

  describe('updateOne', () => {
    it('asks for the post-update document, keyed by username', (done) => {
      userModel.findOneAndUpdate.mockReturnValue(
        Promise.resolve({ username: 'jdoe', mobilePhone: '123' })
      );

      repository.updateOne('jdoe', { mobilePhone: '123' } as any).subscribe(() => {
        expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
          { username: 'jdoe' },
          { mobilePhone: '123' },
          { returnDocument: 'after' }
        );
        done();
      });
    });
  });

  describe('updateOneByIdpId', () => {
    it('asks for the post-update document, keyed by idpId', (done) => {
      userModel.findOneAndUpdate.mockReturnValue(
        Promise.resolve({ idpId: 'auth0|1' })
      );

      repository
        .updateOneByIdpId('auth0|1', { mobilePhone: '123' } as any)
        .subscribe(() => {
          expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
            { idpId: 'auth0|1' },
            { mobilePhone: '123' },
            { returnDocument: 'after' }
          );
          done();
        });
    });
  });

  describe('deleteOne', () => {
    it('deletes by _id and completes without emitting a value', (done) => {
      userModel.deleteOne.mockReturnValue(Promise.resolve({ deletedCount: 1 }));
      const next = jest.fn();

      repository.deleteOne('user-1').subscribe({
        next,
        complete: () => {
          expect(userModel.deleteOne).toHaveBeenCalledWith({ _id: 'user-1' });
          expect(next).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('deleteOneByIdpId', () => {
    it('deletes by idpId and completes without emitting a value', (done) => {
      userModel.deleteOne.mockReturnValue(Promise.resolve({ deletedCount: 1 }));
      const next = jest.fn();

      repository.deleteOneByIdpId('auth0|1').subscribe({
        next,
        complete: () => {
          expect(userModel.deleteOne).toHaveBeenCalledWith({
            idpId: 'auth0|1',
          });
          expect(next).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('findAll', () => {
    it('spreads the given criteria straight into a Mongo find query', (done) => {
      userModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ id: '1' }]),
      });

      repository.findAll({ country: 'CI' } as any).subscribe(() => {
        expect(userModel.find).toHaveBeenCalledWith({ country: 'CI' });
        done();
      });
    });
  });

  describe('findOne', () => {
    it('delegates to findById', (done) => {
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: '1' }),
      });

      repository.findOne('1').subscribe(() => {
        expect(userModel.findById).toHaveBeenCalledWith('1');
        done();
      });
    });
  });

  describe('findOneByIdpId', () => {
    it('queries by idpId', (done) => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ idpId: 'auth0|1' }),
      });

      repository.findOneByIdpId('auth0|1').subscribe(() => {
        expect(userModel.findOne).toHaveBeenCalledWith({ idpId: 'auth0|1' });
        done();
      });
    });
  });

  describe('findByUsername', () => {
    it('queries by username', (done) => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ username: 'jdoe' }),
      });

      repository.findByUsername('jdoe').subscribe(() => {
        expect(userModel.findOne).toHaveBeenCalledWith({ username: 'jdoe' });
        done();
      });
    });
  });
});
