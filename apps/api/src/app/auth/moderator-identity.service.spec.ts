import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { ModeratorIdentityService } from './moderator-identity.service';

function createService(
  getReturnValue: (userinfo: { email?: string; name?: string }) => ReturnType<HttpService['get']>
) {
  const http = {
    get: jest.fn(getReturnValue as never),
  } as unknown as jest.Mocked<HttpService>;
  const configService = {
    get: jest.fn().mockReturnValue('https://dev-bata.eu.auth0.com/'),
  } as unknown as ConfigService;
  return { service: new ModeratorIdentityService(http, configService), http };
}

function axiosResponse(data: unknown): AxiosResponse {
  return { data } as AxiosResponse;
}

describe('ModeratorIdentityService', () => {
  it('resolves undefined without calling /userinfo when there is no token', (done) => {
    const { service, http } = createService(() => of(axiosResponse({})));

    service.resolve(undefined).subscribe((identity) => {
      expect(identity).toBeUndefined();
      expect(http.get).not.toHaveBeenCalled();
      done();
    });
  });

  it('calls /userinfo with the bearer token and returns the email', (done) => {
    const { service, http } = createService(() =>
      of(axiosResponse({ email: 'mod@bella.test', name: 'Mod' }))
    );

    service.resolve('a.jwt.token').subscribe((identity) => {
      expect(http.get).toHaveBeenCalledWith(
        'https://dev-bata.eu.auth0.com/userinfo',
        { headers: { Authorization: 'Bearer a.jwt.token' } }
      );
      expect(identity).toBe('mod@bella.test');
      done();
    });
  });

  it('falls back to name when /userinfo has no email', (done) => {
    const { service } = createService(() => of(axiosResponse({ name: 'Mod' })));

    service.resolve('a.jwt.token').subscribe((identity) => {
      expect(identity).toBe('Mod');
      done();
    });
  });

  it('resolves undefined instead of throwing when /userinfo fails', (done) => {
    const { service } = createService(() => throwError(() => new Error('timeout')));

    service.resolve('a.jwt.token').subscribe((identity) => {
      expect(identity).toBeUndefined();
      done();
    });
  });
});
