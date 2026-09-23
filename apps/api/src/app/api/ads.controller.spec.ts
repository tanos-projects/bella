import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

import { AdsController } from './ads.controller';

describe('AdsController.publishAd', () => {
  function createController(ad: any, adsServiceOverrides: any = {}) {
    const adsService: any = {
      publish: jest.fn().mockReturnValue(of({ ...ad, status: 'PUBLISHED' })),
      findOne: jest.fn().mockReturnValue(of(ad)),
      ...adsServiceOverrides,
    };
    const usersService: any = {
      findOneByIdpId: jest.fn().mockReturnValue(of({ id: 'user-1' })),
    };
    return { controller: new AdsController(adsService, usersService), adsService, usersService };
  }

  it('publishes the ad when the caller is its owner', (done) => {
    const { controller, adsService } = createController({ id: 'ad-1', owner: { id: 'user-1' } });

    controller
      .publishAd('ad-1', { user: { sub: 'auth0|user-1' } } as any)
      .subscribe(() => {
        expect(adsService.publish).toHaveBeenCalledWith('ad-1');
        done();
      });
  });

  it('rejects a caller who does not own the ad and has no manage:publications permission', (done) => {
    const { controller, adsService } = createController({ id: 'ad-1', owner: { id: 'someone-else' } });

    controller.publishAd('ad-1', { user: { sub: 'auth0|user-1' } } as any).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(adsService.publish).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('lets a caller with manage:publications publish an ad it does not own, without an ownership lookup', (done) => {
    const { controller, adsService } = createController({ id: 'ad-1', owner: { id: 'someone-else' } });

    controller
      .publishAd('ad-1', {
        user: { sub: 'auth0|admin-1', permissions: ['manage:publications'] },
      } as any)
      .subscribe(() => {
        expect(adsService.publish).toHaveBeenCalledWith('ad-1');
        expect(adsService.findOne).not.toHaveBeenCalled();
        done();
      });
  });

  it('rejects when the ad has no owner recorded', (done) => {
    const { controller, adsService } = createController({ id: 'ad-1', owner: undefined });

    controller.publishAd('ad-1', { user: { sub: 'auth0|user-1' } } as any).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(adsService.publish).not.toHaveBeenCalled();
        done();
      },
    });
  });
});

describe('AdsController.createAd', () => {
  function createController(adsServiceOverrides: any = {}) {
    const adsService: any = {
      create: jest
        .fn()
        .mockReturnValue(of({ id: 'ad-1', title: 'a car', owner: { id: 'user-1' } })),
      ...adsServiceOverrides,
    };
    const usersService: any = {
      findOneByIdpId: jest.fn().mockReturnValue(of({ id: 'user-1' })),
    };
    return { controller: new AdsController(adsService, usersService), adsService, usersService };
  }

  it('looks the caller up from the token sub and creates the ad under that owner', (done) => {
    const { controller, adsService, usersService } = createController();
    const payload: any = { title: 'a car', country: { iso2: 'CI', currency: 'XOF' } };

    controller
      .createAd(payload, { user: { sub: 'auth0|user-1' } } as any)
      .subscribe((result) => {
        expect(usersService.findOneByIdpId).toHaveBeenCalledWith('auth0|user-1');
        expect(adsService.create).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'a car', owner: { id: 'user-1' } })
        );
        expect(result.id).toBe('ad-1');
        done();
      });
  });
});

describe('AdsController.getMyPublications', () => {
  function createController(adsServiceOverrides: any = {}) {
    const adsService: any = {
      findAllByOwner: jest.fn().mockReturnValue(of([])),
      ...adsServiceOverrides,
    };
    const usersService: any = {
      findOneByIdpId: jest.fn().mockReturnValue(of({ id: 'user-1' })),
    };
    return { controller: new AdsController(adsService, usersService), adsService, usersService };
  }

  it('rejects a status outside DRAFT/SUBMITTED/PUBLISHED without querying anything', () => {
    const { controller, adsService, usersService } = createController();

    expect(() =>
      controller.getMyPublications(
        { status: 'archived' },
        { user: { sub: 'auth0|user-1' } } as any,
        {},
        undefined as any
      )
    ).toThrow(NotFoundException);
    expect(adsService.findAllByOwner).not.toHaveBeenCalled();
    expect(usersService.findOneByIdpId).not.toHaveBeenCalled();
  });

  it('accepts a lowercase status and queries findAllByOwner with it upper-cased', (done) => {
    const { controller, adsService } = createController();

    controller
      .getMyPublications(
        { status: 'draft' },
        { user: { sub: 'auth0|user-1' } } as any,
        {},
        undefined as any
      )
      .subscribe(() => {
        expect(adsService.findAllByOwner).toHaveBeenCalledWith(
          { id: 'user-1' },
          { status: 'DRAFT' },
          { limit: 0 }
        );
        done();
      });
  });
});
