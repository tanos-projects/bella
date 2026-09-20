// This file was still the Nx scaffold, so `nx build admin` failed to compile:
// three services read `authConfig` and `apiBaseUrl`, which did not exist here.
//
// TODO Confirm the admin console's public host before deploying. `redirect_uri`
// and `logoutUrl` must match entries in the Auth0 application's Allowed
// Callback URLs / Allowed Logout URLs exactly, or login fails at runtime with
// a callback mismatch. The values below assume an `admin.` subdomain alongside
// the webapp's `www.dev.bellannonces.com`.
export const environment = {
  production: true,
  isMobileMode: true,
  authConfig: {
    domain: 'dev-bata.eu.auth0.com',
    clientId: 'SwrAN2wpotPHDX3qolANvGM7g1kA19rE',
    authorizationParams: {
      redirect_uri: 'https://admin.dev.bellannonces.com/loggedIn',
      audience: 'https://base-api/'
    },
    logoutUrl: 'https://admin.dev.bellannonces.com',
  },
  apiBaseUrl: 'https://api-dev1.bellannonces.com/api/admin',
};
