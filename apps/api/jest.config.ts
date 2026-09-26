/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  // `AdSearchQueryDTO` (apps/api/src/app/api/ad-search-query.dto.ts) uses
  // class-validator/class-transformer decorators, which need
  // `Reflect.getMetadata`/`defineMetadata` polyfilled by `reflect-metadata`
  // before they run. In production this happens by accident, as a side
  // effect of `@nestjs/core` requiring `reflect-metadata` before
  // `AppModule` (see the explicit import added to `apps/api/src/main.ts`),
  // but a Jest worker can load a spec file that imports
  // `AdSearchQueryDTO`/`AdsController` (which instantiates a
  // `ValidationPipe` at module load, apps/api/src/app/api/ads.controller.ts)
  // before anything transitively requires `@nestjs/core` in that same
  // process. `setupFiles` runs once per worker before any test file,
  // independently of file load order.
  setupFiles: ['reflect-metadata'],
  // Second, separate cause of the same flaky `api:test` symptom (both
  // manifest through the exact same misleading NestJS message - see
  // CHANTIER-MODERNISATION.md for how they were told apart): in this
  // worktree, `class-validator`/`class-transformer` (declared in
  // package.json, Phase 2 sub-point 4) are installed for real only under
  // this worktree's own node_modules - `node_modules/@nestjs` here is a
  // single symlink to the shared `/home/tanos/bella/node_modules/@nestjs`,
  // so Node's default (non-`--preserve-symlinks`) resolution, walking up
  // from `@nestjs/common`'s *real* path when `ValidationPipe` does
  // `require('class-validator')`, never re-enters this worktree's tree and
  // throws "Cannot find module 'class-validator'" - swallowed by
  // `@nestjs/common`'s `loadPackage` into the same generic "package is
  // missing" message. Mapped explicitly to this worktree's real install so
  // resolution doesn't depend on the requiring file's location.
  moduleNameMapper: {
    '^class-validator$': '<rootDir>/../../node_modules/class-validator',
    '^class-transformer$': '<rootDir>/../../node_modules/class-transformer',
  },
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
};
