// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  isMobileMode: true,
  authConfig: {
    domain: 'dev-bata.eu.auth0.com',
    clientId: '53tGhIBsmv1zPnS7Zne8cBY9XqdySKi0',
    redirectUri: 'http://localhost:4200/loggedIn',
    audience: 'https://base-api/',
    logoutUrl: 'http://localhost:4200'
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
