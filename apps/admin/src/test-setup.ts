import { TextDecoder, TextEncoder } from 'util';

// jsdom doesn't provide these; @auth0/auth0-angular's dpop dependency needs them at import time.
if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
  (globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
}

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();
