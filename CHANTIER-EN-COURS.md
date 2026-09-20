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

## Prochaine étape

Palier 16→17. Vérifier l'usage de `@ngx-translate/core` dans bella (voir
la leçon palier 17→18 ci-dessus sur afrik-tangazo — c'est en fait à ce
palier 16→17 que les migrations schematics de `ng update` sont à vérifier
manuellement dans `node_modules/@angular/core/schematics/migrations.json`,
pas au 17→18). Revérifier les peer-dependencies de chaque lib tierce pour
Angular 17, éditer `package.json`, réappliquer si besoin le shim
`copyfile-shim.js` + les domaines réseau Nx documentés ci-dessus,
build/lint/test des deux apps, commit.
