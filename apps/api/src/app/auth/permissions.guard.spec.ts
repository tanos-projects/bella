import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsGuard } from './permissions.guard';

function createContext(user: { permissions?: string[] } | undefined): ExecutionContext {
  return {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  function createGuard(required: string[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new PermissionsGuard(reflector);
  }

  it('allows the request through when the handler requires no permission', () => {
    const guard = createGuard(undefined);
    expect(guard.canActivate(createContext({ permissions: [] }))).toBe(true);
  });

  it('allows the request through when the caller holds every required permission', () => {
    const guard = createGuard(['manage:publications']);
    expect(
      guard.canActivate(
        createContext({ permissions: ['manage:publications', 'something:else'] })
      )
    ).toBe(true);
  });

  it('rejects a caller missing the required permission', () => {
    const guard = createGuard(['manage:publications']);
    expect(() =>
      guard.canActivate(createContext({ permissions: ['something:else'] }))
    ).toThrow(ForbiddenException);
  });

  it('rejects a caller with no permissions claim at all', () => {
    const guard = createGuard(['manage:publications']);
    expect(() => guard.canActivate(createContext({}))).toThrow(ForbiddenException);
  });

  it('requires every listed permission, not just one', () => {
    const guard = createGuard(['manage:publications', 'manage:users']);
    expect(() =>
      guard.canActivate(createContext({ permissions: ['manage:publications'] }))
    ).toThrow(ForbiddenException);
  });
});
