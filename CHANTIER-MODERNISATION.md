# Chantier de modernisation post-14→22 — état et scope

Document ouvert le 2026-09-22, dans la foulée de la fermeture d'issue #49
(commit `f022fce`) et de l'ajout du garde de permission front admin
(commit `098a048`). Distinct de `CHANTIER-EN-COURS.md`, qui documente la
montée de version Angular 14→22 (terminée, 8 paliers, commitée) et se
termine sur la même conclusion que ce document reprend : la modernisation
(standalone/signals/`@if`/`@for`/`inject()`) et la dette annexe identifiée
en cours de route méritent leur propre suivi plutôt que de s'accumuler dans
le fichier de la montée de version.

## Fait dans cette session (2026-09-22)

- **Garde de permission front admin** (`098a048`) : `PermissionsGuard`
  (`apps/admin/src/app/auth/permissions.guard.ts`) décode la claim
  `permissions` de l'access token Auth0 et redirige vers `/access-denied`
  si `manage:publications` manque — fermait le dernier gap UX documenté
  d'issue #49. `CLAUDE.md` mis à jour en conséquence.
- **Sass `@import` → `@use`** (`a73c6b7`) : les 8 usages réels de `webapp`
  (partiel `scss/variables` + `bootstrap/scss/bootstrap` + 3 imports CSS
  purs) migrés, taille du CSS compilé inchangée, plus aucun warning de
  dépréciation Sass. `admin` n'avait qu'un import `.css` (thème Material),
  hors périmètre de la dépréciation. **Non touché** : `apps/webapp-e2e`/
  `apps/admin-e2e` pas vérifiés (scss non concerné a priori, Cypress).
- **4 règles a11y de template réactivées et corrigées** (`4b88faa`) :
  `no-autofocus`, `label-has-associated-control`,
  `click-events-have-key-events`, `interactive-supports-focus` — 8 fichiers
  (pas 4 comme l'estimation de `CHANTIER-EN-COURS.md`), 15 violations.
  Lint webapp revenu exactement à la baseline documentée (39 problèmes :
  5 erreurs / 34 warnings) avec zéro erreur a11y. **Non vérifié
  manuellement au clavier dans un navigateur** — les patterns
  `role="button"` + `tabindex="0"` + `(keydown.enter/space)` ajoutés sur
  welcome (sélecteur de pays), `ad-card` (carte cliquable → détail),
  `picture-uploader` (suppression d'image), et le bouton de fermeture du
  `drawer` transformé en vrai `<button>`, sont standards mais méritent une
  passe clavier avant mise en prod.
- **FIXME obsolète retiré** sur `health.controller.ts` (`a699c6a`) — le
  ping Mongo qu'il réclamait était déjà implémenté, seul le commentaire
  traînait.

## Essayé et délibérément annulé

- **Suppression de `baseUrl`/`ignoreDeprecations` dans `tsconfig.base.json`**
  (dette documentée dans `CHANTIER-EN-COURS.md`, "à refaire proprement
  avant TS 7.0" — `typescript` est déjà en `~6.0.3`, donc le répit n'est
  pas aussi large que le libellé le suggérait). Testé : `nx build api`
  échoue immédiatement avec `TS5090: Non-relative paths are not allowed
  when 'baseUrl' is not set` — au moins un import non-relatif ailleurs en
  dépend. Pas identifié lequel dans le temps imparti ; changement annulé,
  repo revenu à l'état d'avant. **Prochaine étape si repris** : `grep -rn`
  les imports non-relatifs suspects (probablement dans `apps/api` ou l'un
  des trois libs) pour identifier ce qui casse, puis soit le rendre
  relatif soit l'ajouter à `paths`.

## Dette identifiée mais non traitée — trop large pour "trivial"

Le message qui a ouvert cette session demandait de corriger ce qui est
"trivial" et de documenter le reste ici. Les trois chantiers suivants ont
été dimensionnés (comptes exacts ci-dessous) et jugés **trop larges pour
être qualifiés de triviaux** — chacun mérite sa propre échelle de paliers,
sur le modèle de `CHANTIER-EN-COURS.md` (un commit vérifié build/lint/test
par étape), pas une sweep en un seul passage.

### 1. Conversion `*ngIf`/`*ngFor` → `@if`/`@for`

`@angular-eslint/template/prefer-control-flow` est désactivée dans
`webapp` et `admin` depuis le palier 22 (les deux `eslint.config.mjs`).
**29 fichiers** `.html` utilisent encore `*ngIf`/`*ngFor` (`grep -rlE
'\*ngIf|\*ngFor' apps/webapp/src apps/admin/src --include="*.html"`,
28 dans webapp + 1 dans admin). Pas homogène : certains fichiers ont un
`*ngIf` simple et convertiraient en un `@if` mécanique et sûr, mais
d'autres usages rencontrés dans ce périmètre (ex.
`search-filter.component.html`, `ad-card.component.html`) combinent
`*ngIf="(x$ | async) as y"` (binding `as`), des `ngIf...then...else`
avec des `ng-template` référencés par `#nom` (le nouveau `@if/@else` ne
supporte pas nativement le pattern `then/else` par référence de template,
il faut inliner le contenu), et du `*ngFor` avec `trackBy` (dont la
sémantique change : l'ancien `trackBy` est une fonction `(index, item) =>
clé`, le nouveau `track` est une expression par item, en général
`track item.id` ou `track trackByFn(item)` — nécessite de vérifier au cas
par cas que chaque liste a bien un identifiant stable). Distinguer les cas
triviaux des cas piégeux fichier par fichier est exactement le travail
qui rend la conversion non triviale en bloc, même si chaque conversion
individuelle une fois triée l'est.

**Suggestion d'exécution** : chantier dédié, palier par sous-ensemble de
fichiers (ex. par module Angular), `nx lint`/`test`/`build` vérifiés à
chaque étape comme sur l'échelle 14→22 — bon candidat pour un sous-agent
en `isolation: worktree` étant donné le caractère mécanique-une-fois-trié
et vérifiable par build/lint/test.

### 2. `inject()` au lieu de l'injection par constructeur

`@angular-eslint/prefer-inject` désactivée depuis le palier 19 (voir
`CHANTIER-EN-COURS.md`, palier 18→19). **65 fichiers** `.ts` (hors specs)
dans `apps/webapp/src/app` + `apps/admin/src/app` ont un `constructor(...)`
(`grep -rlE "constructor\(" apps/webapp/src/app apps/admin/src/app
--include="*.ts" | grep -v spec | wc -l`). Mécanique par fichier
(remplacer les paramètres de constructeur par des `private x = inject(X);`
en champs de classe) mais 65 fichiers de blast radius est trop large pour
une passe "triviale" dans cette session — et c'est précisément la
discipline que l'échelle 14→22 avait actée de reporter à un chantier
séparé plutôt que de la glisser au fil d'un palier de version.

### 3. Composants `standalone: true`

`@angular-eslint/prefer-standalone` désactivée depuis le palier 19, pour
la même raison. **Non chiffré précisément** (mesurer nécessiterait de
réactiver la règle et de compter, comme fait pour les 4 règles a11y
ci-dessus) mais c'est le morceau le plus risqué des trois : contrairement
à `@if`/`@for` et `inject()` qui sont strictement locaux au fichier
touché, rendre un composant `standalone: true` oblige à retirer sa
déclaration du `NgModule` qui le porte et à ajouter ses dépendances
(`CommonModule`, autres composants/directives/pipes) directement dans ses
propres `imports` — ça se propage à tout module qui le déclare/importe/
exporte. C'est la pièce que `CHANTIER-EN-COURS.md` désignait explicitement
comme "chantier de modernisation séparé, pas une suite immédiate" — cette
session confirme et ne revient pas sur cette décision.

**Suggestion d'exécution** : à faire feuille-morte en dernier (après
`@if`/`@for` et `inject()`, qui réduisent le nombir de fichiers "encore à
l'ancienne façon" et simplifient la vérification), toujours par petits
lots vérifiés, jamais en un seul commit vu le rayon d'effet.

## Backend NestJS : à mettre à jour, oui — 3 majeures de retard

Question posée dans cette session : "il y a aussi le backend NestJs à
mettre à jour c'est le cas ?" — **oui**. La montée de version 14→22
documentée dans `CHANTIER-EN-COURS.md` ne portait que sur `apps/webapp`/
`apps/admin` ; `apps/api` n'a jamais été touché. Versions installées vs.
dernières publiées sur le registre npm (vérifié 2026-09-22) :

| Paquet | Installé | Dernier `latest` |
|---|---|---|
| `@nestjs/core` | `^9.0.0` | `12.0.4` |
| `@nestjs/common` | `^9.0.0` | `12.0.4` (aligné sur core) |
| `@nestjs/platform-express` | `^9.0.0` | aligné sur core |
| `@nestjs/mongoose` | `^9.1.1` | `12.0.0` |
| `@nestjs/swagger` | `^5.2.1` | `12.0.1` (saut énorme, 5→12) |
| `@nestjs/config` | `^2.1.0` | à vérifier (probable v4+) |
| `@nestjs/jwt` | `^8.0.1` | à vérifier |
| `@nestjs/passport` | `^8.2.2` | à vérifier |
| `@nestjs/terminus` | `^8.1.0` | à vérifier |
| `@nestjs/axios` | `^0.0.8` | à vérifier |
| `@nestjs/schematics`/`testing` (dev) | `^9.0.0` | alignés sur core |
| `mongoose` (driver) | `^6.13.10` | à vérifier (7.x existe) |
| `passport`/`passport-jwt`/`passport-local` | `^0.6.0`/`^4.0.0`/`^1.0.0` | à vérifier |
| `rxjs` | `~7.8.2` | déjà à jour (aligné front) |
| `reflect-metadata` | `^0.1.13` | à vérifier (0.2.x existe) |

**3 montées majeures de retard sur le cœur NestJS** (9→10→11→12), avec un
cas particulier violent sur `@nestjs/swagger` (5→12, sûrement plusieurs
breaking changes de génération OpenAPI). C'est un chantier de la même
ampleur que la montée Angular 14→22 — mérite la même discipline (palier
par palier, un commit par majeure, build/test/lint vérifiés à chaque
étape) et clairement pas quelque chose à faire "trivialement" dans cette
session. Vu que l'utilisateur a explicitement invité à lancer des
sous-agents si pertinent : un agent de recherche a été lancé en parallèle
de cette session pour dégrossir le plan de paliers (breaking changes
réels par majeure, vérifiés contre les changelogs/migration guides
officiels plutôt que déduits de mémoire) — voir la section ci-dessous une
fois son rapport revenu, ou relancer la recherche si cette section est
restée à l'état de placeholder.

<!-- SUBAGENT-NESTJS-RESEARCH: à remplacer par le plan de paliers une fois le rapport revenu -->

## Autres points déjà documentés dans `CHANTIER-EN-COURS.md`, toujours valables

- Avertissement de dépréciation `@angular-devkit/build-angular` (Angular
  pousse vers `@angular/build`, esbuild/Vite) — à surveiller, pas un
  blocage actuel.
- `nx build api`/`nx test api`/lint des libs `api-domain`/`api-adapters`/
  `dtos` pas suivis systématiquement à chaque palier futur — à intégrer
  dans la routine de vérification.
