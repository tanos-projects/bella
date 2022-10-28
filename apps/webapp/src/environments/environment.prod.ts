export const environment = {
  production: true,
  isMobileMode: true,
  authConfig: {
    domain: 'dev-bata.eu.auth0.com',
    clientId: '53tGhIBsmv1zPnS7Zne8cBY9XqdySKi0',
    redirectUri: 'https://main.d2s7lfd8fx3bhd.amplifyapp.com/loggedIn',
    audience: 'https://base-api/',
    logoutUrl: 'https://main.d2s7lfd8fx3bhd.amplifyapp.com'
  },
  apiBaseUrl: 'https://tangazo-api.herokuapp.com',
  contactApi: {
    whatsapp: 'https://wa.me/',
    whatsappMobile: 'whatsapp://',
    whatsappWeb: 'https://web.whatsapp.com/'
  }
};
