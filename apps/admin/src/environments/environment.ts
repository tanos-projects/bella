// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  isMobileMode: true,
  authConfig: {
    domain: 'dev-bata.eu.auth0.com',
    clientId: 'SwrAN2wpotPHDX3qolANvGM7g1kA19rE',
    authorizationParams: {
      redirect_uri: 'http://localhost:4300/loggedIn',
      audience: 'https://base-api/',
      scope: 'openid profile email offline_access'
    },
    logoutUrl: 'http://localhost:4300',
    // Default cacheLocation is 'memory', wiped on every reload — this then
    // depends on a prompt=none iframe to dev-bata.eu.auth0.com to silently
    // re-authenticate, which needs third-party cookies and fails in current
    // Chrome defaults. localstorage + refresh tokens avoid that iframe
    // entirely. Requires "Allow Offline Access" enabled on the
    // https://base-api/ API in the Auth0 dashboard for the refresh token
    // to actually be issued.
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true,
  },
  apiBaseUrl: 'http://localhost:3000/api/admin',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
