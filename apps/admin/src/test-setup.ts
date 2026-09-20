import { TextDecoder, TextEncoder } from 'util';

// jsdom doesn't provide these; @auth0/auth0-angular's dpop dependency needs them at import time.
if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder;
}

import 'jest-preset-angular/setup-jest';
