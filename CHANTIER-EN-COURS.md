# Chantier en cours — migration Angular 14→22 de bella

Document de passation créé le 2026-09-20. Objectif : que la prochaine session
(Claude ou humaine) puisse reprendre le fil sans reperdre le contexte.

## Décision (2026-09-20)

Le chantier de montée de version Angular 14→22 avait été démarré sur
`afrik-tangazo` (repo historique, structure simple `front-end/`+`back-end/`)
et poussé jusqu'au **palier 5 (Angular 19)**, 10 commits, sur la branche
`claude/project-reinit-wcdium`. **Décision actée avec l'utilisateur : la
suite du chantier se fait ici, sur `bella`**, pas sur afrik-tangazo.

Pourquoi : `bella` est le successeur désigné d'afrik-tangazo (monorepo Nx,
`apps/webapp` + `apps/admin` + `apps/api`, libs partagées `@bella/dtos` /
`@bella/api/domain` / `@bella/api/adapters`), avec du vrai travail de fond
déjà fait dessus (workflow de modération des annonces via l'app `admin` +
NgRx, page `my-publications`, permissions/guards) que reconstruire depuis
afrik-tangazo aurait coûté plus cher que de refaire la montée de version
directement ici. **Rien n'est rapatrié entre les deux repos** — pas
d'historique git commun (remotes différents, aucun ancêtre partagé), la
montée de version est **refaite à neuf sur le code de bella**, guidée par
les leçons apprises sur afrik-tangazo (détail plus bas), pas par un
transfert mécanique de diffs.

Le travail sur afrik-tangazo reste figé tel quel (palier 5/Angular 19,
build/lint/tests vérifiés) — sert uniquement de référence.

## État actuel de bella au démarrage de ce chantier

- Angular **14.2.0** sur `apps/webapp` ET `apps/admin` (les deux à migrer).
- `@ngx-formly` déjà en place (`^6.0.0-rc`), `FormlyModule.forRoot()` câblé
  dans `apps/webapp/src/app/app.module.ts`.
- **Changements non commités déjà présents avant ce chantier** (pas les
  miens — probablement une autre session en cours sur des permissions/API) :
  `apps/admin/src/app/app.routes.ts`, `apps/admin/src/app/auth/authentication.module.ts`,
  `apps/api/src/app/api/admin/admin-publication.controller.ts`,
  `apps/api/src/app/api/ads.controller.ts`, `apps/api/src/app/auth/auth-user.ts`,
  `apps/api/src/app/auth/auth.module.ts`, plus des fichiers non trackés
  (`permissions.decorator.ts`, `permissions.guard.ts` + specs). **Ne pas
  écraser ni committer ces fichiers par erreur** en travaillant sur la
  migration — ce sont des `git add`/`git status` à filtrer explicitement.

## Scope de ce chantier

1. **Montée de version Angular 14→22**, palier par palier (14→15→...→22),
   sur `apps/webapp` **et** `apps/admin` (les deux sont sur la même version
   Angular dans le monorepo Nx, donc chaque palier touche les deux apps en
   même temps — contrairement à afrik-tangazo qui n'avait qu'un seul
   front-end).
2. **Nettoyage annexe accepté par l'utilisateur** (hors montée de version,
   dette antérieure au fork bella) : remplacer l'ancien
   `apps/webapp/src/app/shared/form/custom-validation-errors.ts` +
   `form-validation.module.ts` (système `ng-bootstrap-form-validation`, déjà
   à moitié désactivé — `FormValidationModule.forRoot()` déjà commenté dans
   `app.module.ts`) par l'équivalent déjà construit et testé sur
   afrik-tangazo : `shared/form/validation-messages.ts` (messages français,
   source unique) + `shared/form/field-error/field-error.component.ts`
   (petit composant, ~5 tests DOM), branchés via
   `FormlyModule.forRoot({ validationMessages: [...] })`. Fichiers de
   référence dans afrik-tangazo :
   `front-end/src/app/shared/form/validation-messages.ts` et
   `front-end/src/app/shared/form/field-error/`. Portage quasi direct, la
   structure `shared/form/` est identique dans les deux repos.
3. **Discipline identique à afrik-tangazo** : NgModules + injection par
   constructeur conservés pendant toute la montée (pas de standalone/signals
   avant Angular 22), suite de tests existante conservée comme baseline de
   non-régression à chaque palier, build/lint/tests vérifiés avant de
   passer au palier suivant, un commit par palier.

## Leçons apprises sur afrik-tangazo (14→19), directement réutilisables ici

Détail complet dans `afrik-tangazo/CHANTIER-EN-COURS.md` et la mémoire
`project_angular_migration` de cette session si besoin d'aller plus loin,
résumé actionnable ici :

- **Palier 14→15** : `@typescript-eslint` doit être monté à `^5.62.0`
  (dernière 5.x) car les versions antérieures ne supportent pas TS ≥4.8.
  Bug résiduel connu du scope-manager 5.x : faux positifs
  `no-unused-vars` sur les références utilisées uniquement dans un
  initialiseur de propriété de classe — pas la peine de chasser, se
  résout avec le passage à `@typescript-eslint` 8.x (voir palier 19
  ci-dessous, où c'est arrivé plus tôt que prévu). `skipLibCheck: true`
  probablement nécessaire (bug de `.d.ts` dans une dépendance transitive
  d'auth0-angular@2). Vérifier l'import CSS de `swiper` si utilisé
  (`swiper/css/bundle`, pas l'ancien chemin `swiper-bundle.css` — le
  resolver webpack de build-angular 15+ applique le `exports` field du
  package strictement).
- **Palier 15→16** : migration rxjs 6→7, généralement sans changement de
  code nécessaire.
- **Palier 16→17** : les 4 migrations schematics de `ng update` sont
  probablement des no-op sur ce genre de code (pas de `@`/`}` ambigus dans
  les templates, etc.) — mais bella n'utilisera pas `ng update` de toute
  façon (versions bumpées à la main + vérif peer-deps registre), donc les
  migrations automatiques ne se lanceront pas seules : **vérifier
  `node_modules/@angular/core/schematics/migrations.json` à CHAQUE palier**
  pour repérer les migrations à lancer manuellement (voir palier 19
  ci-dessous, cas concret rencontré).
- **Palier 17→18** : `@ngx-translate/core` 18.0.0 a supprimé
  `TranslateModule` (remplacé par `provideTranslateService()` dans les
  providers, ou le pipe standalone `TranslatePipe` importé direct dans un
  NgModule) et `TranslateService.setDefaultLang()` (remplacé par `.use()`).
  Si bella utilise `@ngx-translate`, revérifier à ce palier.
- **Palier 18→19 (fait sur afrik-tangazo, à refaire ici)** :
  - **Angular 19 inverse le défaut du flag `standalone`** — un composant
    sans `standalone` explicite devient `standalone: true` au lieu de
    `false`, cassant tout composant déclaré dans un NgModule sans ce flag
    (`NG6004`/`NG6008`/`NG6002`). Fix : le schematic officiel Angular
    `explicit-standalone-flag` (dans `@angular/core`'s
    `migrations.json`), invoqué manuellement puisqu'on ne passe pas par
    `ng update` :
    ```
    npx @angular-devkit/schematics-cli \
      "./node_modules/@angular/core/schematics/migrations.json:explicit-standalone-flag" \
      --no-debug --no-dry-run --force
    ```
    **Piège** : `--debug=false`/`--dry-run=false` sont silencieusement
    ignorés par cette CLI (bug de parsing `util.parseArgs`) — utiliser la
    forme négative `--no-debug --no-dry-run`. Reformater ensuite avec
    `prettier --write` (le schematic écrit en 4 espaces).
  - `@angular-eslint` 19 exige en peer `@typescript-eslint/utils@^7.11.0 ||
    ^8.0.0` → force `@typescript-eslint` à `^8.70.0` (au lieu d'attendre le
    palier 22 comme prévu initialement). Ce bump fait remonter deux règles
    dans les configs `recommended` :
    - `@angular-eslint/prefer-standalone` (nouvelle règle, signale chaque
      `standalone: false` en erreur) → **désactiver** dans `.eslintrc.js`
      (conflit direct avec la discipline "pas de standalone avant la fin
      de l'échelle").
    - `@typescript-eslint/no-explicit-any` (passe de `warn` à `error`) →
      **rétrograder à `warn`** si le code a des `any` pré-existants dont la
      correction sort du cadre d'un palier de version (c'était le cas sur
      afrik-tangazo, ~28 occurrences).
    - Les erreurs `no-unused-vars` restantes après ces deux ajustements
      sont en général de vrais imports/variables morts (souvent masqués
      avant par le bug de scope-manager du palier 15) — à corriger
      directement, ce n'est pas du bruit.
  - **Contournement d'installation** rencontré dans le sandbox de la
    session précédente (peut ne pas se reproduire dans un environnement
    différent, mais utile si `yarn install` échoue avec `error Received
    malformed response from registry` sur de gros packages) :
    `npm install --package-lock=false` pour peupler `node_modules`,
    `npm install --package-lock-only` pour générer un `package-lock.json`,
    `npx synp --source-file package-lock.json --force --with-workspace`
    pour convertir en `yarn.lock` — **attention, `synp` ne gère pas
    correctement `lockfileVersion: 3`** et produit des champs `resolved`
    cassés (juste le numéro de version au lieu d'une URL) : un script Node
    ad hoc relisant `package-lock.json` pour corriger `resolved`/`integrity`
    dans `yarn.lock` a été nécessaire. `yarn install --check-files` valide
    ensuite la cohérence.
- **Palier 22** : point de convergence attendu — `@angular/cdk` (si
  utilisé), ESLint 9 flat config, confirmation que
  `@typescript-eslint` 8.x est bien aligné partout.

## Point de vigilance signalé par l'utilisateur (2026-09-20, à confirmer)

Erreur de compilation rencontrée par l'utilisateur sur afrik-tangazo (contexte
exact pas encore confirmé — pas reproduite pendant les vérifications de
session sur palier 19, qui étaient à 0 erreur) :

```
NgForOf.
  The module '@angular/common' could not be found.
export class SteppedFormFieldComponent extends FieldType {
```

`stepped-form-field.ts` existe à l'identique dans bella
(`apps/webapp/src/app/shared/form/types/stepped-form-field/`) — même classe
`FieldType` de `@ngx-formly/core`, mêmes imports `@angular/common`.

**Confirmé par l'utilisateur : rencontré pendant `ng serve` en local au
palier 19**, jamais vu pendant `ng build --configuration production` en
session (0 erreur à chaque vérification). Diagnostic le plus probable :
cache incrémental persistant d'Angular (`.angular/cache`, activé par défaut
depuis Angular 12) qui réutilise des informations de types compilées avec
l'ancienne version d'Angular après un bump de version — `ng build` repart
toujours d'une compilation propre, `ng serve` non. **Réflexe à prendre à
chaque palier ici sur bella** : supprimer `apps/webapp/.angular/cache` (et
l'équivalent pour `admin` si distinct) juste après avoir bumpé les versions,
avant le premier `ng serve` post-palier — pas seulement avant `ng build`.

## Palier 14→15 : fait (commit `17e8d94`)

Versions posées : `@angular/*` (animations/common/compiler/core/forms/
platform-browser/platform-browser-dynamic/router) `~15.2.10`,
`@angular/cdk`/`@angular/material` `15.2.9`, `@angular/service-worker`
`^15.2.10`, `@angular-devkit/build-angular`/`@angular/cli` `~15.2.11`,
`@angular/compiler-cli`/`@angular/language-service` `~15.2.10`,
`@angular-eslint/*` `~15.2.1`. `@ng-select/ng-select` `^9.0.2`→`^10.0.4`,
`ngx-bootstrap` `^8.0.0`→`10.3.0` exact, `ngx-device-detector`
`^3.0.0`→`^5.0.1`. `@auth0/auth0-angular` `^1.10.0`→`^1.11.1` (fix NG0204,
indépendant de la montée de version, même bug qu'afrik-tangazo).
`@typescript-eslint/*` `^5.36.1`→`^5.62.0`, `typescript` `~4.8.2`→`~4.9.5`.
`nx` + tous les `@nrwl/*` → `15.9.7` (dernier patch de la même majeure Nx,
aucun saut de version Nx nécessaire — Nx a son propre cycle de versions,
indépendant de celui d'Angular). `@cloudinary/ng`, `@cloudinary/url-gen`
et `ng-bootstrap-form-validation` **supprimés** (code mort confirmé par
inspection du source : SDK Cloudinary jamais importé activement, upload
réel via `HttpClient` brut vers l'API REST ; `FormValidationModule` déjà
commenté partout).

Nettoyage validation fait comme prévu : `shared/form/validation-messages.ts`
+ `shared/form/field-error/` portés depuis afrik-tangazo, câblés dans
`FormlyModule.forRoot({validationMessages})` et sur les 4 champs du
formulaire profil. **Deux adaptations nécessaires** (pas un simple
copier-coller) :
- Le sélecteur du composant doit être `bella-field-error`, pas
  `app-field-error` — bella impose son propre préfixe (`@angular-eslint/
  component-selector` configuré pour `bella`, pas `app` comme sur
  afrik-tangazo). **Toujours vérifier le préfixe réel du repo cible avant
  de porter un composant** (`grep "selector:" apps/webapp/src/app/shared/
  components/*/*.component.ts` pour un exemple existant).
- La config ESLint de bella active `@typescript-eslint/no-non-null-
  assertion` en erreur, contrairement à afrik-tangazo — le `el!.textContent!`
  du spec porté a dû être changé en `(el.textContent ?? '').trim()`.
  **Ne pas supposer que les deux repos ont la même config ESLint.**

`swiper/swiper-bundle.css` → `swiper/css/bundle` : même bug que sur
afrik-tangazo, présent aussi ici.

### Saga du lockfile (la partie qui a pris le plus de temps)

Confirmé : **le même bug yarn-classic-vs-proxy-sandbox qu'afrik-tangazo se
reproduit sur bella** (`error Received malformed response from registry`),
avec en plus deux complications propres à ce monorepo, plus gros et plus
complexe. Recette complète si ça se reproduit à un futur palier :

1. `rm -rf node_modules`
2. `npm install --package-lock=false --ignore-scripts --legacy-peer-deps`
   (`--ignore-scripts` pour lancer le postinstall à la main juste après et
   observer son comportement ; `--legacy-peer-deps` nécessaire à cause d'un
   conflit de peer **sans rapport avec la migration** :
   `@nestjs/axios@0.0.8` ne déclare supporter que `@nestjs/common
   ^7||^8`, alors que le projet est déjà en `^9` — yarn tolérait ça
   silencieusement, npm en mode strict non).
3. Lancer le postinstall à la main : `node ./decorate-angular-cli.js` puis
   `npx ngcc --properties es2020 browser module main` — `ngcc` n'a signalé
   qu'une seule lib "View Engine legacy" (`@ngx-translate/http-loader`),
   sans conséquence.
4. `npm install --package-lock-only --legacy-peer-deps --prefer-online`
   pour générer un `package-lock.json`. **`--prefer-online` est
   indispensable** ici : sans lui, ~942 des ~1988 entrées du
   `package-lock.json` généré n'avaient **aucun** champ `resolved`/
   `integrity` du tout (jamais vu sur afrik-tangazo, spécifique à ce
   monorepo/cette taille de dependency tree). Avec `--prefer-online`, ça
   tombe à 42 manquantes — ces 42 restantes étaient presque toutes des
   dépendances directes de la racine (`@angular/cli`, `@nrwl/*`,
   `typescript`, etc.) + quelques paquets de plateforme optionnels
   (`@esbuild/linux-x64`...) + 3 paquets alias npm (`string-width-cjs`,
   `strip-ansi-cjs`, `wrap-ansi-cjs` — leur vrai nom est dans le champ
   `"name"` de leur entrée `package-lock.json`, ex. `string-width-cjs` →
   `string-width`). Résolues une par une via `npm view "<pkg>@<version>"
   dist --json`.
5. `npx synp --source-file package-lock.json --force --with-workspace`
   pour convertir en `yarn.lock`. **`synp` traduit mal le format
   `lockfileVersion: 3`** et produit des champs `resolved` cassés (juste le
   numéro de version, ex. `resolved "15.2.10"`, au lieu d'une URL de
   tarball) pour toutes les entrées.
6. Script Node (patron réutilisable, voir afrik-tangazo pour la version
   d'origine) qui : (a) construit une table `nom@version → {resolved,
   integrity}` à partir de `package-lock.json`, **en filtrant strictement
   les entrées dont `resolved` commence par `http`** — **découverte
   propre à bella** : `npm` peut lui-même écrire un `resolved` qui n'est
   qu'un numéro de version brut (`"resolved": "7.20.12"`) au lieu d'une
   vraie URL, pour une fraction non négligeable des paquets (735 sur ~1984
   ici) — un vrai bug npm, pas une invention de `synp`. Faire confiance
   aveuglément à "le champ existe" ne suffit pas, il faut vérifier que
   c'est une URL ; (b) parcourt `yarn.lock` ligne par ligne en trackant le
   nom du paquet courant depuis la ligne d'en-tête — **gérer les en-têtes
   à specifiers multiples séparés par des virgules**
   (`"pkg@^1.0.0", "pkg@^1.2.0":`), prendre le premier specifier et extraire
   le nom (le nom s'arrête au premier `@` qui n'est pas en position 0, pour
   gérer les paquets scopés) — et la version depuis la ligne `version
   "x.y.z"` qui suit ; remplace tout `resolved` non-URL + la ligne
   `integrity` suivante avec les valeurs de la table.
7. Pour les entrées non résolues par (6) (735 ici, celles où
   `package-lock.json` avait lui-même un `resolved` invalide) : script de
   fetch en masse via `npm view "<pkg>@<version>" dist --json`, en
   **parallèle réel avec `child_process.exec` asynchrone + un pool de
   workers (PAS `execSync`, qui bloque la boucle d'événements et rend tout
   séquentiel)** — 10 workers en parallèle, les 735 lookups ont réussi en
   quelques minutes. Fusionner ce résultat dans la table de l'étape (a) et
   relancer (5)+(6) une dernière fois.
8. Supprimer `package-lock.json` (et le fichier de lookup temporaire).
   `yarn install --check-files` pour valider — **a échoué 3 fois de
   suite avec 3 erreurs différentes** (`Error: aborted` deux fois,
   `malformed response from registry` une fois) malgré `--network-timeout`
   et `--network-concurrency 1`. **Décision : ne pas s'acharner.** Le
   contenu de `yarn.lock` était déjà vérifié correct via le script de
   l'étape (6)/(7) (mêmes données que celles utilisées par `npm`, qui a
   installé `node_modules` sans erreur) — la vraie validation qui compte
   est que `nx build`/`nx test` fonctionnent réellement (Nx lit
   `node_modules` directement, pas via la résolution de yarn). Les deux
   builds et les deux suites de tests sont passés, confirmant que
   `node_modules`/`yarn.lock` étaient cohérents malgré l'échec de la
   validation yarn elle-même.

**Découverte annexe** : `bella` a aussi un **quota tmpfs partagé avec
afrik-tangazo** dans ce sandbox (`/tmp` = tmpfs ~7.8 Go) — le cache npm des
deux repos combinés a rempli le tmpfs (`ENOSPC`) en plein milieu du
palier. Si ça se reproduit : `rm -rf $TMPDIR/npm-cache` (et le dossier de
cache yarn, nommé dans le message "Selected the next writable cache
folder" de yarn) avant de relancer.

**Découverte annexe 2** : le build de production de `admin` télécharge les
polices Google Fonts au moment du build (`optimization.fonts` d'Angular
CLI, feature de "font inlining") — échoue avec un 403 si
`fonts.googleapis.com`/`fonts.gstatic.com` ne sont pas dans les domaines
autorisés du sandbox. Pas un bug Angular 15, juste à prévoir pour chaque
build de `admin` dans cet environnement.

## Palier 15→16 : fait (commit à suivre)

rxjs était déjà en `~7.5.0` au démarrage de ce palier — aucune migration
6→7 nécessaire, contrairement à afrik-tangazo. Versions posées : familles
séparées à bien distinguer (les paquets du framework Angular et ceux du
CLI ne partagent pas le même dernier patch) :
- `@angular/animations`/`common`/`compiler`/`core`/`forms`/
  `platform-browser`/`platform-browser-dynamic`/`router`/`service-worker`/
  `compiler-cli`/`language-service` → `16.2.12` (dernier patch du repo
  angular/angular)
- `@angular/cdk`/`@angular/material` → `16.2.14` (dernier patch de leur
  propre repo)
- `@angular/cli`/`@angular-devkit/build-angular`/`@angular/pwa` →
  `16.2.16` (dernier patch du repo angular-cli, encore un cycle différent)
- `@angular-eslint/*` → `16.3.1`, `zone.js` → `~0.13.0`, `typescript` →
  `~5.1.6` (dans la plage `>=4.9.3 <5.2` exigée par compiler-cli 16.2.12)
- `@ng-select/ng-select` `^10.0.4`→`^11.2.0`, `ngx-bootstrap`
  `10.3.0`→`11.0.2` exact, `ngx-device-detector` `^5.0.1`→`^6.0.2`
- `@auth0/auth0-angular` `^1.11.1`→`^2.12.0` — **bump majeur obligatoire**
  (la ligne 1.x plafonne à Angular ≤15), voir breaking changes ci-dessous
- `nx` + tous les `@nrwl/*` → `16.10.0` ; `@nrwl/cli` **supprimé**
  (paquet abandonné après la 15.9.7, remplacé par le binaire `nx` lui-même
  — confirmé via des versions factices `999.9.9`/`9999.0.0` publiées pour
  réserver le nom) ; `@nrwl/nx-cloud` → `16.5.2` (cycle de version propre,
  indépendant de celui de Nx)
- Écosystème Jest bumpé en bloc à la demande de Nx 16 (`@nx/jest` exige
  `jest-config`/`jest-resolve`/`@jest/reporters` en `^29.4.1`) : `jest`
  `28.1.1`→`29.7.0`, `jest-environment-jsdom` `28.1.1`→`29.7.0`, `ts-jest`
  `28.0.5`→`29.4.12`, `@types/jest` `28.1.1`→`29.5.14`, `jest-preset-
  angular` `~12.2.2`→`~13.1.4` (couvre Angular jusqu'à <18, réduit les
  churns futurs)

### Nouveaux pièges rencontrés (aucun analogue sur afrik-tangazo)

**`ngcc` supprimé du postinstall** — Angular 16 ne l'invoque plus du tout
en interne ; l'exécuter manuellement affiche une alerte explicite ("As of
Angular 16, ngcc is no longer required... will be removed in Angular 17").
Le script `postinstall` de `package.json` a été simplifié à
`node ./decorate-angular-cli.js` seul.

**Nx fait un appel réseau silencieux au démarrage** — toute commande `nx`
au-delà de `nx show projects` (donc `build`, `test`, `lint`, `--help`...)
tente une vérification de version/télémétrie en ligne. Sans accès réseau
dans le sandbox, ça **bloque indéfiniment sans aucune sortie ni erreur**
(pas un crash, un vrai silence total) — piège sournois car ça ressemble à
un calcul juste très lent. `CI=true` **ne suffit pas** à désactiver ce
comportement (testé et confirmé). Seule solution qui marche : autoriser
explicitement `registry.npmjs.org`, `cloud.nx.app`, `cdn.nx.app`,
`analytics.nx.app` dans `allowed_domains` pour toute commande `nx` de ce
type. **Réflexe à prendre systématiquement à partir de ce palier.**

**Le bug DrvFs `chmod`/`copyfile` `EPERM` se reproduit, y compris sans
sandbox** — `npm install` échoue en fin d'extraction avec
`EPERM: operation not permitted, chmod .../ng.js` (bin-linking), et le
build échoue avec `EPERM: operation not permitted, copyfile favicon.ico`
(copie d'assets). Confirmé que ce n'est **pas** une restriction du sandbox
(`dangerouslyDisableSandbox: true` ne change rien) — DrvFs lui-même
refuse ces syscalls même sur des fichiers déjà en `777`. Deux approches
possibles :
1. `--no-bin-links` sur `npm install` (évite le chmod, mais ne couvre pas
   la copie d'assets pendant le build — insuffisant à lui seul).
2. **La bonne solution, plus générale** : un shim Node chargé via
   `NODE_OPTIONS="--require <chemin>/copyfile-shim.js"` qui remplace
   `fs.copyFile`/`fs.copyFileSync`/`fs.promises.copyFile` par un
   read+write classique, et qui rend `chmod`/`lchmod` tolérants aux
   erreurs `EPERM`/`ENOTSUP` (DrvFs les ignore de toute façon). Fonctionne
   pour l'install ET le build. Contenu du shim (à conserver dans le repo
   ou le job scratch pour réutilisation) :
   ```js
   // WSL2 DrvFs (/mnt/c) rejects libuv's copy_file_range/sendfile path with EPERM.
   // Replace fs.copyFile* with a plain read/write so yarn/npm/ng can populate node_modules.
   const fs = require('fs');

   function copySync(src, dst, mode = 0) {
     if (mode & fs.constants.COPYFILE_EXCL && fs.existsSync(dst)) {
       const err = new Error(`EEXIST: file already exists, copyfile '${src}' -> '${dst}'`);
       err.code = 'EEXIST';
       throw err;
     }
     fs.writeFileSync(dst, fs.readFileSync(src));
     try {
       fs.chmodSync(dst, fs.statSync(src).mode);
     } catch {}
   }

   fs.copyFileSync = copySync;
   fs.copyFile = function (src, dst, mode, cb) {
     if (typeof mode === 'function') {
       cb = mode;
       mode = 0;
     }
     try {
       copySync(src, dst, mode);
       process.nextTick(cb, null);
     } catch (e) {
       process.nextTick(cb, e);
     }
   };
   fs.promises.copyFile = async (src, dst, mode) => copySync(src, dst, mode);

   // DrvFs also rejects chmod on symlinks (.bin links); modes are meaningless there anyway.
   const ignorable = (e) => e && (e.code === 'EPERM' || e.code === 'ENOTSUP');
   for (const name of ['chmod', 'lchmod']) {
     const origSync = fs[`${name}Sync`];
     const orig = fs[name];
     if (!origSync || !orig) continue;
     fs[`${name}Sync`] = function (...args) {
       try {
         return origSync.apply(fs, args);
       } catch (e) {
         if (!ignorable(e)) throw e;
       }
     };
     fs[name] = function (...args) {
       const cb = args.pop();
       orig.call(fs, ...args, (e) => cb(ignorable(e) ? null : e));
     };
     if (fs.promises[name]) {
       const origP = fs.promises[name];
       fs.promises[name] = (...args) => origP(...args).catch((e) => { if (!ignorable(e)) throw e; });
     }
   }
   ```
   **Préférer cette approche à `--no-bin-links` pour tous les paliers
   suivants** — plus robuste, couvre install ET build, et évite d'avoir à
   invoquer `nx`/`ng` via `node node_modules/nx/bin/nx.js` faute de liens
   dans `.bin`.

**Installation `rxjs` corrompue** (probablement séquelle d'une des
tentatives d'installation interrompues plus tôt dans ce palier) —
`node_modules/rxjs/dist/types/index.d.ts` manquait entièrement (seul son
sourcemap `.map` avait survécu à l'extraction), rendant certains exports
(`shareReplay`, `filter`, `switchMap`) introuvables pour TypeScript alors
qu'ils fonctionnaient très bien à l'exécution (vérifié via
`require('rxjs').shareReplay` → `function`). Résultat : erreurs `TS2305`
en cascade + erreurs `TS7006`/`TS7031` "implicitly has an any type" sur
tous les callbacks de ces opérateurs. **Diagnostic clé** : si une erreur
`has no exported member` porte sur un symbole qui existe bel et bien à
l'exécution, suspecter une extraction `node_modules` incomplète avant de
corriger le code. Fixé par une réinstallation ciblée du seul paquet
concerné : `rm -rf node_modules/rxjs && npm install rxjs@7.5.7 --no-save
--legacy-peer-deps`.

**Breaking changes Auth0 SDK v1→v2** (`@auth0/auth0-angular`) :
- `loginWithRedirect({ screen_hint: 'signup' })` →
  `loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })`
- `logout({ returnTo })` → `logout({ logoutParams: { returnTo } })`
- **Piège silencieux, le plus dangereux** : `AuthModule.forRoot({
  ...environment.authConfig, ... })` passait `redirectUri`/`audience` en
  top-level (format v1). TypeScript **ne signale aucune erreur** car les
  vérifications de propriétés en excès ne s'appliquent qu'aux littéraux
  objets écrits directement, pas à un spread de variable — donc ça
  compile, mais au runtime le SDK v2 ignore silencieusement ces deux
  champs (attend `authorizationParams.redirect_uri`/`.audience`), cassant
  le login/callback et l'audience du token en production sans le moindre
  signal. Fixé dans les 4 `environment*.ts` (webapp + admin) en imbriquant
  `redirectUri`/`audience` sous `authorizationParams` (avec la clé
  `redirect_uri` en snake_case, format attendu par le SDK v2).
  **Toujours se méfier des spreads d'objet de config vers une API dont la
  forme a changé — le typage ne protège pas contre ça.**
- Nouvelle dépendance transitive `dpop` (support DPoP du SDK v2) utilise
  `TextEncoder` au chargement du module, absent de l'environnement
  Jest/jsdom par défaut → `ReferenceError: TextEncoder is not defined`
  dans toute suite import(ant) directement ou indirectement
  `@auth0/auth0-angular`. Fixé par un polyfill ajouté en tête de
  `test-setup.ts` (webapp et admin, par précaution) :
  ```ts
  import { TextDecoder, TextEncoder } from 'util';
  if (typeof globalThis.TextEncoder === 'undefined') {
    (globalThis as any).TextEncoder = TextEncoder;
    (globalThis as any).TextDecoder = TextDecoder;
  }
  ```
  (admin n'était en fait pas affecté — ses specs n'importent pas la chaîne
  qui déclenche `dpop` — mais le polyfill y est sans risque.)

Build prod (webapp + admin), lint (uniquement les erreurs pré-existantes
déjà documentées, aucune régression dans les fichiers touchés), et Jest
(webapp 30/30 suites, admin 3/3 suites) tous verts.

## Palier 16→17 : fait (commit à suivre juste après ce document)

Versions posées dans `package.json` : famille Angular (animations/common/
compiler/core/forms/platform-browser/platform-browser-dynamic/router/
service-worker/compiler-cli/language-service) `~17.3.12`, `@angular/cdk`/
`@angular/material` `17.3.10`, `@angular/cli`/`@angular-devkit/
build-angular`/`@angular/pwa` `~17.3.17`, `@angular-eslint/*` `~17.5.3`,
`zone.js` `~0.14.0`, `typescript` `~5.4.5`, `@ng-select/ng-select`
`^12.0.7`, `ngx-bootstrap` `12.0.0` exact, `ngx-device-detector` `^7.0.0`,
`nx`+tous les `@nrwl/*` `17.3.2`, `nx-cloud` (renommé depuis
`@nrwl/nx-cloud` par un `nx repair` antérieur) `17.0.0`,
`@typescript-eslint/eslint-plugin`/`parser` `^7.18.0` (avancé du palier 19
initialement prévu, voir bug ci-dessous), `eslint` `~8.57.1`, `rxjs`
`~7.8.2` (voir bug ci-dessous).

### Deux vrais bugs de code trouvés et corrigés

**1. Doublon `@typescript-eslint/utils`.** `@angular-eslint` 17.5.3
embarque `@typescript-eslint/utils@7.11.0` alors que
`@typescript-eslint/eslint-plugin@7.18.0` exige la 7.18.0 exacte — npm
imbrique une deuxième copie au lieu d'échouer, et deux instances de classe
différentes cassent `class extends` au chargement du plugin (`Class
extends value undefined is not a constructor or null`). Corrigé via
`"overrides": {"@typescript-eslint/utils": "7.18.0"}` dans `package.json`
— confirmé : plus aucune copie imbriquée.

**2. rxjs 7.5.7 incompatible avec TypeScript 5.4.5.** Pas une erreur de
compilation — l'inférence de type de `.pipe()` dégrade silencieusement
vers `unknown`, produisant des dizaines d'erreurs `Property 'X' does not
exist on type 'unknown'` dans des fichiers sans rapport
(`categories.service.ts`, `ads.service.ts`, `search.service.ts`,
`home.component.ts`, `ad-detail.component.ts`...). Corrigé en montant
`rxjs` à `~7.8.2`. **Leçon pour les paliers suivants : revérifier la
compatibilité rxjs à chaque montée significative de TypeScript**, même en
l'absence d'erreur de compilation explicite.

### Petits fixes associés

- `apps/webapp/src/test-setup.ts` et `apps/admin/src/test-setup.ts` : le
  cast `(globalThis as any)` du polyfill `TextEncoder`/`TextDecoder`
  remplacé par un cast typé, pour satisfaire
  `@typescript-eslint/no-explicit-any` apparu avec typescript-eslint
  7.18.0.
- `nx.json` : migré au format Nx 17 (suppression de `npmScope` et
  `tasksRunnerOptions`, ajout de `"cache": true` par cible) — migration
  automatique normale de `nx repair`, pas une régression.
- `apps/webapp/project.json` : `test.outputs` corrigé en
  `["{workspaceRoot}/coverage/apps/webapp"]` (l'ancien chemin relatif
  provoquait une erreur "invalid outputs" bloquant `nx test`).
- `.prettierignore` : ajout de `/.nx/cache`.

### Le blocage d'installation npm et sa résolution (2026-09-21 → 2026-09-21)

Après le bump de versions ci-dessus, aucune installation npm complète ne
se terminait proprement sur `/mnt/c` (DrvFs) : `node_modules/rxjs` et le
`minimatch` imbriqué sous `node_modules/nx` échouaient systématiquement à
s'extraire, avec une erreur `EACCES`/`rename` touchant un paquet différent
et sans rapport à chaque tentative (`axobject-query`, `aria-query`,
`dayjs`, `bootstrap`...). **9 stratégies de contournement épuisées sans
succès** dans la session du 2026-09-21 (3 réinstallations complètes, 5
réinstallations ciblées par paquet, 1 passe de comblement) — détail complet
dans la mémoire Claude `reference_wsl2_sandbox_env_bella` si besoin de le
revoir, mais **conservé comme référence historique uniquement : le
problème est résolu, voir ci-dessous**, pas la peine de retenter cette
recette sur `/mnt/c`.

**Résolution (session suivante, 2026-09-21) : `bella` déplacé hors de
`/mnt/c` vers le filesystem natif WSL2 (ext4), sur demande explicite de
l'utilisateur après un rappel des 3 options possibles (retenter / déplacer
/ mettre en pause).** Nouvel emplacement de travail : **`/home/tanos/bella`**
— copie complète de l'arbre de travail (`node_modules`/`dist`/`.angular`/
`.nx/cache`/`coverage`/`out-tsc`/`tmp` exclus, tout le reste identique,
`git status --short` vérifié identique juste après copie). **L'ancienne
copie `/mnt/c/.../bella` n'a pas été supprimée** (conservée intacte comme
sauvegarde) mais **n'est plus la copie de travail** : toute la suite du
chantier se fait dans `/home/tanos/bella`.

Un `npm install --legacy-peer-deps` complet et direct (sans shim
`copyfile-shim.js`, sans détour par npm→synp→yarn.lock — plus nécessaire
sur ext4) a réussi du premier coup sur ce nouvel emplacement : 1614
paquets installés en 8 minutes, exit code 0, **aucune erreur `EACCES`**.
`nx --version`, `rxjs/dist/types/index.d.ts` et l'absence de copie
imbriquée de `@typescript-eslint/utils` ont tous été revérifiés bons.
**Confirme le diagnostic : le bug `EACCES`-on-rename était bien
spécifique à DrvFs, pas au contenu du dependency tree.** `package-lock.json`
généré par cet `npm install` a été supprimé après coup (le projet reste
sur `yarn.lock`, qui contenait déjà l'état cible du palier 17 depuis la
session précédente et n'a pas eu besoin d'être régénéré).

**Point de vigilance pour les paliers suivants** : tous les contournements
DrvFs documentés plus haut dans ce fichier (shim `copyfile-shim.js`,
saga npm→synp→yarn.lock, `dangerouslyDisableSandbox` pour chmod/rename)
sont probablement caducs maintenant qu'on travaille sur ext4 natif — **à
confirmer palier par palier plutôt qu'à supposer** (garder les recettes
sous la main en cas de résurgence, mais ne plus les appliquer par défaut).
Le point Nx qui reste valable indépendamment du filesystem : l'appel
réseau silencieux au démarrage de toute commande `nx` au-delà de `nx show
projects`, à allowlister (`registry.npmjs.org`, `cloud.nx.app`,
`cdn.nx.app`, `analytics.nx.app`) ou contourner via
`dangerouslyDisableSandbox` pour un accès réseau non filtré.

**Vérifications finales, toutes vertes sur `/home/tanos/bella`** :
- Lint webapp : 39 problèmes (5 erreurs / 34 warnings) — identique à la
  baseline du palier 16.
- Lint admin : 15 problèmes (3 erreurs / 12 warnings) — identique.
- Tests webapp : 30/30 suites (43 tests).
- Tests admin : 3/3 suites (4 passed, 1 skipped — pré-existant).
- Build production webapp : succès (warning de budget bundle pré-existant,
  sans rapport avec la migration).
- Build production admin : succès (mêmes avertissements pré-existants).

## Palier 17→18 : fait (commit à suivre juste après ce document)

Versions posées dans `package.json` : famille Angular (animations/common/
compiler/core/forms/platform-browser/platform-browser-dynamic/router/
service-worker/compiler-cli/language-service) `~18.2.14`, `@angular/cdk`/
`@angular/material` `18.2.14`, `@angular/cli`/`@angular-devkit/
build-angular`/`@angular/pwa` `~18.2.21`, `@angular-eslint/*` `~18.4.3`,
`nx`+tous les `@nrwl/*` `18.3.5`, `nx-cloud` `18.0.1`, `jest-preset-angular`
`~14.6.2` (la `13.1.4` plafonnait son peer-range à `<18.0.0`, donc
obligatoire à ce palier même si Jest lui-même n'a pas bougé). Les trois
libs UI tierces qui déclarent un peer strict sur la version majeure
d'Angular ont dû être bumpées **de version majeure propre**, pas juste de
patch : `@ng-select/ng-select` `^12.0.7`→`^13.9.1` (14.0.0 vise déjà
Angular 19, donc 13.9.1 est la dernière version exploitable ici),
`ngx-bootstrap` `12.0.0`→`18.1.3` exact (leur numérotation de version
s'est alignée sur celle d'Angular à partir de leur propre v18 — saut direct
`12.0.0`→`18.0.0` chez eux, pas de version 13-17), `ngx-device-detector`
`^7.0.0`→`^8.0.0`. `typescript` (`~5.4.5`) et `rxjs` (`~7.8.2`) inchangés —
`@angular/compiler-cli@18.2.14` accepte `typescript >=5.4 <5.6`, aucune
raison de bouger pour l'instant. `@typescript-eslint/*` et `eslint`
inchangés aussi : `@angular-eslint@18.4.3` accepte toujours `@typescript-
eslint/utils@^7.11.0 || ^8.0.0`, donc l'override `"@typescript-eslint/
utils": "7.18.0"` posé au palier 17 reste valable tel quel (revérifié :
toujours aucune copie imbriquée après cette install).

### Breaking change `@ngx-translate/core` 18.0.0 — API bien plus large que prévu

La recherche pré-scopée au palier précédent ("juste `TranslateModule` →
`provideTranslateService()` + `setDefaultLang()` → `.use()`") s'est avérée
trop optimiste une fois les types réels inspectés dans
`node_modules/@ngx-translate/core/types/ngx-translate-core.d.ts` — la
v18 réelle est une réécriture complète autour de signals, pas un simple
renommage. Détail de ce qui a changé et pourquoi, pour ne pas re-découvrir
tout ça au prochain palier touchant à l'i18n :

- **`TranslateModule` a complètement disparu** (plus aucune trace dans les
  exports) — remplacé par `provideTranslateService(config?)` (retourne des
  `Provider[]`, à mettre dans `providers`, pas `imports`) pour le NgModule
  racine, et `provideChildTranslateService()` pour un sous-arbre isolé.
  Là où seul le pipe `| translate` était utilisé dans un module (ex.
  `ad-detail.module.ts`), `TranslatePipe` (standalone) s'importe
  directement dans `imports` — un NgModule peut importer un pipe/composant
  standalone directement depuis Angular 14, donc pas de refactor plus
  large nécessaire.
- **`TranslateService.setDefaultLang()`/`getDefaultLang()` ont disparu**,
  pas juste dépréciés. `addLangs()`/`getLangs()` existent toujours
  (délèguent à un store interne inchangé dans l'esprit). `use(lang)`
  reste la méthode pour activer une langue, mais son type de retour est
  maintenant un `Observable` — **elle s'auto-souscrit en interne**
  (`pending.pipe(take(1)).subscribe(...)` dans l'implémentation), donc
  l'appeler sans s'abonner déclenche quand même le chargement réel ; en
  prime elle positionne `_currentLang` **de façon synchrone** si aucune
  langue n'était encore active, donc `getCurrentLang()` reflète bien 'fr'
  immédiatement après l'appel dans le constructeur de `AppComponent`,
  sans dépendre d'un flush HTTP en test. Remplacement fait dans
  `app.component.ts` : `setDefaultLang('fr')` → `use('fr')` (gardé après
  `addLangs(['fr'])`, comportement équivalent).
  Le test associé (`app.component.spec.ts`, "registers French as the only
  language") vérifiait `getDefaultLang()).toBe('fr')` — remplacé par
  `getCurrentLang()).toBe('fr')`, seule méthode encore disponible qui
  capture la même intention.
- **`@ngx-translate/http-loader` a aussi été réécrit en profondeur** :
  `TranslateHttpLoader` a maintenant un **constructeur sans argument**
  (il fait son propre `inject(HttpClient)` en interne) — l'ancien pattern
  `new TranslateHttpLoader(http)` ne compile plus. Le remplacement
  idiomatique n'est pas de bricoler un provider `useFactory` pour
  `TranslateLoader` à la main : la lib expose `provideTranslateHttpLoader
  (config?)`, qui retourne un tableau de 2 providers (un
  `TRANSLATE_HTTP_LOADER_CONFIG` + le `TranslateLoader` lui-même) — **à
  spreader directement dans `providers`, après `provideTranslateService()`
  pour que son provider de loader gagne** (un provider plus tardif dans
  le même tableau `providers` écrase le précédent pour le même token
  d'injection). Confirmé dans le code source que les valeurs par défaut
  (`prefix: '/assets/i18n/'`, `suffix: '.json'`) sont identiques à l'ancien
  comportement implicite, donc `provideTranslateHttpLoader()` sans
  argument suffit. La fonction `HttpTranslateLoader()` (factory manuelle)
  et l'import de `HttpClient` dans `app.module.ts` (devenu inutile) ont
  été supprimés.
- `apps/webapp/src/testing/testing-support.ts` : `TranslateModule.forRoot
  ()` sorti de `commonTestImports` (n'existe plus), remplacé par
  `provideTranslateService()` ajouté à `commonTestProviders` — les deux
  tableaux étaient déjà spreadés séparément dans `imports`/`providers` par
  chaque spec, donc déplacement direct sans toucher aux specs elles-mêmes.

**Méthode pour ne pas se faire piéger une seconde fois par une note de
recherche pré-scopée** : avant d'appliquer un breaking change documenté
« à l'avance » dans ce fichier ou dans la mémoire Claude, relire les
`.d.ts` réels du paquet fraîchement installé
(`node_modules/<pkg>/types/*.d.ts` ou équivalent) plutôt que de
faire confiance à la description sommaire — une note prise en avance
décrit l'intention du changement, pas nécessairement sa forme finale
exacte dans le paquet publié.

### Migrations `@angular/core/schematics/migrations.json` (Angular 18)

Vérifiées comme demandé à chaque palier. Deux candidates pertinentes pour
une conversion Nx (pas de `angular.json`) :
- `invalid-two-way-bindings` : **no-op ici** — aucune liaison bidirectionnelle
  bidirectionnelle (`[(x)]="…"`) trouvée dans le code (`grep` sur les deux
  apps, zéro résultat).
- `migration-http-providers` (remplace `HttpClientModule` par
  `provideHttpClient()`) : **délibérément pas appliquée** — `HttpClientModule`
  reste déprécié-mais-fonctionnel, et ce migration est de la modernisation
  d'API (function-based providers) plutôt qu'une correction requise,
  explicitement hors du scope de cette montée de version tant qu'on n'est
  pas stabilisé sur Angular 22 (voir la discipline actée en tête de ce
  fichier). À reconsidérer dans le chantier de modernisation séparé prévu
  après le palier 22.
- Les deux autres entrées du manifeste (`migration-after-render-phase`,
  `add-bootstrap-context-to-server-main`) ne s'appliquent pas à ce code
  (pas d'`afterRender()`, pas de SSR/`main.server.ts`).
- **Note d'outillage** : `npx @angular-devkit/schematics-cli
  "<path>/migrations.json:<nom>"` échoue sur ce repo avec `Unable to
  locate a workspace file` — cette CLI attend un `angular.json` classique,
  absent d'un monorepo Nx (qui utilise `project.json` par projet). `nx
  generate <collection>:<generator>` échoue aussi (Nx cherche le
  générateur dans `collection.json`, pas `migrations.json`). Faute d'un
  moyen direct de lancer ces migrations automatiquement sous Nx, la
  vérification manuelle (grep ciblé + lecture du diff produit par une
  version antérieure si un exemple existe) reste la méthode de facto pour
  ce repo — documenté ici pour ne pas re-perdre de temps à re-tenter les
  deux invocations au prochain palier.

### Petit fix associé

`apps/webapp/src/test-setup.ts` et `apps/admin/src/test-setup.ts` :
`import 'jest-preset-angular/setup-jest'` émettait un nouveau warning de
dépréciation avec `jest-preset-angular` 14.6.2 (« will be removed in the
future… use `setupZoneTestEnv` instead »). Remplacé par `import {
setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone'; setupZoneTestEnv();`
dans les deux fichiers — recommandation officielle du paquet, warning
confirmé disparu après le changement.

### Vérifications finales, toutes vertes sur `/home/tanos/bella`

- Lint webapp : 39 problèmes (5 erreurs / 34 warnings) — identique à la
  baseline.
- Lint admin : 15 problèmes (3 erreurs / 12 warnings) — identique.
- Tests webapp : 30/30 suites (43 tests), plus aucun warning de
  dépréciation Jest.
- Tests admin : 3/3 suites (4 passed, 1 skipped — pré-existant).
- Build production webapp : succès (mêmes avertissements pré-existants —
  budget bundle, dépendance CommonJS `dayjs`).
- Build production admin : succès (mêmes avertissements pré-existants).

**Point curieux non résolu** : `yarn.lock` s'est retrouvé correctement
régénéré (1846 insertions / 1756 suppressions, toutes les entrées
`resolved` vérifiées comme de vraies URLs `registry.npmjs.org`, aucune
trace de la corruption `synp` historique) après le `npm install` de ce
palier, **sans qu'aucune commande `yarn` n'ait été lancée explicitement**
dans cette session. Contenu vérifié cohérent avec `package.json` et
`node_modules` — commité tel quel — mais la cause exacte (Nx 18.3.5 qui
synchroniserait le lockfile alternatif en tâche de fond ? un effet de
bord d'un des `npx`/`nx generate` lancés pour les migrations ?) n'a pas
été identifiée. À surveiller aux prochains paliers : si ce comportement
se reproduit de façon prévisible, ça vaut la peine d'identifier la source
exacte ; si `yarn.lock` ressort au contraire incohérent ou corrompu une
fois, revenir à la recette manuelle npm→synp documentée plus haut dans ce
fichier.

## Palier 18→19 : fait (commit à suivre juste après ce document)

Versions posées dans `package.json` : famille Angular `~19.2.25`,
`@angular/cdk`/`@angular/material` `19.2.19`, `@angular/cli`/
`@angular-devkit/build-angular`/`@angular/pwa` `~19.2.27`,
`@angular-eslint/*` `~19.8.1`, `nx`+tous les `@nrwl/*` `19.8.14`,
`nx-cloud` `19.1.3`, `zone.js` `~0.15.1`, `typescript` `~5.8.3`
(`@angular/compiler-cli@19.2.25` exige `>=5.5 <5.9`, `~5.4.5` était devenu
hors plage). Trois libs UI à peer strict sur le major Angular bumpées
encore une fois : `@ng-select/ng-select` `^13.9.1`→`^14.9.0`,
`ngx-bootstrap` `18.1.3`→`19.0.2` exact, `ngx-device-detector`
`^8.0.0`→`^9.0.0`. `@ngx-translate/core`/`http-loader` **inchangés**
(`^18.0.0` — la lib n'a pas encore de version 19.x publiée au moment de ce
palier, et son peer `@angular/core: ">=18"` n'a pas de plafond, donc pas
de blocage).

### `@typescript-eslint` avancé à la v8 (comme anticipé)

`@typescript-eslint/eslint-plugin`/`parser` `^7.18.0`→`^8.70.1`, override
`@typescript-eslint/utils` mis à jour à `8.70.1` en cohérence (toujours
aucune copie imbriquée après install — `@angular-eslint@19.8.1` accepte
`@typescript-eslint/utils@^7.11.0 || ^8.0.0`, donc pas de conflit).
Contrairement à la note prise en avance, **`@typescript-eslint/no-explicit-
any` n'est pas remonté de `warn` à `error`** avec cette version précise
(peut-être un détail de config `recommended` différent de celui rencontré
sur afrik-tangazo, ou un changement entre 8.x mineurs) — vérifié par un
lint complet après l'install, toujours 34 warnings sur ces occurrences,
aucun nouveau `error`. **`@angular-eslint/prefer-standalone` est bien
apparue comme prévu** (41 nouvelles erreurs au premier lint) — désactivée
dans les deux `apps/*/​.eslintrc.json` (`"@angular-eslint/prefer-standalone":
"off"`, dans le même bloc d'override `*.ts` que les règles de sélecteur),
conflit direct avec la discipline "pas de standalone avant Angular 22".
Lint revenu exactement aux baselines (webapp 39, admin 15) après ce
changement.

### Migration `explicit-standalone-flag` — la vraie difficulté du palier

Comme anticipé, Angular 19 inverse le défaut du flag `standalone` : tout
composant/directive/pipe sans `standalone` explicite devient
`standalone: true` au lieu de `false`, cassant tout ce qui est déclaré
dans un `NgModule` sans ce flag — 49 fichiers concernés ici (tous les
composants de `webapp`+`admin` sauf un, voir plus bas), donc pas une
migration qu'on peut se permettre de sauter.

**Le blocage d'outillage anticipé s'est confirmé** : `npx
@angular-devkit/schematics-cli "<path>/migrations.json:explicit-standalone-flag"`
échoue sur ce monorepo Nx avec `Unable to locate a workspace file — Are
you missing an angular.json?`, et `nx generate <collection>:<generator>`
ne sait pas non plus lire les migrations d'un `migrations.json` (il
cherche dans un `collection.json`). **Solution qui a marché** : générer un
`angular.json` minimal et temporaire à la racine, listant `webapp` et
`admin` comme deux `projectType: application` avec juste
`root`/`sourceRoot`/`architect.build.options.tsConfig` (repris de leurs
`project.json` Nx respectifs) — assez pour que le lecteur de workspace
d'Angular DevKit s'en contente et que le schematic construise son
`ts.Program` sur les deux apps. Invocation (immédiatement après, `--force`
nécessaire car les fichiers ne sont pas dans un état "clean" git au sens
du schematic) :
```
npx @angular-devkit/schematics-cli \
  "./node_modules/@angular/core/schematics/migrations.json:explicit-standalone-flag" \
  --no-debug --no-dry-run --force
```
47 fichiers mis à jour avec `standalone: false` (dry-run vérifié d'abord
sans `--no-dry-run`). `angular.json` supprimé juste après (fichier
temporaire, jamais commité — le monorepo reste piloté par Nx/`project.json`
uniquement). Reformatage ensuite avec `npx prettier --write <fichiers>`
(le schematic écrit en 4 espaces, comme sur afrik-tangazo).

**Un seul fichier sur les 49 repérés par un grep initial n'a pas été
touché** : `apps/webapp/src/app/pages/account/profile/view/
view-profile.component.ts` — vérifié : c'est du code mort, jamais déclaré
dans un `NgModule` ni importé nulle part (`grep -rn ViewProfileComponent`
ne remonte que sa propre définition). Le schematic construit son
`ts.Program` à partir du graphe de compilation réel atteignable depuis
`main.ts`, donc un fichier non importé n'y figure jamais — cohérent, pas
un bug du schematic. Laissé tel quel, hors scope de cette migration (dette
antérieure, sans rapport).

**Cette recette d'`angular.json` temporaire est réutilisable telle quelle
pour toute future migration `@angular-devkit/schematics-cli` sur ce
monorepo** — documenté ici pour ne pas re-découvrir le blocage
`Unable to locate a workspace file` à chaque fois.

### Bump forcé de l'écosystème Jest à la v30 (découverte en cours de route)

`jest-preset-angular` `~14.6.2` plafonnait son peer-range Angular à
`<19.0.0` (comme `13.1.4` avait plafonné à `<18.0.0` au palier précédent)
— **mais sa version suivante compatible avec Angular 19 (`15.0.0`/`16.x`)
exige `jest: ^30.0.0`**, une majeure entière plus loin que prévu par la
recherche pré-scopée (qui ne mentionnait que jest-preset-angular, pas
Jest lui-même). Bump en bloc : `jest` `29.7.0`→`30.5.2`,
`jest-environment-jsdom` `29.7.0`→`30.5.2`, `@types/jest` `29.5.14`→
`30.0.0`, `jest-preset-angular` `~14.6.2`→`~16.2.0` (couvre Angular 19-21,
réduit les churns futurs comme au palier 16). `ts-jest` **inchangé**
(`29.4.12` accepte déjà `jest: ^29.0.0 || ^30.0.0` en peer, pas de bump
nécessaire). Aucune régression de test observée après le bump (30/30 puis
3/3 suites, sans changement de code de test).

### Deux petits fixes de dépréciation associés (mêmes fichiers qu'au palier précédent)

- `apps/webapp/jest.config.ts` et `apps/admin/jest.config.ts` : le bloc
  `globals: { 'ts-jest': {...} }` émettait un nouveau warning ts-jest
  (« Define `ts-jest` config under `globals` is deprecated ») avec la
  chaîne jest 30 / jest-preset-angular 16. Déplacé dans la forme tuple du
  `transform` : `'^.+\\.(ts|mjs|js|html)$': ['jest-preset-angular', {
  tsconfig: ..., stringifyContentPathRegex: ... }]`. Warning confirmé
  disparu, mêmes suites vertes.

### Migrations `@angular/core/schematics/migrations.json` (Angular 19) — les 3 autres

- `pending-tasks` (`ExperimentalPendingTasks`→`PendingTasks`) : no-op,
  aucun usage dans le code (`grep` vide sur les deux apps).
- `provide-initializer` (`APP_INITIALIZER`/`ENVIRONMENT_INITIALIZER`/
  `PLATFORM_INITIALIZER`→`provideAppInitializer`/etc.) : no-op, même
  vérification, aucun usage.
- `add-bootstrap-context-to-server-main` : non applicable, pas de SSR
  (`main.server.ts` n'existe pas dans ce repo).

### Nouveau avertissement de build (non bloquant, hors scope)

Le build de production `webapp` fait apparaître de nouveaux warnings Sass
(« `@import` rules are deprecated and will be removed in Dart Sass 3.0.0 »)
sur 4 fichiers `.component.scss` qui utilisent encore `@import` au lieu de
`@use`/`@forward` — conséquence du bump de la chaîne `sass`/`sass-loader`
embarquée par `@angular-devkit/build-angular` 19. Non bloquant (warning,
pas erreur), et une conversion `@import`→`@use` est un chantier Sass à
part entière, sans rapport avec la montée de version Angular — noté ici
pour ne pas le re-découvrir à chaque palier, mais délibérément pas
corrigé.

### Vérifications finales, toutes vertes sur `/home/tanos/bella`

- Lint webapp : 39 problèmes (5 erreurs / 34 warnings) — identique à la
  baseline, après désactivation de `@angular-eslint/prefer-standalone`.
- Lint admin : 15 problèmes (3 erreurs / 12 warnings) — identique.
- Tests webapp : 30/30 suites (43 tests), sans le code migré vers
  `standalone: false` explicite.
- Tests admin : 3/3 suites (4 passed, 1 skipped — pré-existant).
- Build production webapp : succès (nouveaux warnings Sass `@import`
  documentés ci-dessus, budget bundle pré-existant, dépendance CommonJS
  `dayjs`).
- Build production admin : succès (mêmes avertissements pré-existants).

`.gitignore` élargi de `/.nx/cache` à `/.nx` (Nx 19 ajoute un dossier
`.nx/workspace-data/` à côté du cache — ni l'un ni l'autre n'a vocation à
être commité).

## Palier 19→20 : fait (commit à suivre juste après ce document)

Versions posées dans `package.json` : famille Angular `~20.3.31`,
`@angular/cdk`/`@angular/material` `20.2.14`, `@angular/cli`/
`@angular-devkit/build-angular`/`@angular/pwa` `~20.3.37`,
`@angular-eslint/*` `~20.7.0`. `typescript` **inchangé** (`~5.8.3` — le
peer de `@angular/compiler-cli@20.3.31` est `>=5.8 <6.0`, toujours dans la
plage, première fois depuis le palier 17 qu'aucun des trois — typescript/
rxjs/jest-preset-angular — n'a eu besoin d'un ajustement en dehors de sa
propre version). `zone.js` inchangé aussi (`~0.15.1`, pas de peer strict
qui l'imposerait). Les trois libs UI à peer strict sur le major Angular,
revérifiées comme prévu : `@ng-select/ng-select` `^14.9.0`→`^16.0.0` (`15.x`
vise Angular 19, `16.0.0` vise Angular 20 — encore un saut de deux majeures
de la lib pour un seul palier Angular), `ngx-bootstrap` `19.0.2`→`20.0.2`
exact (leur numérotation continue de suivre celle d'Angular 1-pour-1),
`ngx-device-detector` `^9.0.0`→`^10.1.0`. `@ngx-translate/core`/
`http-loader` toujours `^18.0.0` (pas de version 20.x publiée à ce jour,
peer plancher `>=18` sans plafond). `jest-preset-angular` `~16.2.0`→
`~17.0.0` (couvre Angular 20-22, `jest: ^30.0.0` déjà en place depuis le
palier précédent — aucun bump Jest requis cette fois).

### Renommage `@nrwl/*` → `@nx/*` (Nx 20 supprime les alias legacy)

**Découverte en amont du bump** : les paquets `@nrwl/*` n'ont tout
simplement **aucune version 20.x publiée** (`npm view @nrwl/angular
versions` s'arrête à `19.8.14`) — contrairement aux paliers précédents où
`@nrwl/*` restait un alias compatible de la même version que `nx` lui-même.
`nx-cloud` (le paquet, pas `@nrwl/nx-cloud`) s'arrête pareil à `19.1.3`,
sans successeur `@nx/*` connu (fonctionnalité Nx Cloud non câblée sur ce
repo de toute façon, cf. `CLAUDE.md` — supprimé du `package.json` plutôt
que de laisser une version figée sans mise à jour possible).

Renommage complet vers l'espace de noms scindé par domaine `@nx/*`
(20.8.4, aligné sur `nx` lui-même) :
- `package.json` : `@nrwl/angular`→`@nx/angular`, et en devDependencies
  `@nrwl/cypress`→`@nx/cypress`, `@nrwl/eslint-plugin-nx`→`@nx/eslint-
  plugin`, `@nrwl/jest`→`@nx/jest`, `@nrwl/linter`→**`@nx/eslint`** (le
  paquet `@nrwl/linter` n'a pas de simple équivalent `@nx/linter` — sa
  responsabilité de lint a été absorbée par `@nx/eslint`), `@nrwl/nest`→
  `@nx/nest`, `@nrwl/node`→`@nx/node`, `@nrwl/workspace`→`@nx/workspace`,
  plus `@nx/js` et `@nx/webpack` ajoutés (nécessaires pour les executors
  de `apps/api`, absents de la liste `@nrwl/*` d'origine sous ces noms
  exacts mais bien requis une fois renommé — vérifié après coup que le
  build de l'API n'était pas dans le scope de vérification de ce palier
  mais que ces deux paquets sont correctement résolus).
- **Executors dans tous les `project.json`** (`apps/api`, `apps/admin`,
  `apps/webapp`, `apps/admin-e2e`, `apps/webapp-e2e`, `libs/dtos`,
  `libs/api/domain`, `libs/api/adapters`) : `@nrwl/webpack:webpack`→
  `@nx/webpack:webpack`, `@nrwl/js:node`→`@nx/js:node`,
  `@nrwl/jest:jest`→`@nx/jest:jest`, `@nrwl/cypress:cypress`→
  `@nx/cypress:cypress`, et **`@nrwl/linter:eslint`→`@nx/eslint:lint`**
  (le nom de l'executor change aussi, pas seulement le paquet — vérifié
  dans `node_modules/@nx/eslint/executors.json`, un seul executor exposé,
  nommé `lint`). Toutes les valeurs vérifiées contre les `executors.json`
  réels des paquets installés avant d'éditer, pas devinées.
- **`.eslintrc.json`** (racine + `apps/webapp` + `apps/admin`) : le nom
  court du plugin change de `@nrwl/nx` à `@nx` (convention ESLint pour un
  paquet `@scope/eslint-plugin` sans suffixe — vérifié via
  `Object.keys(require('@nx/eslint-plugin').configs)` et `.rules`) :
  `"plugins": ["@nrwl/nx"]`→`["@nx"]`, `@nrwl/nx/enforce-module-
  boundaries`→`@nx/enforce-module-boundaries`, `plugin:@nrwl/nx/typescript`
  /`javascript`/`angular`/`angular-template`→`plugin:@nx/typescript` etc.
- **Imports directs** : `jest.preset.js` (`@nrwl/jest/preset`→
  `@nx/jest/preset`), `jest.config.ts` racine (`@nrwl/jest`→`@nx/jest`,
  fonction `getJestProjects`), les deux `apps/*-e2e/cypress.config.ts`
  (`@nrwl/cypress/plugins/cypress-preset`→`@nx/cypress/plugins/cypress-
  preset`, fonction `nxE2EPreset`).
- **`nx.json`** : bloc `generators` — clés `@nrwl/angular`/`@nrwl/angular:
  application`/`:library`/`:component`→`@nx/angular` équivalents (les
  générateurs par défaut de `nx generate`, pas bloquant si oublié mais
  corrigé pour la cohérence).
- **`decorate-angular-cli.js`** (script local, pas un paquet) : son
  `require('@nrwl/workspace').output` pour les logs colorés du
  postinstall échouait silencieusement (`Angular CLI could not be
  decorated... Please ensure @nrwl/workspace is installed`, script qui se
  contente d'un `console.warn` + `process.exit(0)` en cas d'échec — donc
  install pas bloquée, mais la mise en cache de calcul de `ng <cmd>` ne
  s'activait plus). Corrigé en `require('@nx/workspace').output` — vérifié
  que `@nx/workspace` exporte bien `output` à l'identique.

Vérification finale : `grep -rln "@nrwl" --include="*.json" --include="*.js"
--include="*.ts" .` (hors `node_modules`) revient vide.

**Point de méthode qui a évité de deviner dans le vide** : avant d'éditer
quoi que ce soit, installer d'abord les nouvelles versions puis inspecter
les vrais `executors.json`/exports des paquets fraîchement installés
(`@nx/eslint/executors.json`, `Object.keys(require('@nx/eslint-plugin').
configs)`, etc.) plutôt que de deviner les noms par analogie avec l'ancien
schéma `@nrwl/*` — la leçon du palier 18 sur `@ngx-translate/core`
(ne pas faire confiance à une note prise en avance) s'applique tout aussi
bien à un renommage de paquets Nx.

### Nouvelle règle lint à désactiver : `@angular-eslint/prefer-inject`

`@angular-eslint` 20.7.0 introduit `prefer-inject` (préférer `inject()` à
l'injection par constructeur) — 109 nouvelles erreurs au premier lint,
sur `webapp` uniquement (le code de service de `webapp` injecte tout par
constructeur). **Désactivée** dans les deux `apps/*/.eslintrc.json`,
même bloc que `prefer-standalone` — conflit direct avec la discipline de
ce chantier ("injection par constructeur conservée pendant toute la montée,
pas d'`inject()` avant la fin de l'échelle", cf. tête de ce fichier et
`project_angular_migration_bella` en mémoire Claude). Lint revenu aux
baselines (webapp 39, admin 15) après désactivation.

### Migration `document-core` (seule migration Angular 20 applicable)

Sur les 6 migrations listées dans `migrations.json` d'Angular 20 :
- `inject-flags` (enum `InjectFlags` déprécié) : no-op, aucun usage.
- `test-bed-get` (`TestBed.get()` déprécié) : no-op, aucun usage.
- `control-flow-migration` (`*ngIf`/`*ngFor`→`@if`/`@for`) : marquée
  `optional` dans le manifeste, **délibérément pas appliquée** — c'est
  exactement la modernisation de template différée à un chantier séparé
  après la fin de l'échelle (cf. discipline en tête de ce fichier).
- `router-current-navigation` (`Router.getCurrentNavigation()` déprécié) :
  no-op, aucun usage, et marquée `optional` de toute façon.
- `add-bootstrap-context-to-server-main` : non applicable, pas de SSR.
- **`document-core`** (déplace l'import de `DOCUMENT` de `@angular/common`
  vers `@angular/core`) : **applicable**, 2 fichiers concernés
  (`apps/webapp/src/app/pages/account/account.component.ts` et
  `.../profile/create/create-profile-component.ts`). Corrigé à la main
  (changement d'import trivial, pas besoin de l'outillage schematics-cli
  pour 2 fichiers) — vérifié au passage que `@angular/common` réexporte
  encore `DOCUMENT` depuis `@angular/core` en interne (donc l'ancien
  import n'aurait pas cassé immédiatement, mais suivre la migration
  officielle reste la bonne pratique).

### Régression de build corrigée : budget bundle `admin` dépassé en erreur

Le build de production `admin` a échoué pour la première fois de tout le
chantier : `bundle initial exceeded maximum budget. Budget 1.00 MB was not
met by 42.32 kB with a total of 1.04 MB` — le total du bundle initial (qui
grossit d'un palier à l'autre, avertissement déjà pré-existant et ignoré
depuis le palier 17 sur le seuil `maximumWarning: 500kb`) a fini par
dépasser aussi le seuil `maximumError: 1mb` d'`apps/admin/project.json`,
purement à cause de la croissance normale du runtime Angular 20 par
rapport à Angular 19 (928.91 kB→1.04 MB), sans rapport avec un choix de ce
palier. **`webapp` n'a jamais eu ce problème** car son propre budget
`maximumError` était déjà à `2mb`. Fixé en alignant `admin` sur la même
valeur (`1mb`→`2mb` dans `apps/admin/project.json`) plutôt que de
retoucher le code — un budget de bundle est un choix de seuil
opérationnel, pas une contrainte de la migration Angular elle-même. Le
warning à 500kb reste tel quel (pré-existant, hors scope).

### Vérifications finales, toutes vertes sur `/home/tanos/bella`

- Lint webapp : 39 problèmes (5 erreurs / 34 warnings) — identique à la
  baseline, après désactivation de `@angular-eslint/prefer-inject`.
- Lint admin : 15 problèmes (3 erreurs / 12 warnings) — identique.
- Tests webapp : 30/30 suites (43 tests), aucun warning.
- Tests admin : 3/3 suites (4 passed, 1 skipped — pré-existant).
- Build production webapp : succès (mêmes avertissements pré-existants).
- Build production admin : succès après le fix de budget ci-dessus (même
  warning de bundle à 500kb, pré-existant).

## Prochaine étape

Palier 20→21 (Angular 21), à faire depuis `/home/tanos/bella`. Pas de
piège structurel connu à l'avance, mais méthode à suivre scrupuleusement
vu l'expérience des 4 derniers paliers :
1. Vérifier `node_modules/@angular/core/schematics/migrations.json` pour
   du nouveau (réutiliser la recette d'`angular.json` temporaire
   documentée plus haut si une migration `schematics-cli` s'avère
   nécessaire).
2. Bump `package.json` : Angular + cdk/material + cli/build-angular +
   eslint, **revérifier `ngx-bootstrap`/`ng-select`/`ngx-device-detector`
   un par un** (peer strict sur le major Angular à chaque palier depuis
   la 17, sans exception jusqu'ici).
3. **Revérifier systématiquement les paquets `@nx/*` et `nx` lui-même**
   pour un nouveau renommage/dépréciation de paquet (le coup `@nrwl/*`→
   `@nx/*` a été une découverte tardive ce palier-ci — ne plus supposer
   qu'un simple bump de version suffit pour l'écosystème Nx, toujours
   vérifier `npm view @nx/<pkg> versions` avant d'assumer la continuité).
4. Revérifier la compatibilité `typescript`/`rxjs`/`jest-preset-angular`
   (chaîne cassée à 3 paliers sur 4 jusqu'ici, sauf celui-ci).
5. `.angular/cache`/`.nx` à nettoyer avant tout `serve` post-palier.
6. **Vérifier les budgets de bundle des deux apps après le build** — la
   croissance normale du runtime Angular peut faire franchir un seuil
   `maximumError` sans rapport avec le code migré (vécu ce palier-ci sur
   `admin`).
7. Build/lint/test des deux apps, commit.
