export interface AuthUser {
  nickname?: string;
  name?: string;
  picture?: string;
  updated_at: string;
  email?: string;
  email_verified?: boolean;
  sub?: string;
  // Present when the Auth0 tenant has RBAC enabled on this API and
  // "Add Permissions in the Access Token" is turned on for it — see
  // PermissionsGuard and issue #49.
  permissions?: string[];
}
