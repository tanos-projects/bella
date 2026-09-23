// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  isMobileMode: true,
  authConfig: {
    domain: 'dev-bata.eu.auth0.com',
    clientId: '53tGhIBsmv1zPnS7Zne8cBY9XqdySKi0',
    authorizationParams: {
      redirect_uri: 'http://localhost:4200/loggedIn',
      audience: 'https://base-api/',
      scope: 'openid profile email offline_access'
    },
    logoutUrl: 'http://localhost:4200',
    // See apps/admin/src/environments/environment.ts for why: default
    // cacheLocation ('memory') is wiped on reload and falls back to a
    // prompt=none iframe that needs third-party cookies to dev-bata.eu.auth0.com.
    cacheLocation: 'localstorage' as const,
    useRefreshTokens: true,
  },
  apiBaseUrl: 'http://localhost:3000/api',
  contactApi: {
    whatsapp: 'https://wa.me/',
    whatsappMobile: 'whatsapp://',
    whatsappWeb: 'https://web.whatsapp.com/'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
