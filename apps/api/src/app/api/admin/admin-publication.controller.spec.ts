import { GUARDS_METADATA } from '@nestjs/common/constants';
import { of } from 'rxjs';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PERMISSIONS_KEY } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { AdminPublicationController } from './admin-publication.controller';

function createController(overrides: { adsService?: any; moderatorIdentityService?: any } = {}) {
  const adsService: any = {
    findAllUnpublished: jest.fn().mockReturnValue(of([])),
    countUnpublished: jest.fn().mockReturnValue(of(0)),
    findAllPublished: jest.fn().mockReturnValue(of([])),
    countPublished: jest.fn().mockReturnValue(of(0)),
    findAllArchived: jest.fn().mockReturnValue(of([])),
    countArchived: jest.fn().mockReturnValue(of(0)),
    // AdMapper.modelToDTO unconditionally maps `owner` through UserMapper,
    // which throws on `undefined` (only guards against `null`) - every
    // fixture routed through the mapper needs at least an empty owner.
    publish: jest.fn().mockReturnValue(of({ id: '1', status: 'PUBLISHED', owner: {} })),
    reject: jest.fn().mockReturnValue(of({ id: '1', status: 'REJECTED', owner: {} })),
    archive: jest.fn().mockReturnValue(of({ id: '1', status: 'ARCHIVED', owner: {} })),
    ...overrides.adsService,
  };
  const moderatorIdentityService: any = {
    resolve: jest.fn().mockReturnValue(of(undefined)),
    ...overrides.moderatorIdentityService,
  };
  return {
    controller: new AdminPublicationController(adsService, moderatorIdentityService),
    adsService,
    moderatorIdentityService,
  };
}

function requestWith(authorization?: string) {
  return { headers: authorization ? { authorization } : {} } as any;
}

describe('AdminPublicationController', () => {
  describe('guards', () => {
    // AdminPublicationController is guarded class-wide (@UseGuards +
    // @Permissions('manage:publications') on the class, not per-method) -
    // checked here via the Nest metadata those decorators actually write,
    // since the repo has no e2e harness for apps/api to exercise this
    // through a real HTTP request/guard pipeline.
    it('requires JwtAuthGuard and PermissionsGuard', () => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, AdminPublicationController);
      expect(guards).toEqual([JwtAuthGuard, PermissionsGuard]);
    });

    it('requires the manage:publications permission', () => {
      const permissions = Reflect.getMetadata(PERMISSIONS_KEY, AdminPublicationController);
      expect(permissions).toEqual(['manage:publications']);
    });
  });

  describe('getAllUnpublished', () => {
    it('defaults to page 1 / pageSize 20 when no query params are given', (done) => {
      const { controller, adsService } = createController();

      controller.getAllUnpublished(undefined, undefined).subscribe((result) => {
        expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 0, limit: 20 });
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        done();
      });
    });

    it('computes skip from an explicit page and pageSize', (done) => {
      const { controller, adsService } = createController();

      controller.getAllUnpublished('3', '10').subscribe((result) => {
        // page 3 at 10 per page: skip the first 20
        expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 20, limit: 10 });
        expect(result.page).toBe(3);
        expect(result.pageSize).toBe(10);
        done();
      });
    });

    it('falls back to page 1 when page is not a number', (done) => {
      const { controller, adsService } = createController();

      controller.getAllUnpublished('not-a-number', undefined).subscribe(() => {
        expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 0, limit: 20 });
        done();
      });
    });

    it('clamps a negative or zero page to 1 instead of computing a negative skip', (done) => {
      const { controller, adsService } = createController();

      controller.getAllUnpublished('-5', undefined).subscribe(() => {
        expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 0, limit: 20 });
        adsService.findAllUnpublished.mockClear();

        controller.getAllUnpublished('0', undefined).subscribe(() => {
          expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 0, limit: 20 });
          done();
        });
      });
    });

    it('falls back a zero pageSize to the 20 default', (done) => {
      const { controller, adsService } = createController();

      controller.getAllUnpublished(undefined, '0').subscribe(() => {
        expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 0, limit: 20 });
        done();
      });
    });

    it('falls back a negative pageSize to the 20 default, not to 1', (done) => {
      // 0 and a negative value are both invalid and must behave the same
      // way - only a strictly positive pageSize is used as-is.
      const { controller, adsService } = createController();

      controller.getAllUnpublished(undefined, '-10').subscribe(() => {
        expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 0, limit: 20 });
        done();
      });
    });

    it('falls back a non-numeric pageSize to the 20 default', (done) => {
      const { controller, adsService } = createController();

      controller.getAllUnpublished(undefined, 'not-a-number').subscribe(() => {
        expect(adsService.findAllUnpublished).toHaveBeenCalledWith({ skip: 0, limit: 20 });
        done();
      });
    });

    it('combines the listed items and the total count into one paginated result', (done) => {
      const { controller, adsService } = createController({
        adsService: {
          findAllUnpublished: jest
            .fn()
            .mockReturnValue(of([{ id: '1', status: 'SUBMITTED', owner: {} }])),
          countUnpublished: jest.fn().mockReturnValue(of(1)),
        },
      });

      controller.getAllUnpublished('1', '20').subscribe((result) => {
        expect(result.items).toHaveLength(1);
        expect(result.items[0].id).toBe('1');
        expect(result.total).toBe(1);
        done();
      });
    });
  });

  describe('getAllPublished', () => {
    it('queries findAllPublished with an empty filter and the parsed pagination', (done) => {
      const { controller, adsService } = createController();

      controller.getAllPublished('2', '5').subscribe(() => {
        expect(adsService.findAllPublished).toHaveBeenCalledWith({}, { skip: 5, limit: 5 });
        expect(adsService.countPublished).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getAllArchived', () => {
    it('populates owner (needed for the "utilisateur" column) and paginates', (done) => {
      const { controller, adsService } = createController();

      controller.getAllArchived('1', '20').subscribe(() => {
        expect(adsService.findAllArchived).toHaveBeenCalledWith({
          skip: 0,
          limit: 20,
          populate: ['owner'],
        });
        expect(adsService.countArchived).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('approveUnpublished', () => {
    it('resolves the moderator identity from the bearer token and forwards it to publish()', (done) => {
      const { controller, adsService, moderatorIdentityService } = createController({
        moderatorIdentityService: {
          resolve: jest.fn().mockReturnValue(of('mod@bella.test')),
        },
      });

      controller
        .approveUnpublished('ad-1', requestWith('Bearer a.jwt.token'))
        .subscribe((result) => {
          expect(moderatorIdentityService.resolve).toHaveBeenCalledWith('a.jwt.token');
          expect(adsService.publish).toHaveBeenCalledWith('ad-1', 'mod@bella.test');
          expect(result.id).toBe('1');
          done();
        });
    });

    it('resolves undefined (no token) when the Authorization header is missing', (done) => {
      const { controller, adsService, moderatorIdentityService } = createController();

      controller.approveUnpublished('ad-1', requestWith(undefined)).subscribe(() => {
        expect(moderatorIdentityService.resolve).toHaveBeenCalledWith(undefined);
        expect(adsService.publish).toHaveBeenCalledWith('ad-1', undefined);
        done();
      });
    });

    it('resolves undefined when the Authorization header is not a Bearer token', (done) => {
      const { controller, moderatorIdentityService } = createController();

      controller.approveUnpublished('ad-1', requestWith('Basic dXNlcjpwYXNz')).subscribe(() => {
        expect(moderatorIdentityService.resolve).toHaveBeenCalledWith(undefined);
        done();
      });
    });
  });

  describe('reject', () => {
    it('forwards the reason and the resolved moderator identity', (done) => {
      const { controller, adsService, moderatorIdentityService } = createController({
        moderatorIdentityService: {
          resolve: jest.fn().mockReturnValue(of('mod@bella.test')),
        },
      });

      controller
        .reject('ad-1', { reason: 'duplicate listing' }, requestWith('Bearer token'))
        .subscribe((result) => {
          expect(adsService.reject).toHaveBeenCalledWith(
            'ad-1',
            'duplicate listing',
            'mod@bella.test'
          );
          expect(result.id).toBe('1');
          done();
        });
    });
  });

  describe('archive', () => {
    it('forwards the reason and the resolved moderator identity', (done) => {
      const { controller, adsService, moderatorIdentityService } = createController({
        moderatorIdentityService: {
          resolve: jest.fn().mockReturnValue(of('mod@bella.test')),
        },
      });

      controller
        .archive('ad-1', { reason: 'sold elsewhere' }, requestWith('Bearer token'))
        .subscribe((result) => {
          expect(adsService.archive).toHaveBeenCalledWith(
            'ad-1',
            'sold elsewhere',
            'mod@bella.test'
          );
          expect(result.id).toBe('1');
          done();
        });
    });
  });
});
