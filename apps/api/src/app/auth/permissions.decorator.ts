import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Requires every listed Auth0 permission to be present in the caller's
 * access token (the `permissions` claim, populated when RBAC + "Add
 * Permissions in the Access Token" are enabled on the API in the Auth0
 * dashboard). Enforced by PermissionsGuard.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
