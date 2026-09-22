---
name: run-bella
description: Build, run, and smoke-test bella's three apps (api, webapp, admin) together. Use when asked to run bella locally, start the api/webapp/admin dev servers, verify bella works end-to-end, or screenshot the webapp/admin UI.
---

Bella is an Nx monorepo with three dev servers that only prove anything
when run **together**: `api` (NestJS on :3000), `webapp` (Angular on
:4200), `admin` (Angular on :4300) — webapp/admin proxy `/api/*` to the
NestJS server, so a real end-to-end check means all three up and one
talking to the others. Drive it via
`.claude/skills/run-bella/driver.sh`, a curl-based smoke script — see
"Run (agent path)".

All paths below are relative to the repo root, **`/home/tanos/bella`**
(ext4). A stale copy also exists at
`/mnt/c/Users/latannon/Kaibee/Projects/Perso/tanos/bella` (DrvFs) — do
not work from it; see Gotchas. Every command below needs
`dangerouslyDisableSandbox: true` if run through Claude Code's Bash
tool, since `/home/tanos/bella` is outside that tool's default sandboxed
working directory.

## Prerequisites

- Node 22, yarn 1.x, `node_modules` already installed (this skill
  doesn't cover a from-scratch install).
- MongoDB reachable on `localhost:27017`. In this container it already
  runs as a system service (`/usr/bin/mongod --config /etc/mongod.conf`,
  user `mongodb`) with a seeded `tangazo` database — don't start a
  second `mongod`, see Gotchas.
- `apps/api/.env` — copy from the template if missing:

```bash
[ -f /home/tanos/bella/.env ] || cp /home/tanos/bella/.env.dist /home/tanos/bella/.env
```

## Build

No separate build step for local dev — `nx serve` compiles in watch
mode. (`npx nx build <project>` works the same as any other Nx target
if a production bundle is needed; not covered here.)

## Run (agent path)

1. Confirm Mongo is up (don't start your own — see Gotchas):

```bash
ss -tlnp | grep 27017 || echo "mongo not running — start the system service or your own instance first"
```

2. Launch all three dev servers in the background. **Must** use the
   Bash tool's `run_in_background: true` — a bare `cmd &` inside the
   tool call is killed silently the moment the tool call returns (a
   Claude Code sandbox quirk, not a real backgrounding failure):

```bash
cd /home/tanos/bella && npx nx serve api    > /home/tanos/bella/.api-serve.log    2>&1   # run_in_background: true
cd /home/tanos/bella && npx nx serve webapp > /home/tanos/bella/.webapp-serve.log 2>&1   # run_in_background: true
cd /home/tanos/bella && npx nx serve admin  > /home/tanos/bella/.admin-serve.log  2>&1   # run_in_background: true
```

3. Wait for compilation (api ~15s, webapp/admin ~35-45s each), then
   smoke-test all three at once:

```bash
until grep -q "Application is running on" /home/tanos/bella/.api-serve.log 2>/dev/null; do sleep 3; done
until grep -q "Compiled successfully" /home/tanos/bella/.webapp-serve.log 2>/dev/null; do sleep 3; done
until grep -q "Compiled successfully" /home/tanos/bella/.admin-serve.log 2>/dev/null; do sleep 3; done
/home/tanos/bella/.claude/skills/run-bella/driver.sh
```

Expected output — every line `OK`, exit code 0:

```
=== API ===
OK    health  (http://localhost:3000/api/health)
OK    seed data  (http://localhost:3000/api/countries)
OK    swagger  (http://localhost:3000/api-json)
=== webapp (port 4200) ===
OK    page loads  (http://localhost:4200/)
OK    api proxy  (http://localhost:4200/api/countries)
=== admin (port 4300) ===
OK    page loads  (http://localhost:4300/)
OK    api proxy  (http://localhost:4300/api/countries)
=== all checks passed ===
```

`driver.sh` takes optional `[api-port] [webapp-port] [admin-port]`
args if you served on non-default ports.

Logs land at `/home/tanos/bella/.{api,webapp,admin}-serve.log`.

To stop: find each dev server's PID (`ss -tlnp | grep -E '3000|4200|4300'`)
and `kill` it — `nx serve` doesn't register its own cleanup handler
across a background-and-abandon launch.

## Run (human path)

Same three `npx nx serve <project>` commands, run in three separate
terminals (foreground, no log redirection needed) — then open
`http://localhost:4200` (webapp) or `:4300` (admin) in a browser.
`Ctrl-C` each terminal to stop.

## Test

```bash
npx nx run-many --target=test --all
```

Not re-run as part of this skill's verification — `driver.sh` checks
the apps actually run, which `test` doesn't.

---

## Gotchas

- **`/mnt/c/.../bella` vs `/home/tanos/bella` look like two copies of
  the same repo but aren't interchangeable.** The DrvFs copy
  (`/mnt/c/...`) is a frozen backup from a filesystem migration — work
  in `/home/tanos/bella` (ext4) only. They can drift: check
  `git log --oneline -5` on both before assuming either is current if
  you're not sure which one has the latest work.
- **A second `mongod` will not start cleanly.** The system service
  already holds port 27017 *and* owns `/tmp/mongodb-27017.sock` (as
  user `mongodb`) — a second instance fails with `Failed to unlink
  socket file ... Operation not permitted` even with a different
  `--unixSocketPrefix`, then `Address already in use` on the port
  itself. Just check the system service is up; don't launch your own.
- **Stray, unrelated processes can squat the exact ports this app
  needs.** In this container an old build of bella's predecessor repo
  (`afrik-tangazo`) was still listening on :3000 from days earlier, and
  a manually-started `ng serve` (not via `nx serve`, so it skipped
  `proxy.conf.json`) was squatting :4200 — its page loaded fine but
  `/api/*` 404'd through it. Always `ss -tlnp | grep -E '3000|4200|4300'`
  and check *what* the process is (`ps -p <pid> -o cmd`) before trusting
  something already listening; prefer killing and relaunching via
  `nx serve` over reusing a process you didn't start yourself.
- **Editing a `project.json` target doesn't always take effect
  immediately** — Nx can serve a cached project graph. If a fix to
  `project.json` doesn't change the error `nx serve` produces,
  `rm -rf /home/tanos/bella/.nx/cache` and retry.
- **A full browser-driven screenshot (Cypress) doesn't work in this
  specific container.** `npx cypress run` fails with `error while
  loading shared libraries: libgobject-2.0.so.0` and this container has
  no passwordless `sudo`, so the missing system lib can't be installed
  from here. `.claude/skills/run-bella/screenshot.cy.ts` is a minimal
  spec (`cy.visit('/'); cy.screenshot(...)`) that will work once
  `libglib2.0-0` (or equivalent) is installed — run it against a
  running dev server with:
  `npx cypress run --config-file apps/webapp-e2e/cypress.config.ts --browser electron --headless --spec .claude/skills/run-bella/screenshot.cy.ts --config baseUrl=http://localhost:4200,screenshotsFolder=.claude/skills/run-bella/screenshots/webapp,video=false`.
  Until then, `driver.sh`'s curl checks (real HTML `<title>`, real
  proxied JSON) are the verification path — they proved webapp/admin
  correctly render and correctly talk to the live API in this session.
- **`apps/webapp-e2e/src/e2e/app.cy.ts` and `apps/admin-e2e/.../app.cy.ts`
  are unmodified Nx generator boilerplate** (`cy.login(...)`,
  `getGreeting().contains('Welcome webapp')`) — they don't match the
  real app content and will fail if run as-is. Use
  `screenshot.cy.ts` instead for a smoke check, not the generated specs.

## Troubleshooting

- **`Required property 'buildTarget' is missing`** on `nx serve
  webapp`/`admin`: `project.json`'s `serve`/`extract-i18n` targets used
  the old `browserTarget` key; Angular 22's dev-server schema requires
  `buildTarget`. Fixed in commit `f820d89` — if you see this, check that
  fix wasn't reverted.
- **API crashes on boot with `Cannot read properties of undefined
  (reading 'values')` in `swagger-scanner.js`**: `@nestjs/swagger` was
  stuck at `^5.2.1`, incompatible with `@nestjs/core@10.x`. Fixed in
  commit `d6a137a` (bumped to `~7.4.2`) — if you see this, check that
  fix wasn't reverted.
- **`nx serve <project>` exits immediately with no error the moment
  the tool call returns**: you backgrounded it with a bare `(cmd &)`
  inside the Bash tool instead of passing `run_in_background: true` —
  the sandbox kills the child when the tool call ends either way.
- **`Port <N> is already in use`**: something else is already listening
  — see the "stray processes" Gotcha above before assuming it's your
  own previous attempt.
