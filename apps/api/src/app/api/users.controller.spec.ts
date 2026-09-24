import { of } from 'rxjs';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  function createController(usersServiceOverrides: any = {}) {
    const usersService: any = {
      findOneByIdpId: jest.fn().mockReturnValue(of(undefined)),
      create: jest.fn(),
      updateOneByIdpId: jest.fn(),
      deleteOneByIdpId: jest.fn().mockReturnValue(of(undefined)),
      findOne: jest.fn(),
      ...usersServiceOverrides,
    };
    return { controller: new UsersController(usersService), usersService };
  }

  const fullUser = {
    id: 'user-1',
    username: 'jdoe',
    email: 'jdoe@example.com',
    lastname: 'Doe',
    firstname: 'John',
    mobilePhone: '+225000000',
    birthdate: new Date('1990-01-01'),
    country: 'CI',
    picture: 'http://img/jdoe.png',
  };

  describe('check', () => {
    it('reports hasProfile:true when a profile exists', (done) => {
      const { controller, usersService } = createController({
        findOneByIdpId: jest.fn().mockReturnValue(of(fullUser)),
      });

      controller.check({ user: { sub: 'auth0|user-1' } } as any).subscribe((result) => {
        expect(usersService.findOneByIdpId).toHaveBeenCalledWith('auth0|user-1');
        expect(result).toEqual({ hasProfile: true });
        done();
      });
    });

    it('reports hasProfile:false when no profile exists, without throwing', (done) => {
      const { controller } = createController({
        findOneByIdpId: jest.fn().mockReturnValue(of(null)),
      });

      controller.check({ user: { sub: 'auth0|user-1' } } as any).subscribe((result) => {
        expect(result).toEqual({ hasProfile: false });
        done();
      });
    });
  });

  describe('getProfile', () => {
    it('maps the found user through UserMapper.modelToDTO', (done) => {
      const { controller, usersService } = createController({
        findOneByIdpId: jest.fn().mockReturnValue(of(fullUser)),
      });

      controller.getProfile({ user: { sub: 'auth0|user-1' } } as any).subscribe((dto) => {
        expect(usersService.findOneByIdpId).toHaveBeenCalledWith('auth0|user-1');
        expect(dto).toEqual({
          id: 'user-1',
          username: 'jdoe',
          email: 'jdoe@example.com',
          lastname: 'Doe',
          firstname: 'John',
          mobilePhone: '+225000000',
          birthdate: fullUser.birthdate,
          country: 'CI',
          picture: 'http://img/jdoe.png',
        });
        done();
      });
    });

    it('propagates a NotFoundException when no profile exists, instead of a friendlier empty result', (done) => {
      const { controller } = createController({
        findOneByIdpId: jest.fn().mockReturnValue(of(null)),
      });

      controller.getProfile({ user: { sub: 'auth0|user-1' } } as any).subscribe({
        error: (err) => {
          expect(err.constructor.name).toBe('NotFoundException');
          done();
        },
      });
    });
  });

  describe('createProfile', () => {
    it('creates under the token idpId/picture rather than anything in the payload', (done) => {
      const { controller, usersService } = createController({
        create: jest.fn().mockReturnValue(of(fullUser)),
      });
      const payload: any = { username: 'jdoe', email: 'jdoe@example.com' };

      controller
        .createProfile(
          { user: { sub: 'auth0|user-1', picture: 'http://token-pic' } } as any,
          payload
        )
        .subscribe(() => {
          expect(usersService.create).toHaveBeenCalledWith({
            username: 'jdoe',
            email: 'jdoe@example.com',
            idpId: 'auth0|user-1',
            picture: 'http://token-pic',
          });
          done();
        });
    });
  });

  describe('updateProfile', () => {
    it('runs the payload through UserMapper.dtoToModel (dropping id/picture) then overrides picture from the token', (done) => {
      const { controller, usersService } = createController({
        updateOneByIdpId: jest.fn().mockReturnValue(of(fullUser)),
      });
      const payload: any = {
        username: 'jdoe',
        email: 'jdoe@example.com',
        picture: 'http://payload-pic-ignored',
      };

      controller
        .updateProfile(
          { user: { sub: 'auth0|user-1', picture: 'http://token-pic' } } as any,
          payload
        )
        .subscribe(() => {
          expect(usersService.updateOneByIdpId).toHaveBeenCalledWith(
            'auth0|user-1',
            {
              username: 'jdoe',
              email: 'jdoe@example.com',
              lastname: null,
              firstname: null,
              mobilePhone: null,
              birthdate: null,
              country: null,
              picture: 'http://token-pic',
            }
          );
          done();
        });
    });
  });

  describe('deleteProfile', () => {
    it('delegates to usersService.deleteOneByIdpId with the token sub', (done) => {
      const { controller, usersService } = createController();

      controller.deleteProfile({ user: { sub: 'auth0|user-1' } } as any).subscribe(() => {
        expect(usersService.deleteOneByIdpId).toHaveBeenCalledWith('auth0|user-1');
        done();
      });
    });
  });

  describe('findOne', () => {
    it('maps the found user through UserMapper.modelToProfileDTO (id/username/country/picture only)', (done) => {
      const { controller, usersService } = createController({
        findOne: jest.fn().mockReturnValue(of(fullUser)),
      });

      controller.findOne('user-1').subscribe((dto: any) => {
        expect(usersService.findOne).toHaveBeenCalledWith('user-1');
        expect(dto).toEqual({
          id: 'user-1',
          username: 'jdoe',
          country: 'CI',
          picture: 'http://img/jdoe.png',
        });
        expect(dto.email).toBeUndefined();
        done();
      });
    });

    it('has no @UseGuards metadata - no JwtAuthGuard is applied on this route', () => {
      // Characterization only: a unit test that invokes the controller
      // method directly (as every other test in this file does) never
      // exercises Nest's guard pipeline, so it cannot tell a guarded
      // handler from an unguarded one - that call path bypasses guards
      // unconditionally regardless of whether @UseGuards is present.
      // Instead, inspect the reflection metadata @UseGuards(...) attaches
      // to the handler, which is present/absent independently of how the
      // method is invoked.
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        UsersController.prototype.findOne
      );

      expect(guards).toBeUndefined();
    });

    it('control check: another handler on this controller that IS guarded has non-empty @UseGuards metadata', () => {
      // Proves the technique above actually works: getProfile carries
      // @UseGuards(JwtAuthGuard), so if this assertion ever failed too,
      // it would mean the metadata check itself is broken/misapplied
      // rather than that findOne is genuinely unguarded.
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        UsersController.prototype.getProfile
      );

      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
    });
  });
});
