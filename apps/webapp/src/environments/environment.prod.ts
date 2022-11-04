export const environment = {
  production: true,
  isMobileMode: true,
  authConfig: {
    domain: 'dev-bata.eu.auth0.com',
    clientId: '53tGhIBsmv1zPnS7Zne8cBY9XqdySKi0',
    redirectUri: 'https://www.dev.bellannonces.com/loggedIn',
    audience: 'https://base-api/',
    logoutUrl: 'https://www.dev.bellannonces.com'
  },
  apiBaseUrl: 'https://api-dev.bellannonces.com/api',
  contactApi: {
    whatsapp: 'https://wa.me/',
    whatsappMobile: 'whatsapp://',
    whatsappWeb: 'https://web.whatsapp.com/'
  }
};
