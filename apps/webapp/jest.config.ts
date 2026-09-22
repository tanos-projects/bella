export default {
  displayName: 'webapp',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/webapp',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  // swiper and its dependencies ship ESM under a .js extension, so the default
  // "only transform .mjs" rule leaves them untransformed and Jest chokes on
  // `export`. Any spec that pulls in the carousel hits this.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.*\\.mjs$|swiper|ssr-window|dom7))',
  ],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
