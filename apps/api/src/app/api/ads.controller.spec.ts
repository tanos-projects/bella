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

describe('AdsController.getAll', () => {
  function createController(adsServiceOverrides: any = {}) {
    const adsService: any = {
      findAllPublished: jest.fn().mockReturnValue(of([])),
      ...adsServiceOverrides,
    };
    const usersService: any = {};
    return { controller: new AdsController(adsService, usersService), adsService };
  }

  it('defaults limit to 0 when the filter carries none', (done) => {
    const { controller, adsService } = createController();

    controller.getAll({} as any).subscribe(() => {
      expect(adsService.findAllPublished).toHaveBeenCalledWith({}, { limit: 0 });
      done();
    });
  });

  // Regression test: getAll() used to also bind a separate
  // `@Query('limit') limit: number` parameter alongside `filter`, so a real
  // `?limit=` call 400'd once AdSearchQueryDTO gained
  // forbidNonWhitelisted (see ad-search-query.dto.spec.ts for the
  // ValidationPipe-level coverage of that 400). `limit` now lives on
  // AdSearchQueryDTO itself and must drive pagination without leaking into
  // the Mongo filter criteria.
  it('reads limit off filter for pagination, without forwarding it as a filter criterion', (done) => {
    const { controller, adsService } = createController();

    controller
      .getAll({ category: 'cars', limit: 5 } as any)
      .subscribe(() => {
        expect(adsService.findAllPublished).toHaveBeenCalledWith(
          { category: 'cars' },
          { limit: 5 }
        );
        done();
      });
  });
});

describe('AdsController.getMostRecentAds', () => {
  function createController(adsServiceOverrides: any = {}) {
    const adsService: any = {
      findAllPublished: jest.fn().mockReturnValue(of([])),
      ...adsServiceOverrides,
    };
    const usersService: any = {};
    return { controller: new AdsController(adsService, usersService), adsService };
  }

  // Characterization (Phase 2, sub-point 3a, written before extracting
  // shuffle()/fakeMostRecentAds() out of the controller): the "fake most
  // recent ads" pipeline shuffles the published ads and hands them to
  // `.slice(0, limit)`, but the call site (`this.fakeMostRecentAds(undefined)`)
  // always passes `limit: undefined`, never the `?limit=` query param the
  // endpoint itself received - `slice(0, undefined)` returns every element,
  // so no ads are ever actually dropped by this "limit". This is a real
  // quirk/TODO ("Move this fake logic to service instead"), not something
  // this sub-point's pure extraction is meant to fix.
  it('queries findAllPublished with category/country/limit and returns every ad, shuffled', (done) => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const owner = { id: 'owner-1', username: 'seller' };
    const ads = [
      { id: '1', title: 'a', owner },
      { id: '2', title: 'b', owner },
      { id: '3', title: 'c', owner },
    ];
    const { controller, adsService } = createController({
      findAllPublished: jest.fn().mockReturnValue(of(ads)),
    });

    controller
      .getMostRecentAds('cars', 'CI', 2)
      .subscribe((result) => {
        expect(adsService.findAllPublished).toHaveBeenCalledWith(
          { category: 'cars', country: 'CI' },
          { limit: 2 }
        );
        // slice(0, undefined) - the hardcoded fakeMostRecentAds(undefined)
        // call - returns all 3 ads, not the 2 the ?limit= query asked for.
        expect(result).toHaveLength(3);
        expect(result.map((ad: any) => ad.id).sort()).toEqual(['1', '2', '3']);
        randomSpy.mockRestore();
        done();
      });
  });

  it('defaults limit to 0 (no limit) on findAllPublished when none is given', (done) => {
    const { controller, adsService } = createController();

    controller.getMostRecentAds(undefined as any, undefined as any, undefined as any).subscribe(() => {
      expect(adsService.findAllPublished).toHaveBeenCalledWith(
        { category: undefined, country: undefined },
        { limit: 0 }
      );
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
        {}
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
        {}
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

  // Regression test for the bug this sub-point's dev-lead review caught:
  // getMyPublications() used to also bind a separate
  // `@Query('limit') limit: number` parameter alongside `filter`, so a real
  // `?limit=` call 400'd (see ad-search-query.dto.spec.ts for the
  // ValidationPipe-level coverage of that). Exercising the controller
  // method directly can't reproduce the double-@Query() binding itself
  // (see the comment above adSearchQueryValidationPipe's declaration), but
  // it does cover what the fix changed: `filter.limit` now drives
  // pagination, and must not leak into the Mongo filter criteria.
  it('reads limit off filter for pagination, without forwarding it as a filter criterion', (done) => {
    const { controller, adsService } = createController();

    controller
      .getMyPublications(
        { status: 'draft' },
        { user: { sub: 'auth0|user-1' } } as any,
        { category: 'cars', limit: 5 } as any
      )
      .subscribe(() => {
        expect(adsService.findAllByOwner).toHaveBeenCalledWith(
          { id: 'user-1' },
          { category: 'cars', status: 'DRAFT' },
          { limit: 5 }
        );
        done();
      });
  });
});

// Phase 2, sub-point 5: AdMapper.modelToDTO no longer throws
// NotFoundException on a null model itself - findOne/findPublishedOne must
// now reject that case explicitly (via throwIfNullish) instead of letting a
// malformed DTO through, or crashing with a raw TypeError.
describe('AdsController.findOne', () => {
  function createController(adsServiceOverrides: any = {}) {
    const adsService: any = {
      findOne: jest.fn().mockReturnValue(of(null)),
      ...adsServiceOverrides,
    };
    const usersService: any = {};
    return { controller: new AdsController(adsService, usersService) };
  }

  it('maps the found ad through AdMapper.modelToDTO', (done) => {
    const { controller } = createController({
      findOne: jest.fn().mockReturnValue(
        of({ id: 'ad-1', title: 'a car', owner: { id: 'user-1' } })
      ),
    });

    controller.findOne('ad-1').subscribe((dto: any) => {
      expect(dto.id).toBe('ad-1');
      done();
    });
  });

  it('rejects with a NotFoundException when no ad is found, instead of a malformed DTO', (done) => {
    const { controller } = createController();

    controller.findOne('missing-ad').subscribe({
      error: (err) => {
        expect(err.constructor.name).toBe('NotFoundException');
        done();
      },
    });
  });
});

describe('AdsController.findPublishedOne', () => {
  function createController(adsServiceOverrides: any = {}) {
    const adsService: any = {
      findOnePublished: jest.fn().mockReturnValue(of(null)),
      ...adsServiceOverrides,
    };
    const usersService: any = {};
    return { controller: new AdsController(adsService, usersService) };
  }

  it('maps the found ad through AdMapper.modelToDTO', (done) => {
    const { controller } = createController({
      findOnePublished: jest.fn().mockReturnValue(
        of({ id: 'ad-1', title: 'a car', owner: { id: 'user-1' } })
      ),
    });

    controller.findPublishedOne('ad-1').subscribe((dto: any) => {
      expect(dto.id).toBe('ad-1');
      done();
    });
  });

  it('rejects with a NotFoundException when no published ad is found, instead of a malformed DTO', (done) => {
    const { controller } = createController();

    controller.findPublishedOne('missing-ad').subscribe({
      error: (err) => {
        expect(err.constructor.name).toBe('NotFoundException');
        done();
      },
    });
  });
});
