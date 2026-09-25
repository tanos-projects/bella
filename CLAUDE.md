# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Bella is a classifieds/listings platform ("annonces") for an African market — the successor to the `afrik-tangazo` repository, restructured as an **Nx 22 monorepo** (`npmScope: bella`). Three deployable apps share a framework-agnostic domain layer:

- `apps/webapp/` — Angular 22 PWA, the public product UI (port 4200)
- `apps/admin/` — Angular 22 back-office for moderating publications, NgRx store (port 4300)
- `apps/api/` — NestJS 12 API on MongoDB/Mongoose (port 3000, global prefix `/api`)
- `apps/webapp-e2e/`, `apps/admin-e2e/` — Cypress e2e projects

Shared libraries under `libs/`, imported through the `@bella/*` path aliases declared in `tsconfig.base.json`:

| Alias | Path | Contents |
|---|---|---|
| `@bella/api/domain` | `libs/api/domain` | Entities, domain services, repository **interfaces** |
| `@bella/api/adapters` | `libs/api/adapters` | Entity ↔ DTO mappers |
| `@bella/dtos` | `libs/dtos` | DTOs shared by the API and both front-ends |

`libs/dtos` is what keeps the front-ends and the API in sync — a DTO change is a cross-app change.

## Commands

Node `>=24.9 <25` (`package.json` `engines`; `.nvmrc` pins the exact version this repo is qualified against, `24.21.0` — run `nvm use` before installing). Required since the NestJS 11→12 bump: `apps/api`'s Jest suite needs Jest's native `require(esm)` support, which lands at Node 24.9 (see `apps/api/.env.test`, which scopes `NODE_OPTIONS=--experimental-vm-modules` to the `api` project's `test` target only, so `nx run-many --target=test --all` doesn't need it set in the shell and it doesn't leak into `webapp`/`admin`'s test runs).

Nx drives everything; the root `package.json` scripts are thin wrappers (`yarn start` → `nx serve`, etc.). Target a project explicitly:

```bash
yarn install

npx nx serve webapp           # :4200, proxies /api via apps/webapp/proxy.conf.json
npx nx serve admin            # :4300
npx nx serve api              # :3000, Swagger on /api

npx nx build api              # → dist/apps/api
npx nx test api-domain        # a single project
npx nx run-many --target=test --all
npx nx affected --target=test # only what the current diff touches
npx nx lint webapp
npx nx e2e webapp-e2e
```

Project names are not directory names: `libs/api/domain` is the **`api-domain`** project, `libs/api/adapters` is **`api-adapters`**. `npx nx show projects` lists them; use `npx nx print-affected --type=app --select=projects` to list only the apps a diff touches.

Jest is configured per project (`jest.config.ts` at the root only aggregates via `getJestProjects()`), so a root-level jest invocation will not do what you expect — go through Nx.

Caching is local: `nx.json` uses Nx's default task runner, with `build`, `lint`, `test` and `e2e` marked cacheable. Nx Cloud is not wired up — it previously was, with its access token committed in cleartext. To turn remote caching back on, issue a fresh token and pass it as `NX_CLOUD_ACCESS_TOKEN` in the environment rather than putting it back in `nx.json`.

The API needs a `.env` (copy `.env.dist`): `DATABASE_URL` (local MongoDB), `CORS_ALLOW_LIST`, and Auth0 `AUTH_ISSUER_URL` / `AUTH_AUDIENCE`. Seed data lives in `apps/api/src/app/infrastructure/fixtures/*.fixture.mongodb`.

## API architecture

Hexagonal, and the split is enforced by the library boundary rather than by convention alone:

- **`libs/api/domain/src/lib/<feature>/`** — framework-agnostic core: entity (`ad.entity.ts`), `*.service.ts` holding the business rules, and a `*.repository.ts` **interface** the service depends on. No Nest imports here.
- **`apps/api/src/app/infrastructure/<feature>/`** — Nest wiring: a `*.module.ts` and a `*.service.ts` that extends the domain service, injecting a Nest repository implementation.
- **`apps/api/src/app/infrastructure/persistence/`** — Mongoose `schemas/*.schema.ts` and `repositories/*-repository-nest.ts` implementing the domain interfaces.
- **`apps/api/src/app/api/`** — controllers. They depend on the infrastructure services and never touch persistence directly. Admin controllers live in `api/admin/`.
- **`apps/api/src/app/auth/`** — Auth0 JWT validation (`passport-jwt` + `jwks-rsa`); `JwtAuthGuard` is a thin `AuthGuard('jwt')`.

Feature domains: `ads`, `categories`, `cities`, `countries`, `users`. Adding one means mirroring the same domain → infrastructure → api split and registering the module in `infrastructure.module.ts`'s `DOMAIN_MODULES` array plus the controller in `api.module.ts`.

`AdsRepositoryNest` is the most involved repository — it builds Mongo filters dynamically, including `$text` search on `keyword` and `$gte`/`$lte` ranges on `minPrice`/`maxPrice`.

### Ad lifecycle

`AdStatus` (`libs/api/domain/src/lib/ads/ad.entity.ts`) declares `DRAFT → SUBMITTED → PUBLISHED`, plus `REJECTED` and `ARCHIVED`. It previously also declared `APPROVED`, but that value was never assigned by any code path — `publish()` always moved straight from `SUBMITTED` to `PUBLISHED` — and no product need for a separate approval step was ever identified, so it was removed from the enum (CHANTIER-MODERNISATION.md §7.2).

`AdsService.submit`/`publish`/`reject`/`archive` all go through a central guard, `transitionTo()`: the lookup preceding each transition (`findOneDraft`/`findOneUnpublished`/`findOne`) is checked explicitly (`if (!ad) throwError(() => new AdNotInExpectedStateError(...))`), so a missed match no longer falls through to the update — there is no blind spread of a possibly-`null` lookup result. `reject()`/`archive()` deliberately use `ANY_STATUS` (transition allowed from any originating state) as a documented product choice — an ad can be rejected/archived regardless of its current state, only its existence is required — not an oversight; the comment above `transitionTo()` spells out the history of the bug this guard replaced. `ads.service.spec.ts` covers all four transition guards plus `submit`/`publish`/`reject`/`archive` themselves. Treat any change here as a state-machine change and cover it with tests.

### Authorization (issue #49)

The gaps issue #49 tracked are closed: `AdminPublicationController` is guarded
by `JwtAuthGuard` + `PermissionsGuard`, requiring the `manage:publications`
Auth0 RBAC permission (`AuthUser.permissions`, populated from the access
token's `permissions` claim — see `apps/api/src/app/auth/permissions.guard.ts`
and `.decorator.ts`); `AdsController`'s `publish` endpoint now checks
ownership or that same permission instead of accepting any authenticated
caller; the admin app's routes have `AuthGuard` back on `dashboard` and
`publications`, and `AuthenticationModule`'s `httpInterceptor.allowedList`
covers the four admin API calls. `dashboard` and `publications` also carry
`PermissionsGuard` (`apps/admin/src/app/auth/permissions.guard.ts`), which
decodes the `permissions` claim off the Auth0 access token
(`getAccessTokenSilently()`) and redirects to `/access-denied` when
`manage:publications` is missing — the front-end UX gap noted below is
closed, mirroring the API's `PermissionsGuard` rather than duplicating its
trust boundary (the API guard is still what actually enforces this).

## Front-end architecture (webapp and admin)

Both are Angular 22 with lazy-loaded feature modules and Auth0 (`@auth0/auth0-angular`) configured in `src/environments/environment.ts` (`authConfig`, `apiBaseUrl`).

`webapp` route guards:
- `AuthGuard` (Auth0) — requires login.
- `CompleteProfileGuard` (`app/auth/`) — requires a completed profile; paired with `AuthGuard` on `bookmarks`, `post-an-ad`, `my-publications`.
- `WelcomeGuard` — gates most routes behind the onboarding flow, applied via `canLoad`.

`AuthModule.forRoot(...)` carries an explicit `httpInterceptor.allowedList` — **any new authenticated API call must be added to it** or the JWT will not be attached.

`webapp/src/app/shared/` holds the reusable layer: `services/` (one per API resource), `models/`, `components/`, and `form/` (built on `@ngx-formly`, with custom field types used by the multi-step ad posting form under `pages/post-an-ad/`).

`admin` uses NgRx (`src/app/store/publications/` — actions, effects, state, store) for the moderation queue.

Locale is French (`LOCALE_ID: 'fr'`), translations under `src/assets/i18n/` via `@ngx-translate`. Image uploads go through Cloudinary. PWA/offline support via `@angular/service-worker`.

## Deployment

`ecosystem.config.js` describes the only wired-up deployment: **PM2 in cluster mode on an AWS EC2 host**, serving `dist/apps/api/main.js`, with `pm2 deploy` targeting `origin/dev` (development) and `origin/main` (production). `Procfile` (`web: yarn start api`) is a leftover from a Heroku-style buildpack host. Neither front-end has a deployment configuration in the repository.

`ecosystem.config.js` doesn't pin a Node version itself (no `interpreter` path) — it runs under whatever `node` PM2 finds on the EC2 host's `PATH`, so the NestJS 12 bump (needs Node `>=24.9`, see Commands above) only actually works in production once that host's Node is upgraded — outside this repo, not tracked here.
