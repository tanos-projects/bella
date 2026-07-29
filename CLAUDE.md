# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Bella is a classifieds/listings platform ("annonces") for an African market — the successor to the `afrik-tangazo` repository, restructured as an **Nx 15 monorepo** (`npmScope: bella`). Three deployable apps share a framework-agnostic domain layer:

- `apps/webapp/` — Angular 14 PWA, the public product UI (port 4200)
- `apps/admin/` — Angular 14 back-office for moderating publications, NgRx store (port 4300)
- `apps/api/` — NestJS 9 API on MongoDB/Mongoose (port 3000, global prefix `/api`)
- `apps/webapp-e2e/`, `apps/admin-e2e/` — Cypress e2e projects

Shared libraries under `libs/`, imported through the `@bella/*` path aliases declared in `tsconfig.base.json`:

| Alias | Path | Contents |
|---|---|---|
| `@bella/api/domain` | `libs/api/domain` | Entities, domain services, repository **interfaces** |
| `@bella/api/adapters` | `libs/api/adapters` | Entity ↔ DTO mappers |
| `@bella/dtos` | `libs/dtos` | DTOs shared by the API and both front-ends |

`libs/dtos` is what keeps the front-ends and the API in sync — a DTO change is a cross-app change.

## Commands

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

Project names are not directory names: `libs/api/domain` is the **`api-domain`** project, `libs/api/adapters` is **`api-adapters`**. `nx show projects` does not exist on Nx 15 — read the `name` field of each `project.json`, or use `npx nx print-affected --type=app --select=projects` to list the apps a diff touches.

Jest is configured per project (`jest.config.ts` at the root only aggregates via `getJestProjects()`), so a root-level jest invocation will not do what you expect — go through Nx.

Nx Cloud is configured as the task runner in `nx.json`. Set `NX_NO_CLOUD=true` to run offline.

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

`AdStatus` (`libs/api/domain/src/lib/ads/ad.entity.ts`) declares `DRAFT → SUBMITTED → APPROVED → PUBLISHED`, plus `REJECTED` and `ARCHIVED`. Note that `APPROVED` is declared but never assigned; `publish()` moves straight to `PUBLISHED` (there is a `TODO` saying it should pass through `APPROVED` first).

`AdsService.submit`/`publish`/`reject`/`archive` are marked with `FIXME` comments and are **not** in a trustworthy state: `publish()`, `reject()` and `archive()` have their originating-state lookup commented out entirely, so they transition an ad from whatever state it happens to be in, and `submit()` spreads the result of a lookup that it never checks matched (`{...null}` is `{}` in JavaScript, so a missed guard still runs the update). Treat any change here as a state-machine change and cover it with tests.

### Authorization gaps to be aware of

Several guards are commented out rather than absent, which is easy to misread as intentional:

- `AdminPublicationController` (`api/admin/admin-publication.controller.ts`) is registered in `ApiModule` with its `@UseGuards(JwtAuthGuard)` commented out, and `main.ts` installs no global guard — `/api/admin/publications/*` approve/reject/archive are reachable **unauthenticated**.
- The `admin` app's routes (`apps/admin/src/app/app.routes.ts`) likewise have `canActivate: [AuthGuard]` commented out.
- `POST /api/publications/:id/publish` is guarded by `JwtAuthGuard` only, with no ownership or role check, so any authenticated user can publish any ad.

There is no role/permission model anywhere yet — `JwtAuthGuard` only proves *a* valid Auth0 token.

## Front-end architecture (webapp and admin)

Both are Angular 14 with lazy-loaded feature modules and Auth0 (`@auth0/auth0-angular`) configured in `src/environments/environment.ts` (`authConfig`, `apiBaseUrl`).

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
