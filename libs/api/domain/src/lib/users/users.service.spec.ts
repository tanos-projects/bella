import { of } from 'rxjs';
import { UserEntity } from './user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const user: UserEntity = { id: 'user-1', idpId: 'auth0|user-1' };

  beforeEach(() => {
    repository = {
      createNew: jest.fn(),
      updateOne: jest.fn(),
      updateOneByIdpId: jest.fn(),
      deleteOneByIdpId: jest.fn(),
      deleteOne: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneByIdpId: jest.fn(),
      findByUsername: jest.fn(),
    };
    service = new UsersService(repository);
  });

  it('create delegates to repository.createNew', () => {
    repository.createNew.mockReturnValue(of(user));

    service.create(user).subscribe();

    expect(repository.createNew).toHaveBeenCalledWith(user);
  });

  it('update delegates to repository.updateOne, keyed by the given idpId param', () => {
    repository.updateOne.mockReturnValue(of(user));

    service.update('auth0|user-1', user).subscribe();

    // Note the naming mismatch with the interface: UsersService.update's
    // first parameter is named `idpId`, but it is passed straight through
    // to `updateOne`, whose own interface signature names it `username`.
    expect(repository.updateOne).toHaveBeenCalledWith('auth0|user-1', user);
  });

  it('updateOneByIdpId delegates to repository.updateOneByIdpId', () => {
    repository.updateOneByIdpId.mockReturnValue(of(user));

    service.updateOneByIdpId('auth0|user-1', user).subscribe();

    expect(repository.updateOneByIdpId).toHaveBeenCalledWith(
      'auth0|user-1',
      user
    );
  });

  it('deleteOneByIdpId delegates to repository.deleteOneByIdpId', () => {
    repository.deleteOneByIdpId.mockReturnValue(of(undefined));

    service.deleteOneByIdpId('auth0|user-1').subscribe();

    expect(repository.deleteOneByIdpId).toHaveBeenCalledWith('auth0|user-1');
  });

  it('delete delegates to repository.deleteOne', () => {
    repository.deleteOne.mockReturnValue(of(user));

    service.delete('user-1').subscribe();

    expect(repository.deleteOne).toHaveBeenCalledWith('user-1');
  });

  it('findOne delegates to repository.findOne', () => {
    repository.findOne.mockReturnValue(of(user));

    service.findOne('user-1').subscribe();

    expect(repository.findOne).toHaveBeenCalledWith('user-1');
  });

  it('findOneByIdpId delegates to repository.findOneByIdpId', () => {
    repository.findOneByIdpId.mockReturnValue(of(user));

    service.findOneByIdpId('auth0|user-1').subscribe();

    expect(repository.findOneByIdpId).toHaveBeenCalledWith('auth0|user-1');
  });

  it('findByUsername delegates to repository.findByUsername', () => {
    repository.findByUsername.mockReturnValue(of(user));

    service.findByUsername('jdoe').subscribe();

    expect(repository.findByUsername).toHaveBeenCalledWith('jdoe');
  });

  it('findAll delegates to repository.findAll with no criteria', () => {
    repository.findAll.mockReturnValue(of([user]));

    service.findAll().subscribe();

    expect(repository.findAll).toHaveBeenCalledWith();
  });
});
