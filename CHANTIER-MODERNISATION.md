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

### 1. Conversion `*ngIf`/`*ngFor` → `@if`/`@for` — FAIT (2026-09-22)

Exécuté en sous-agent isolé (fork), sur demande explicite de
l'utilisateur ("lance le sweep @if/@for en sous-agent isolé. attaque
tout ce que tu peux"). Les 29 fichiers `.html` initialement recensés
ont été convertis, **plus 2 fichiers supplémentaires** que le grep scopé
à `*.html` avait manqués : `picture-uploader.ts` et
`stepped-form-field.ts` ont un template inline (`template:` dans le
décorateur `@Component`), pas de fichier `.html` séparé — repéré via un
second grep sur `*.ts` avant de clore le sweep. Les cas piégeux anticipés
ont tous été traités, pas contournés :
- **`then`/`else` par référence de template** (`ad-detail.component.html`,
  `ad-card.component.html`) : inlinés directement dans les blocs
  `@if {} @else {}`, les `ng-template` nommés désormais inutiles supprimés.
- **`*ngIf="... as x"`** : devenu `@if (...; as x)` partout.
- **`*ngFor` avec ou sans `trackBy`** : `track` choisi au cas par cas —
  `ad.id`/`publication.id` pour les listes d'annonces (identifiant stable
  du DTO), `country.iso2` pour la liste de pays, `adsByCategory.category.code`
  pour les groupes par catégorie, identité d'objet (`track step`/
  `track picture`) pour les `FormlyFieldConfig`/`Picture` sans champ
  unique garanti, `track $index` pour un tableau de simples emplacements
  vides (`remainingImagePlaceHolders`, où les éléments n'ont pas
  d'identité propre).

**Seul renoncement, documenté et volontaire** : les deux boucles de
slides swiper (`carousel.component.html`, `ads-previewer.component.html`)
sont restées en `*ngFor`/`*ngIf` sur des `<ng-template swiperSlide>` —
le wrapper Angular de swiper lit un `TemplateRef` par instance de
`ng-template` via `ContentChildren(SwiperSlideDirective)` pour son API de
projection de contenu, et rien dans la suite de tests ne permet de
vérifier que `@for`/`@if` produirait exactement le même comportement de
projection par itération. Commentaire explicatif + `eslint-disable-next-line
@angular-eslint/template/prefer-control-flow` posés sur ces 4 lignes
plutôt que de désactiver la règle globalement.

`@angular-eslint/template/prefer-control-flow` réactivée dans les deux
`eslint.config.mjs` (suppression du `'off'`, blocs `.ts` et `.html`).
Vérifié : lint webapp revenu exactement à la baseline (39 problèmes :
5 erreurs / 34 warnings), lint admin idem (15 : 3/12), 30/30 suites
webapp + 5/5 suites admin vertes, build propre sur les deux apps
(mêmes warnings préexistants qu'avant le sweep). 6 commits, un par lot
vérifié (`8367741` à `bea7273`).

### 2. `inject()` au lieu de l'injection par constructeur — FAIT (2026-09-22)

Initialement dimensionné à 65 fichiers et jugé trop large pour une passe
"triviale" dans le même message que le sweep `@if`/`@for` — repris
juste après sur demande explicite de l'utilisateur ("lance aussi le
sweep inject() en parallèle"), en sous-agent isolé, concurrent au sweep
`@if`/`@for` dans le même répertoire de travail (`/home/tanos/bella`).

**Coordination inter-agents** : les deux sweeps travaillaient sur la même
copie de travail en simultané. Deux fichiers avaient à la fois un
template inline avec `*ngIf`/`*ngFor` et un constructeur injecté
(`picture-uploader.ts`, `stepped-form-field.ts`) — exclus du sweep
`inject()` tant que le sweep `@if`/`@for` n'avait pas fini de les
toucher, puis traités séparément une fois l'autre sweep terminé
(`stepped-form-field.ts` n'avait en fait aucune dépendance injectée à
convertir — juste `super()` + un `uid`). Chaque sweep n'a fait que des
`git add <fichiers précis>`, jamais `git add -A`, pour ne jamais
embarquer les changements en cours de l'autre agent dans son propre
commit.

**Règle de périmètre appliquée** : seules les classes gérées par le DI
Angular (`@Component`/`@Directive`/`@Injectable`/`@Pipe`, gardes de route)
ont été converties — les classes utilitaires instanciées à la main via
`new` (ex. `ApprobationEvent` dans `publications-list.component.ts`,
`Picture`/`PicturesHolder` dans `picture-uploader.ts`) ont été
délibérément laissées intactes, `inject()` n'ayant de sens que dans un
contexte d'injection Angular actif.

**Mécanique notable** : les paramètres de constructeur sans modificateur
d'accès (donc jamais stockés en `this.x`, juste utilisés localement dans
le corps du constructeur — ex. `deviceService`/`translate` dans
`app.component.ts`) ont quand même été remontés en champs `private x =
inject(X);`, `inject()` ayant besoin d'un contexte d'injection actif que
seul un champ de classe ou le corps du constructeur fournit encore une
fois celui-ci vidé de ses paramètres. Ordre de déclaration des champs
respecté scrupuleusement : un champ `inject()`-backed référencé par un
autre initialiseur de champ (`countries$ = this.countriesService.getAll()`)
doit être déclaré avant lui — contrairement aux "parameter properties" de
constructeur, les champs de classe s'exécutent strictement dans l'ordre
d'écriture, pas dans un ordre spécial.

Un fichier manqué en première passe (`home.service.ts`) a été repéré et
corrigé grâce à la vérification finale : réactiver
`@angular-eslint/prefer-inject` dans les deux `eslint.config.mjs` a fait
remonter ses 2 erreurs, invisibles tant que la règle restait désactivée.

`nx lint`/`test`/`build` vérifiés à chaque lot (5 lots webapp, 1 lot
admin, plus le lot final des 2 fichiers réservés), tous revenus aux
baselines documentées. `@angular-eslint/prefer-inject` réactivée dans
`apps/webapp/eslint.config.mjs` et `apps/admin/eslint.config.mjs`,
confirmée à zéro violation sur les deux apps.

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
| `@nestjs/config` | `^2.1.0` | `12.0.0` |
| `@nestjs/jwt` | `^8.0.1` | `12.0.2` |
| `@nestjs/passport` | `^8.2.2` | `12.0.0` |
| `@nestjs/terminus` | `^8.1.0` | `12.1.0` |
| `@nestjs/axios` | `^0.0.8` | `12.0.1` |
| `@nestjs/schematics`/`testing` (dev) | `^9.0.0` | alignés sur core |
| `mongoose` (driver) | `^6.13.10` | `9.10.1` — pas juste 6→7, il existe déjà des 7.x/8.x/9.x publiées, 3 majeures de retard comme le cœur Nest |
| `passport` | `^0.6.0` | `0.7.0` (mineure) |
| `passport-jwt` | `^4.0.0` | `4.0.1` (patch) |
| `passport-local` | `^1.0.0` | `1.0.0` (déjà à jour) |
| `rxjs` | `~7.8.2` | déjà à jour (aligné front) |
| `reflect-metadata` | `^0.1.13` | `0.2.2` |

Vérifié : tous les paquets `@nestjs/*` convergent proprement sur la
majeure 12 (aucun n'est resté en retrait, contrairement à ce qu'on
aurait pu craindre pour les paquets moins maintenus comme `axios`/
`terminus`) — un `nest upgrade`/bump groupé à 12.x pour toute la famille
`@nestjs/*` est cohérent une fois la ladder terminée. `passport*` bougent
à peine (aucune montée majeure requise là). `mongoose` (driver) est la
vraie autre grosse dépendance à faire suivre le rythme, pas seulement le
framework.

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

### Plan de paliers 9→10→11→12 (recherche 2026-09-22)

Vérifié via les guides de migration officiels NestJS (`docs.nestjs.com/
migration-guide`, releases GitHub `nestjs/nest`) et la doc Mongoose
officielle (`mongoosejs.com/docs/migrating_to_7.html` et suivants) par
recherche web — cité ci-dessous ce qui est confirmé par une source vs.
déduit. Le code actuel de `apps/api` a été relu (`main.ts`,
`jwt.strategy.ts`, `permissions.guard.ts`, les 5 schémas Mongoose,
`ads-repository-nest.ts`, `my-config.module.ts`, `mongodb.module.ts`,
`health.controller.ts`) pour ne retenir que les breaking changes qui
touchent vraiment ce que ce code utilise.

**Palier 9→10 : fait** (commit `db2c79a`). Cible posée :
`@nestjs/core`/`common`/`platform-express` `~10.4.19`, `@nestjs/schematics`
`~10.2.3` (dev), `@nestjs/testing` `~10.4.22` (dev). Confirmé sans risque
comme prévu : pas de microservices Nest dans ce codebase (aucune trace de
`@nestjs/microservices`), `typescript` déjà largement au-dessus du plancher
requis.

**Écart par rapport au plan initial** : le scope "3 paquets seulement"
s'est révélé infaisable tel quel — `@nestjs/mongoose@^9.1.1` et
`@nestjs/terminus@^8.1.0` verrouillent leur peer sur `@nestjs/core`
`^8||^9`, donc toute la famille `@nestjs/*` a dû suivre : `mongoose`
`~10.1.0`, `terminus` `~10.3.0`, `config` `~4.0.4` (sa propre numérotation
saute de 4.x direct à 12.x, aucune version 10.x/11.x n'existe), `passport`
`~10.0.3`, `jwt` `~12.0.2` (déjà compatible `core ^10` à sa dernière
version, pas de raison de la retenir).

**Piège trouvé en vérifiant, pas juste en lisant le code** :
`@nestjs/axios` a nécessité un pin précis, pas son dernier majeur — le
`HttpHealthIndicator` de `terminus@10.3.0` déclare un peer
`"^1.0.0 || ^2.0.0 || ^3.0.0"` pour `@nestjs/axios` (indépendant du propre
cycle de version d'axios, qui est déjà à 12.x). Utiliser la dernière
version d'`@nestjs/axios` a fait planter la suite de tests du health check
à l'exécution (`process.exit(1)` interne à `checkPackages()` de terminus —
ce n'est pas une validation semver, juste un `require()` qui échoue, donc
l'incompatibilité de version remonte comme un crash runtime et pas comme
un avertissement d'install). Fixé en pinnant `@nestjs/axios` à `~3.1.3` et
en ajoutant `axios` (la lib HTTP brute, peer d'`@nestjs/axios`) `~1.20.0`
en dépendance explicite — elle n'était en fait **jamais installée**
avant, alors même que l'ancien `@nestjs/axios@0.0.8` la réclamait déjà ;
le test du health check ne passait avant que parce qu'il n'exerçait pas
ce chemin de code avant ce palier.

`npm install` a nécessité `--legacy-peer-deps`, mais pour une raison sans
rapport avec ce palier : `@angular-devkit/build-angular@~22.1.8` vs le
peer range déclaré par `@nx/angular` (`>=19 <22`) sont incohérents depuis
la migration Angular 22 elle-même (`cf57dcd`) — jamais remonté avant
faute d'un `npm install` complet à froid depuis. Laissé tel quel, hors
scope d'un palier NestJS ; à regarder séparément.

Vérifié vert : `nx build/test/lint api` (tests 5/5 suites, 20/20 tests ;
lint baseline inchangée, 24 problèmes / 0 erreur / 24 warnings) — plus,
pour la première fois, `api-domain`/`api-adapters`/`dtos` intégrés à la
routine de vérification comme le suggérait `CHANTIER-EN-COURS.md` (tous
verts).

**Palier 10→11** — cible `~11.x` dernier patch. Points vérifiés qui
touchent potentiellement ce code :
- **Express v5 devient la valeur par défaut**, avec un moteur de routage
  changé (`path-to-regexp` mis à jour) — le wildcard `*` autonome n'est
  plus un joker gourmand, il doit être nommé (`/*splat` au lieu de `/*`).
  **Vérifié sans risque ici** : `grep` sur tous les contrôleurs
  (`apps/api/src/app/api/**/*.ts`, `main.ts`) ne trouve aucune route
  avec un `'*'` littéral en chemin.
- Node.js ≥ 20 requis (v16/v18 abandonnés). **Décision actée avec
  l'utilisateur (2026-09-22) : ne pas bloquer ce palier sur la version
  Node du serveur EC2/PM2 de prod (`ecosystem.config.js` ne la précise
  toujours pas, et ce n'est pas le sujet pour l'instant) — viser
  directement la dernière LTS Node disponible au moment de l'exécution du
  palier** (vérifier via `node --version` sur l'environnement de dev/CI et
  `nvm ls-remote --lts`/le site nodejs.org au moment de s'y mettre, pas
  supposé à l'avance). La compatibilité avec le serveur de prod reste à
  vérifier avant un déploiement réel, mais ça ne doit plus retarder le
  développement du palier lui-même.
- L'API "legacy" des health indicators est retirée, migration vers
  `HealthIndicatorService` pour les indicateurs **custom**. **Risque
  faible mais à vérifier au palier** : `health.controller.ts` n'utilise
  que les indicateurs intégrés (`HealthCheckService`,
  `HttpHealthIndicator`, `MongooseHealthIndicator` avec `.pingCheck()`)
  — pas d'indicateur custom écrit dans ce repo — mais la signature exacte
  de `.pingCheck()` sur les indicateurs intégrés doit être revérifiée
  dans la doc de la version ciblée au moment de l'exécution (non confirmé
  par la recherche si elle a changé).
- Ordre d'exécution des middleware de modules globaux changé (exécutés en
  premier désormais) — **impact non identifiable sans lire tous les
  middlewares du repo**, `main.ts` n'a qu'un `app.enableCors(...)`, pas de
  middleware custom visible dans les fichiers lus ; à revérifier plus
  largement (`grep -rn "NestMiddleware\|app.use("`) au moment du palier.
- Résolution de modules : nécessite un `moduleResolution` moderne dans
  `tsconfig` sous peine d'erreurs au runtime — **déjà `"bundler"`** dans
  `tsconfig.base.json`, donc déjà conforme.

**Palier 10→11 : fait** (2026-09-23, commits `1bb856d` puis `8d2eb59`).
Deux écarts réels par rapport au plan ci-dessus, découverts en vérifiant
plutôt qu'en lisant les changelogs :
- **Le driver `mongoose` (6→9) n'était pas aussi découplé du cœur Nest que
  supposé** : `@nestjs/mongoose@11` exige le driver `^7||^8||^9`, donc le
  bump du driver a dû se faire *avant* ce palier plutôt qu'« en parallèle »
  (commit séparé `1bb856d`). Fait à cette occasion : les 5
  `XDocument = X & Document` migrés vers `HydratedDocument<X>` (pattern
  recommandé depuis Mongoose 7), `useFindAndModify` (mort depuis Mongoose
  6) supprimé, `new: true` → `returnDocument: 'after'` (Mongoose 9
  déprécie `new`/`returnOriginal`), et `mongoose.set('strictQuery', true)`
  posé explicitement dans `main.ts` — Mongoose 7 a basculé ce défaut à
  `false`, et `AdsController` passe `@Query() filter: any` tel quel dans
  le filtre Mongo (`ads-repository-nest.ts`), donc l'ancien défaut
  protégeait silencieusement contre les clés de filtre hors schéma ; sans
  ce `set()` explicite, la bascule de version aurait changé ce
  comportement sans que rien ne l'indique.
- **`@nestjs/terminus@10.3.0` (posé au palier 9→10) verrouille son propre
  peer sur `@nestjs/mongoose@^9||^10`** — bumper `@nestjs/mongoose` à 11.x
  a donc aussi forcé `@nestjs/terminus` à 11.1.1 (dont le peer accepte
  `@nestjs/core@^10||^11`, donc sans forcer le cœur Nest à ce stade).
  `@nestjs/swagger`, lui, a dû suivre le cœur Nest plutôt que le driver
  Mongoose : son propre versionnage saute d'un peer `@nestjs/core@^9||^10`
  (toute la lignée 7.x–10.x) à un peer `@nestjs/core@^11.0.1` exact dès la
  10.x → 11.x (7.4.2 → 11.4.7), sans version intermédiaire qui couvre les
  deux — a dû être bumpé dans le même commit que le cœur plutôt que
  laissé pour plus tard. `@nestjs/axios` (3.1.3 → 4.0.1) pareil : son
  peer sur `@nestjs/common` plafonnait à `^10`, ne couvrait pas `^11`.
- Bonus repéré en bootant l'app (pas visible via build/lint/test) :
  Mongoose 9 a fait remonter 4 warnings « Duplicate schema index » au
  démarrage (`Category`/`City`/`Country.id`, `User.idpId`) — chaque champ
  avait à la fois `unique: true` sur son `@Prop` (qui crée déjà l'index)
  et un appel `XSchema.index({id: 1}, {unique: true})` redondant en bas
  du fichier. Les 4 appels `.index()` en trop supprimés ; confirmé plus
  aucun warning au boot suivant.
- Vérifié : `nx build/test/lint` sur `api`/`api-domain`/`api-adapters`/
  `dtos` revenus à la baseline (24 problèmes/0 erreur, 20/20 tests) après
  les deux commits. Boot réel contre MongoDB local confirmé à chaque
  étape : `/api/health` (mongo+auth0 up), Swagger UI + son doc OpenAPI
  JSON (toujours 3.0.0, 21 routes, pas de régression malgré le saut
  7→11), `/api/publications` (avec `keyword`/`minPrice`/`maxPrice` et une
  clé de query bidon pour vérifier `strictQuery`), `/api/categories`,
  `/api/countries`. Express v5 (nouveau défaut de `platform-express` 11)
  et l'API legacy des health indicators retirée n'avaient aucun code à
  toucher, comme prévu par la recherche ci-dessus — confirmé plutôt que
  supposé via le boot réel.

**Palier 11→12** — cible `~12.x` dernier patch. Le changement le plus
spécifique à l'architecture de ce repo :
- **Les paramètres de constructeur optionnels ne sont plus hérités par
  une sous-classe qui définit son propre constructeur** (Nest lit les
  marqueurs "optionnel" via `Reflect.getOwnMetadata`, qui ne remonte pas
  la chaîne de prototypes comme `getMetadata`) — une sous-classe sans
  constructeur propre garde les paramètres du parent mais perd leur statut
  "optionnel". **C'est directement pertinent ici** : `CLAUDE.md` documente
  que chaque `apps/api/src/app/infrastructure/<feature>/*.service.ts`
  **étend** le service domaine correspondant
  (`libs/api/domain/src/lib/<feature>/*.service.ts`) pour injecter le
  repository Nest — exactement le pattern visé par ce changement. **À
  vérifier fichier par fichier à ce palier** : est-ce qu'un des services
  domaine a un paramètre de constructeur `@Optional()` ou marqué optionnel
  (`param?: Type`) que la sous-classe infrastructure ne redéclare pas
  explicitement ? Si oui, ce paramètre perdra son statut optionnel et Nest
  pourrait lever une erreur de résolution DI au démarrage. C'est le
  changement le plus risqué de toute l'échelle 9→12 pour ce codebase
  précis.
- Node.js ≥ 20.19 ou ≥ 22.12 requis (relevé par rapport à la v11).
- Les paquets `@nestjs/*` deviennent ESM-first (mais les apps CommonJS
  continuent de fonctionner sans migration forcée, confirmé par la
  release note officielle) — pas de changement de code requis a priori,
  mais **`@nestjs/swagger` en particulier est passé pur-ESM dans ses
  dernières versions majeures** (imports profonds dans les internals du
  paquet ne résolvent plus, les anciens shims `plugin.js`/`plugin.ts`
  disparaissent) — `main.ts` de ce repo n'utilise que l'API publique
  (`SwaggerModule`, `DocumentBuilder`, `SwaggerCustomOptions`), donc a
  priori pas concerné, mais à valider par un build réel à ce palier
  plutôt que supposé sûr sur la seule lecture du code.
- `nest upgrade` (CLI officielle) fait la partie mécanique automatiquement
  pour tous les paquets `@nestjs/*` en une fois si l'équipe préfère un
  saut groupé à la fin plutôt que palier par palier — mentionné dans la
  doc officielle mais **pas testé ici**, à évaluer comme raccourci
  possible pour les paliers 2-3 une fois le palier 1 (le plus susceptible
  de révéler des problèmes an amont) passé manuellement.

**`@nestjs/swagger` 5→12 séparément** (ne suit pas le même rythme de
version que le cœur Nest, donc à vérifier par palier avec son propre
`npm view @nestjs/swagger dist-tags` plutôt que supposé aligné) :
- Alignement sur OpenAPI 3.1 (v7+) — change potentiellement la façon dont
  certains types de schéma nullable/enum sont émis dans le document
  généré ; à vérifier visuellement sur `/api` (Swagger UI) après ce
  palier plutôt que par lecture de code seule.
- `swaggerUiEnabled` retiré des options — **non utilisé ici** (`main.ts`
  ne passe que `swaggerOptions.persistAuthorization` et
  `customSiteTitle`), donc sans impact.
- ESM pur dans les toutes dernières versions (voir point ESM ci-dessus).

**`mongoose` (driver) 6→9** — trois points concrets trouvés dans le code
actuel :
- `updateOne()` dans `ads-repository-nest.ts` passe encore
  `useFindAndModify: false` à `findOneAndUpdate()` — **déjà mort depuis
  Mongoose 6** (confirmé : Mongoose 6+ se comporte toujours comme si
  l'option valait `false`, elle est silencieusement ignorée). Pas une
  nouvelle rupture à ce chantier, mais un nettoyage gratuit à faire au
  passage (supprimer la ligne).
- Le type `AdDocument = Ad & mongoose.Document` (et son équivalent dans
  les 4 autres schémas `category`/`city`/`country`/`user`) est le pattern
  pré-Mongoose-7 ; la doc officielle recommande désormais
  `HydratedDocument<Ad>` — la signature générique de `HydratedDocument`
  lui-même a changé entre Mongoose 6 et 7 (`<DocType,
  TMethodsAndOverrides, TVirtuals>` → `<DocType, TOverrides,
  TQueryHelpers>`), donc migrer les 5 schémas est à faire ensemble, pas
  fichier par fichier isolément, pour rester cohérent.
- `filterToUse: any` dans `findAll()` (déjà signalé comme dette dans
  `CLAUDE.md`/le TODO du fichier) — sans lien direct avec la montée de
  version, mais un bon moment pour le typer si ce fichier est de toute
  façon touché par la migration `HydratedDocument`.

**Structure suggérée** : un commit par majeure Nest (9→10, 10→11, 11→12),
plus un commit séparé pour le driver Mongoose (peut se faire en parallèle
du palier 11→12 vu qu'ils ne sont pas couplés), `nx build api`/`nx test
api`/`nx lint api` (+ `api-domain`/`api-adapters` vu que `CHANTIER-EN-
COURS.md` note que ces libs n'étaient pas suivies systématiquement)
vérifiés à chaque étape.

## Autres points déjà documentés dans `CHANTIER-EN-COURS.md`, toujours valables

- Avertissement de dépréciation `@angular-devkit/build-angular` (Angular
  pousse vers `@angular/build`, esbuild/Vite) — à surveiller, pas un
  blocage actuel.
- `nx build api`/`nx test api`/lint des libs `api-domain`/`api-adapters`/
  `dtos` pas suivis systématiquement à chaque palier futur — à intégrer
  dans la routine de vérification.
