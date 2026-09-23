import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { ModeratorIdentityService } from './moderator-identity.service';

function createService(
  getReturnValue: (userinfo: unknown) => ReturnType<HttpService['get']>,
  upsertReturnValue?: (identity: unknown) => ReturnType<
    import('../infrastructure/persistence/repositories/moderator-identity-repository-nest').ModeratorIdentityRepositoryNest['upsert']
  >
) {
  const http = {
    get: jest.fn(getReturnValue as never),
  } as unknown as jest.Mocked<HttpService>;
  const configService = {
    get: jest.fn().mockReturnValue('https://dev-bata.eu.auth0.com/'),
  } as unknown as ConfigService;
  // Default: echoes back whatever it was asked to upsert, like a real
  // upsert-by-idpId would once persisted.
  const moderatorIdentityRepository = {
    upsert: jest.fn(upsertReturnValue ?? ((identity: unknown) => of(identity))),
  } as unknown as import('../infrastructure/persistence/repositories/moderator-identity-repository-nest').ModeratorIdentityRepositoryNest;
  return {
    service: new ModeratorIdentityService(http, configService, moderatorIdentityRepository),
    http,
    moderatorIdentityRepository,
  };
}

function axiosResponse(data: unknown): AxiosResponse {
  return { data } as AxiosResponse;
}

describe('ModeratorIdentityService', () => {
  it('resolves undefined without calling /userinfo when there is no token', (done) => {
    const { service, http, moderatorIdentityRepository } = createService(() =>
      of(axiosResponse({}))
    );

    service.resolve(undefined).subscribe((identity) => {
      expect(identity).toBeUndefined();
      expect(http.get).not.toHaveBeenCalled();
      expect(moderatorIdentityRepository.upsert).not.toHaveBeenCalled();
      done();
    });
  });

  it('calls /userinfo, upserts the local record by sub, and returns the email', (done) => {
    const { service, http, moderatorIdentityRepository } = createService(() =>
      of(axiosResponse({ sub: 'auth0|mod-1', email: 'mod@bella.test', name: 'Mod' }))
    );

    service.resolve('a.jwt.token').subscribe((identity) => {
      expect(http.get).toHaveBeenCalledWith(
        'https://dev-bata.eu.auth0.com/userinfo',
        { headers: { Authorization: 'Bearer a.jwt.token' } }
      );
      expect(moderatorIdentityRepository.upsert).toHaveBeenCalledWith({
        idpId: 'auth0|mod-1',
        email: 'mod@bella.test',
        name: 'Mod',
      });
      expect(identity).toBe('mod@bella.test');
      done();
    });
  });

  it('falls back to name when the upserted record has no email', (done) => {
    const { service } = createService(() =>
      of(axiosResponse({ sub: 'auth0|mod-1', name: 'Mod' }))
    );

    service.resolve('a.jwt.token').subscribe((identity) => {
      expect(identity).toBe('Mod');
      done();
    });
  });

  it('resolves undefined instead of throwing when /userinfo fails', (done) => {
    const { service, moderatorIdentityRepository } = createService(() =>
      throwError(() => new Error('timeout'))
    );

    service.resolve('a.jwt.token').subscribe((identity) => {
      expect(identity).toBeUndefined();
      expect(moderatorIdentityRepository.upsert).not.toHaveBeenCalled();
      done();
    });
  });

  it('resolves undefined instead of throwing when the upsert fails', (done) => {
    const { service } = createService(
      () => of(axiosResponse({ sub: 'auth0|mod-1', email: 'mod@bella.test' })),
      () => throwError(() => new Error('Mongo unavailable'))
    );

    service.resolve('a.jwt.token').subscribe((identity) => {
      expect(identity).toBeUndefined();
      done();
    });
  });
});
