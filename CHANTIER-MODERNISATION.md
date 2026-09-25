# Chantier de modernisation — Plan Tech Lead SOLID / Clean Architecture (2026-09-24)

> **À lire avant tout le reste** : ce document a été (ré)écrit par une session
> Tech Lead dont le mandat portait sur l'architecture (SOLID, hexagonale,
> couverture de tests, dette front/back) — périmètre `apps/api`, `apps/webapp`,
> `apps/admin`, `libs/dtos` (+ `libs/api/domain`/`libs/api/adapters` par
> transitivité). **Phase PLAN uniquement** : aucune ligne de code n'a été
> modifiée pour produire ce plan, seule cette exploration en lecture seule
> l'a nourrie. Le contenu antérieur de ce fichier (le suivi palier par palier
> de la montée de version NestJS 9→12) n'a pas été perdu : il est conservé
> intégralement en annexe en bas de ce document, sous
> « Annexe — chantier de version NestJS (document antérieur) ». Voir aussi
> `CHANTIER-EN-COURS.md`, distinct, qui documente la montée Angular 14→22
> (terminée, 8 paliers).
>
> **Mise à jour (2026-09-24, même jour) — v2 après revue senior
> indépendante.** Une session dev senior distincte a challengé ce plan
> avant toute exécution (`CHANTIER-MODERNISATION-REVIEW.md`, conservé tel
> quel à côté de ce fichier). Verdict : la quasi-totalité des affirmations
> factuelles vérifiées indépendamment (AdMapper, AdsController,
> ads.service.ts/transitionTo, AdsRepositoryNest,
> AdminPublicationController, store admin, absence de `@ngrx/*`,
> couverture de tests, CitiesModule, findAllByUserId) s'est révélée exacte,
> et le séquencement global est jugé sain — mais **exécutable sous
> réserves, pas en l'état**. Trois réserves bloquantes et un désaccord ont
> été soulevés ; les trois réserves sont intégrées ci-dessous phase par
> phase (angle mort e2e → nouvelle Phase 1bis ; charge/risque/critères
> d'acceptation/rollback → ajoutés à chaque phase ; statut conditionnel des
> sous-points 2.2/2.8 → gelés explicitement en Phase 2) et le désaccord sur
> la Phase 4 (remplacer vs. nettoyer le store admin) est tranché en
> acceptant l'argument du dev senior — voir **§8. Réponse du Tech Lead aux
> réserves de la revue senior**, en fin de section, pour le détail complet
> de ce qui a changé, ce sur quoi il y a accord, et ce qui reste ouvert
> pour arbitrage par l'utilisateur.
>
> **Mise à jour (2026-09-24, même jour) — chiffrage Phase 1bis exécuté,
> phase reportée.** Une session Tech Lead a exécuté le chiffrage exigé par
> la Phase 1bis (§4) avant d'écrire le moindre scénario Cypress, comme
> demandé. Verdict : sur les trois prérequis identifiés, deux sont
> vérifiés faisables dans cet environnement (MongoDB local, testé
> fonctionnel ; Cloudinary, vérifié contournable — l'upload d'image n'est
> pas obligatoire dans le flux `post-an-ad`), mais le troisième — un compte
> de test Auth0 fonctionnel de bout en bout — est bloquant, et bloque à lui
> seul les deux scénarios visés puisque les deux routes ciblées sont
> gardées par un login Auth0 réel. Détail complet, alternatives évaluées
> (dont un mock du SDK Auth0, explicitement écarté et pourquoi) et
> conséquence actée pour les phases 4/5 : voir Phase 1bis en §4 et la
> réponse à la question ouverte §7.10.
>
> **Constat clé qui change le cadrage du mandat reçu** : le mandat de départ
> (et `CLAUDE.md`, inchangé depuis) décrit un état — Angular 14, NestJS 9,
> Nx 15, `AdsService` avec des FIXME actifs de state machine cassée — qui
> **ne correspond plus au code réel**. Une exploration du code (pas de la
> documentation) montre que l'essentiel du travail de version a déjà été
> fait par des sessions antérieures, et que le bug de state machine le plus
> grave documenté dans `CLAUDE.md` **est déjà corrigé et testé**. Ce plan
> part donc de l'état réel du code, pas de `CLAUDE.md`, et sa première
> recommandation concrète est de corriger `CLAUDE.md`.

## 0. Contexte

Le mandat reçu demandait de : évaluer l'avancement de l'architecture
hexagonale, les violations SOLID, l'état des front-ends Angular, la
couverture de tests (notamment sur `AdsService`), définir des versions
cibles, produire une roadmap phasée avec tests de caractérisation, poser
une règle de gouvernance sur la modification des tests existants,
identifier risques et dépendances, et lister hypothèses/questions ouvertes.

`CLAUDE.md` (racine du repo, inchangé sur cette branche) documente un état
antérieur : Angular 14, NestJS 9, Nx 15, et un bloc entier ("Ad lifecycle")
décrivant `AdsService.submit/publish/reject/archive` comme non fiables
(FIXME actifs, garde manquante). C'est le texte qui a servi de brief à ce
chantier. **Il est obsolète** — voir §1.

## 1. État des lieux réel (vérifié par lecture du code, pas de la doc)

### 1.1 Versions actuellement installées (`package.json`, cette branche)

| Composant | Version installée | Statut vs. dernière connue |
|---|---|---|
| Angular (core/cdk/material/cli/...) | `~22.1.7` / `22.1.7` | **Déjà à la cible** — migration 14→22 terminée (8 paliers, voir `CHANTIER-EN-COURS.md`), commitée sur `main`. |
| NestJS (`@nestjs/core`/`common`/`platform-express`) | `~11.2.6` | Un majeur derrière le dernier tag npm (12.x). Palier 11→12 **tenté et annulé** (voir annexe) — bloqué par un incompatibilité Jest/ESM, pas par le risque métier anticipé. |
| Nx | `22.7.12` | Suit son propre cycle, à jour pour cette branche. |
| TypeScript | `~6.0.3` | Déjà avancé. |
| RxJS | `~7.8.2` | Stable, aligné front/back. |
| Mongoose (driver) | `^9.10.2` | Déjà migré au palier 10→11 (types `HydratedDocument`, `strictQuery` explicite, `returnDocument: 'after'`). |
| Jest / ts-jest | `30.5.2` / `29.4.12` | À jour, mais **c'est cet outillage qui bloque NestJS 12** (voir §1.4). |

**Conclusion** : contrairement au cadrage initial du mandat, il n'y a
**pas de grand chantier de montée de version Angular à planifier** — il est
fait. Le travail réel restant sur les versions se limite à (a) faire
sauter le verrou Jest/ESM pour finir NestJS 11→12, et (b) la modernisation
*idiomatique* Angular (standalone/signals) que la version 22 rend possible
mais que rien n'a encore forcé à faire (voir §1.5).

### 1.2 `AdsService` / state machine `AdStatus` — le FIXME documenté est déjà corrigé

Lecture de `libs/api/domain/src/lib/ads/ads.service.ts` (état réel, pas la
doc) :

- `submit()`, `publish()`, `reject()`, `archive()` passent tous par un
  point de garde central, `transitionTo()` : la lecture qui précède chaque
  transition (`findOneDraft`/`findOneUnpublished`/`findOne`) est bien
  vérifiée — `if (!ad) throwError(() => new AdNotInExpectedStateError(...))`.
  Le bug documenté dans `CLAUDE.md` (« `{...null}` est `{}`, donc une garde
  manquante laisse quand même passer l'update ») **n'existe plus** : il n'y
  a plus de spread aveugle, `transitionTo` construit l'update champ par
  champ à partir de paramètres explicites.
- `reject()`/`archive()` utilisent délibérément `ANY_STATUS` (transition
  depuis n'importe quel état) — mais c'est documenté comme un choix
  assumé (un ad peut être rejeté/archivé quel que soit son état, seule son
  existence est requise), pas un oubli. Le commentaire au-dessus de
  `transitionTo` explique explicitement l'historique du bug et pourquoi le
  fix actuel s'en protège.
- Le TODO `publish()` **« Should be APPROVED before PUBLISHED »** a été
  résolu (2026-09-25, décision utilisateur actée en §7.2/Phase 6) :
  `AdStatus.APPROVED` n'était jamais assigné et aucun besoin produit ne
  justifiait de l'implémenter, donc la valeur a été retirée de l'enum
  plutôt qu'implémentée ; le TODO devenu sans objet a été retiré avec elle.
  `publish()` continue de transiter directement `SUBMITTED → PUBLISHED`,
  désormais sans commentaire suggérant une étape intermédiaire à venir.
- `ads.service.spec.ts` (327 lignes) couvre déjà : `create`/`createDraft`,
  `findAllPublished` (dépôt du pseudo-filtre `top`), `findAllUnpublished`,
  `countUnpublished`/`countPublished`, **les 4 gardes de transition** (un
  test dédié par transition vérifiant qu'une lecture `null` lève
  `AdNotInExpectedStateError` et n'appelle jamais `updateOne`), `submit`,
  `publish` (+ `moderatedBy`, `publishedAt`), `reject`/`archive` (+
  `moderatedBy`), `findAllArchived`/`countArchived`. C'est une couverture
  de state machine sérieuse, pas un trou.
- Trous réels, mineurs : `findAll()`, `findOne()`, `findOnePublished()`,
  `findOneUnpublished()`, `findAllByOwner()` n'ont pas de test dédié (ce
  sont des délégations triviales au repository, risque faible, mais à
  couvrir avant tout refactor pour rester complet en caractérisation).

**Recommandation** : `CLAUDE.md` doit être corrigé sur ce point en même
temps que sur les versions (§4, phase 0) — le laisser en l'état continue
d'induire en erreur toute session future (humaine ou agent) qui s'y fie
sans vérifier le code, exactement comme le cadrage initial de ce chantier
l'a fait.

### 1.3 Violations SOLID / Clean Architecture identifiées dans le code réel

**Côté API (`apps/api`, `libs/api/domain`, `libs/api/adapters`)** :

1. **`AdsRepositoryNest` (`apps/api/.../ads-repository-nest.ts`) — SRP/OCP,
   confirmé comme le repository le plus chargé** : `findAll`/`count`
   dupliquent l'appel à deux méthodes privées `manageKeyword`/`managePrice`
   qui manipulent un `filterToUse: any` non typé — exactement le TODO déjà
   posé dans le fichier (« extract into builder class »). Chaque nouveau
   critère de filtre (aujourd'hui `keyword`, `minPrice`/`maxPrice`) oblige à
   modifier cette classe au lieu d'étendre un objet dédié — violation OCP
   directe. Une classe `AdsMongoFilterBuilder` séparée (testable seule,
   sans mocker tout le repository) réglerait ça.
2. **`findAllByUserId()` — ISP/LSP violé, méthode morte et cassée** :
   déclarée dans l'interface `AdsRepository`, implémentée par
   `throw new Error('Method not implemented.')` dans `AdsRepositoryNest`, et
   **jamais appelée** (la fonctionnalité équivalente passe par
   `findAllByOwner`/`findAll({owner})` côté service). Tout code qui
   dépendrait de cette interface pour l'appeler planterait — c'est un
   contrat non honoré. À supprimer de l'interface (et du domaine) plutôt
   qu'à corriger, sauf si un besoin réel la justifie.
   **RÉPONDU en §7.4 (2026-09-25)** : sur instruction explicite de
   l'utilisateur, implémentée plutôt que supprimée (commit `4032458`) —
   requête Mongo directe par `owner`, hypothèse documentée dans la méthode
   faute d'intention d'origine récupérable.
3. **`AdsController` — SRP, trop de responsabilités dans un contrôleur** :
   au-delà du routage, il contient de la logique métier (`shuffle()` +
   `fakeMostRecentAds()` — un TODO dans le fichier dit lui-même « Move this
   fake logic to service instead »), une vérification d'autorisation
   inline dans `publishAd()` (propriétaire OU permission
   `manage:publications`), et une résolution manuelle d'utilisateur
   (`getUser()`) répétée dans plusieurs endpoints. **Correction apportée
   par la revue senior, acceptée** : la vérification d'autorisation inline
   n'est pas une simple duplication de ce que `PermissionsGuard` fait déjà
   pour l'admin — c'est une politique "owner-or-permission" qu'un guard
   déclaratif seul ne peut pas exprimer, faute d'accès à la ressource
   chargée (il faut comparer l'appelant au propriétaire de l'annonce, pas
   seulement lire une permission du token). L'extraction reste justifiée
   (service applicatif ou policy dédiée), mais c'est la conception d'une
   vraie policy de comparaison à une ressource, pas un simple
   déplacement de code — voir la Phase 2.3 révisée (§4) qui scinde ce point
   en deux sous-points de risque différent.
4. **Filtres non typés côté controller** : `getAll(@Query() filter: any)`
   et `getMyPublications(..., @Query() filter: any)` — deux `// TODO type
   it !` explicites dans le fichier. Rien n'empêche un paramètre de requête
   arbitraire d'atteindre `AdsRepositoryNest.findAll` puis Mongo (protégé
   aujourd'hui uniquement par `strictQuery: true` posé au niveau global
   Mongoose, pas par un DTO de requête validé) — un DTO `AdSearchQueryDTO`
   avec `class-validator` fermerait ce trou en plus de régler le typage.
5. **`AdMapper` (`libs/api/adapters`) — fuite de dépendance Nest dans une
   lib censée être un simple mapper** : `modelToDTO` importe
   `NotFoundException` de `@nestjs/common` et la lève directement si le
   modèle est `null`. Un mapper qui lève une exception HTTP mélange
   transformation de données et gestion d'erreur applicative, et couple
   `libs/api/adapters` à Nest alors que rien dans `CLAUDE.md`/la structure
   ne l'exige (contrairement à `libs/api/domain`, qui est explicitement
   framework-free). Ce `null` devrait être un cas géré par l'appelant
   (controller ou service), pas par le mapper.
6. **Duplication de la logique de pagination** : `AdminPublicationController`
   répète le même calcul (`parsePagination`, appelé 3 fois avec la même
   forme `forkJoin([liste, count]) → {items, total, page, pageSize}`) dans
   `getAllUnpublished`/`getAllPublished`/`getAllArchived`. Un décorateur de
   paramètre ou un petit service `PaginationQueryResolver` partagé
   éliminerait la triplication sans changer le comportement (bon candidat à
   un test de caractérisation avant refactor, voir §5).
7. **Domaine globalement propre sur le DIP** : bon point à noter —
   `CategoriesService`/`CitiesService`/`CountriesService`/`UsersService`/
   `AdsService` dépendent tous d'une **interface** de repository injectée
   par constructeur, jamais d'une implémentation concrète — le
   découplage domaine/infrastructure annoncé par `CLAUDE.md` est
   réellement respecté ici, contrairement à ce qu'on pourrait craindre vu
   l'état du reste. Seul `cities.service.ts` porte un commentaire `// TODO
   Create interface / abstract Repository to factories code` **obsolète** —
   l'interface `CitiesRepository` existe déjà, le commentaire n'a pas été
   retiré après coup.
8. **`api.module.ts` : `CitiesModule` enregistré côté infrastructure, aucun
   contrôleur `cities` côté API** — `CitiesModule` fait partie de
   `DOMAIN_MODULES` et est exporté par `InfrastructureModule`, mais aucun
   `CitiesController` n'existe dans `apps/api/src/app/api/`. Soit une
   fonctionnalité inachevée (les villes sont-elles censées être exposées
   directement, ou seulement consommées en interne par un autre domaine ?),
   soit du code mort à documenter/retirer. À clarifier (voir §6).
   **RÉPONDU en §7.3 (2026-09-25)** : `CitiesModule`/`CitiesService` sont
   consommés en interne par `CountriesController`
   (`GET /countries/:iso2/cities`), lui-même appelé côté `webapp` — ni
   fonctionnalité inachevée, ni code mort ; un `CitiesController` séparé
   n'a jamais été nécessaire.

**Côté front-ends** :

8. **`admin` n'utilise pas NgRx malgré ce que documente `CLAUDE.md`** —
   constat vérifié factuellement : **`@ngrx/*` n'apparaît nulle part dans
   `package.json`**. `apps/admin/src/app/store/publications/` est une
   réimplémentation maison du vocabulaire NgRx (`PublicationsStore` avec des
   `Subject`/`BehaviorSubject` privés, un `dispatch()` fait main, un
   `ofType()` réécrit dans `store/utils.ts`, des actions typées `{type:
   string, payload}` sans discrimination de type). Ce n'est pas
   nécessairement un problème fonctionnel (les tests passent, le
   comportement documenté — ex. le `catchError` posé *à l'intérieur* de
   chaque `switchMap` pour ne pas tuer l'abonnement global — montre une
   vraie maîtrise RxJS) mais c'est une réinvention non testée par un
   écosystème tiers : pas de DevTools, pas de sélecteurs mémoïsés, pas de
   typage d'action strict, `console.log('Dispatch ...')`/`console.log('Init
   effects')` oubliés en dur dans le code de prod. `PublicationsStore`
   couple aussi son propre câblage d'effets dans son constructeur
   (`this.effects.start(this)`, en s'auto-passant à l'instance d'effets) —
   couplage bidirectionnel concret plutôt qu'une composition déclarative.
9. **Aucun composant `standalone: true` sur les deux apps** — vérifié :
   `grep "standalone: true"` → 0 résultat, `grep "standalone: false"` → 49
   résultats. Angular 22 est installé mais son modèle de composants par
   défaut n'est pas utilisé ; `@angular-eslint/prefer-standalone` est
   explicitly désactivée dans les deux `eslint.config.mjs` depuis le
   palier 19 de la montée de version. C'est noté et assumé dans
   `CHANTIER-EN-COURS.md`/l'annexe ci-dessous comme « le morceau le plus
   risqué », volontairement reporté à un chantier séparé — **ce chantier
   ici**.
10. **Couverture de tests front quasi nulle sur `shared/services`** :
    `apps/webapp/src/app/shared/services/*.ts` (8 fichiers : `ads`,
    `categories`, `contact`, `countries`, `my-device`, `qualities`,
    `search`, `user-settings`) — **aucun n'a de `.spec.ts`**. Ce sont les
    services qui centralisent tous les appels HTTP vers l'API ; un
    changement de DTO ou de endpoint ne serait détecté par aucun test ici.

### 1.3bis — Corrections de la revue senior sur l'exécution de la Phase 1 (2026-09-24)

Une session dev senior indépendante a relu l'exécution de la Phase 1
(`CHANTIER-MODERNISATION-REVIEW-PHASE1.md`, verdict « validé avec
réserves », aucune réserve bloquante). Trois points nécessitent une
correction avant le démarrage de la Phase 2 :

a. **Le test de caractérisation de l'absence de guard sur `GET
   /users/:id` ne testait rien** — `apps/api/src/app/api/users.controller.spec.ts:180-194`
   appelait `controller.findOne(...)` directement, ce qui contourne
   systématiquement le pipeline de guards Nest (guard présent ou non, le
   test restait vert). **Corrigé** (commit `efc3e09`) : le test inspecte
   désormais `Reflect.getMetadata(GUARDS_METADATA,
   UsersController.prototype.findOne)` et attend `undefined`, avec un
   test de contrôle croisé sur `getProfile` (qui porte bien
   `@UseGuards(JwtAuthGuard)`) pour prouver que la technique distingue
   réellement un handler gardé d'un handler non gardé — vérifié
   manuellement en ajoutant temporairement le guard sur `findOne` : le
   nouveau test échoue bien, contrairement à l'ancien. **Modification
   d'un test existant : non acquise tant que `qa-reviewer` n'a pas donné
   son feu vert** (règle de gouvernance, §5).
b. **`UsersService.update`/paramètre `username` (commit `d44f937`) —
   reformulation** : la caractérisation initiale disait « incohérence de
   nommage, comportement runtime correct ». C'est trompeur. Vérification
   par grep : `UsersService.update()` n'a **aucun appelant en
   production** (le seul endpoint de mise à jour de profil,
   `UsersController.updateProfile`, appelle `updateOneByIdpId`, une
   méthode distincte correctement nommée). Si `update(idpId, ...)` était
   réellement appelée avec un `idpId` Auth0 (`auth0|xxxxx`), la requête
   Mongo construite par `UsersRepositoryNest.updateOne` —
   `findOneAndUpdate({ username }, ...)` — ne matcherait **jamais aucun
   document réel** (le champ stocké `username` n'a pas ce format). C'est
   donc du **code mort portant un bug latent**, pas une méthode active au
   comportement runtime correct malgré son nommage. Priorité Phase 2 :
   nettoyage SOLID à faible risque (renommer le paramètre pour matcher
   l'usage réel, ou supprimer la méthode après un grep de re-vérification
   juste avant ce commit) — pas un correctif urgent, précisément parce
   qu'aucun utilisateur réel n'est exposé aujourd'hui.
c. **Phase 2 sous-point 5 (sortir `NotFoundException` des mappers) —
   reclassifié** : classé initialement « sans changement de comportement
   observable » (renommage/extraction pure). C'est inexact — un appelant
   qui compte aujourd'hui sur cette exception levée automatiquement
   (`AdsController`, `UsersController.getProfile`/`findOne`) verrait un
   DTO malformé au lieu d'un 404 propre si le mapper cesse de lever sans
   que l'appelant ne rattrape le cas `null`/`undefined` explicitement.
   Reclassifié au même niveau de risque que le sous-point 4 (commit
   séparé, nouveaux tests du nouveau comportement de rejet explicite côté
   appelant, pas seulement les tests hérités de la Phase 1) — voir §4,
   Phase 2, sous-point 5 révisé. Au passage, ce sous-point couvre en
   réalité **`AdMapper` et `UserMapper`**, pas seulement `AdMapper` comme
   la formulation initiale le laissait entendre (voir §1.3 point 5 et
   commit `88d960b`, qui documente aussi `BadRequestException` dans
   `UserMapper.dtoToModel`).

### 1.4 Le vrai blocage NestJS 11→12

Déjà investigué et documenté en détail dans l'historique (voir annexe) :
`@nestjs/*` 12.x est **pur ESM** (`"type": "module"`, pas de condition
`require`), ce qui casse `nx test api` sous la configuration Jest/ts-jest
actuelle (CommonJS). `nx build api` (webpack) n'est pas affecté. Le vrai
risque anticipé au départ (paramètre de constructeur optionnel non hérité
entre service domaine et sa sous-classe infrastructure) a été vérifié
**inapplicable** à ce code (tous les constructeurs de service domaine
n'ont qu'un seul paramètre obligatoire).

**Mise à jour (2026-09-24) — spike Phase 0bis exécuté, reporté, voir §4
Phase 0bis pour le détail complet.** Les deux voies (a) `babel-jest` scopé
et (b) mode ESM natif Jest ont été testées empiriquement (pas seulement
raisonnées sur documentation) contre de vrais packages `@nestjs/*` 12.1.0
téléchargés et posés en overlay local. Aucune des deux ne converge dans le
budget du spike — chacune bute sur un blocage structurel distinct,
au-delà d'un simple problème de configuration :
- (a) `babel-jest` transpile avec succès `@nestjs/common/index.js` et sa
  chaîne `pipes/index.js`, mais échoue sur
  `utils/load-package.util.js` : ce fichier utilise `import.meta.url`
  (utilisé par `createRequire(import.meta.url)`), une construction que
  `@babel/plugin-transform-modules-commonjs` ne sait pas traduire en
  CommonJS sans un plugin dédié absent de la stack actuelle — et même
  avec un tel plugin, il faudrait un shim par fichier pour que
  `import.meta.url` résolve au bon chemin réel sous l'enveloppe de module
  de Jest. Ce fichier est chargé de façon non paresseuse par
  `ValidationPipe`/`ParseArrayPipe`, donc inévitable dès qu'on importe
  `@nestjs/common`.
- (b) Le mode ESM natif de Jest (`extensionsToTreatAsEsm`, `ts-jest`
  `useESM: true`, `NODE_OPTIONS=--experimental-vm-modules`) charge bien
  `@nestjs/common` comme un vrai module ES (l'erreur "Must use import"
  disparaît), mais échoue ensuite au niveau du linker de modules :
  `SyntaxError: The requested module '@nestjs/common' does not provide an
  export named 'Injectable'` — un chaînage `export * from` profond
  (`index.js` → `pipes/index.js` → ... ) que le support expérimental
  `--experimental-vm-modules` de Jest ne relie pas de façon fiable,
  combiné à l'avertissement `ts-jest` sur `esModuleInterop`. Confirme
  empiriquement ce que l'annexe anticipait déjà ("non trivial avec
  ts-jest+Nx, caveats documentés côté Jest lui-même").

**Piste nouvelle, non explorée avant ce spike** : le message d'erreur de
Jest lui-même mentionne une troisième option — "Use Node v24.9+ where
Jest supports require(esm) natively". Le Node installé ici est `v22.23.2`.
Une montée de Node vers ≥ 24.9 ferait disparaître le problème à la racine
(Jest déléguerait le chargement ESM au `require()` natif de Node), mais
c'est un changement d'infrastructure (runtime Node du poste de dev, de la
CI et du déploiement PM2/EC2 — voir `ecosystem.config.js`), pas un simple
changement de config Jest — hors périmètre de ce spike, mais le candidat
le plus prometteur pour une prochaine tentative.

**Découverte annexe pendant le spike, à noter pour un futur palier 11→12**
(indépendante du résultat Jest/ESM, donc valable même si un futur spike
lève le verrou ci-dessus) : `@nestjs/platform-express@12.1.0` épingle
`express` en version exacte `5.2.1` — un majeur d'Express, qui entraîne
lui-même `body-parser@2`, `router@2`, `send@1`, `serve-static@2`,
`finalhandler@2`, `accepts@2`, `type-is@2`, `mime-types@3`, `cookie@0.7`
(constaté en inspectant les `package.json` réels des tarballs 12.x, pas
supposé). Express 5 a des changements de comportement runtime documentés
(syntaxe des wildcards de route, parsing des query strings par défaut) —
ce n'est **plus seulement un problème d'outillage Jest**, c'est une
migration Express à part entière avec un risque produit sur le routage
réel, à traiter comme son propre sous-point de phase (avec tests de
caractérisation sur `AdsController`/`AdsRepositoryNest` et leurs query
params) le jour où le palier NestJS 11→12 est repris — pas dans le même
commit que le fix Jest.

**Mise à jour (2026-09-25) — piste Node ≥24.9 testée empiriquement,
verrou Jest/ESM levé.** L'utilisateur a installé Node `v24.21.0` via `nvm`
spécifiquement pour tester la piste identifiée le 2026-09-24 (jamais
essayée jusqu'ici). Détail complet en §4 Phase 0bis (reprise). Résumé du
résultat, en trois points :

1. **`nx test api` passe intégralement sous NestJS 12.1.0 + Node 24.21.0**
   — mêmes 21 suites / 130 tests qu'en baseline NestJS 11.x, **sans
   toucher `apps/api/jest.config.ts` ni `tsconfig.spec.json`**. C'est mieux
   que ce que le spike du 24 anticipait (qui supposait qu'une montée de
   Node suffirait seule, mais s'attendait à devoir aussi retenter une
   configuration ESM/babel spécifique).
2. **Nuance non documentée par le message d'erreur Jest lui-même** : "Node
   v24.9+" est nécessaire mais **pas suffisant**. Le gate exact dans
   `jest-runtime` (`node_modules/jest-runtime/build/index.js`,
   `supportsSyncEvaluate`) teste `vm.SourceTextModule.prototype.hasAsyncGraph`
   — et `vm.SourceTextModule` reste derrière le flag expérimental Node
   `--experimental-vm-modules` **même en Node 24.21** (vérifié
   empiriquement : `typeof require('vm').SourceTextModule` vaut
   `undefined` sans le flag, `'function'` avec). Il faut donc **les deux**:
   Node ≥ 24.9 *et* `NODE_OPTIONS=--experimental-vm-modules` au démarrage
   du processus qui exécute `nx`. Une fois les deux réunis, Jest 30 route
   le chargement ESM de `@nestjs/*` vers le `require(esm)` natif de Node,
   synchrone, sans passer par le linker `--experimental-vm-modules`
   "ancien style" (mode (b) du spike du 24, qui échouait sur le linking
   `export * from`) — c'est un mécanisme différent, ajouté dans Jest 30
   spécifiquement pour ce cas.
3. **Caveat opérationnel découvert en testant `nx run-many`, pas seulement
   `nx test api` seul** : `@nx/jest`'s executor appelle `jest.runCLI(...)`
   **in-process** (pas de `node jest ...` séparé par projet) —
   `apps/api/../../node_modules/@nx/jest/src/executors/jest/jest.impl.js`.
   `NODE_OPTIONS` ne peut être positionné qu'au démarrage d'un processus
   Node, donc en le passant en variable d'environnement pour toute
   l'invocation `nx run-many --target=test --all`, il fuit vers **tous**
   les processus que Nx forke pour les autres projets — cassant `webapp`
   et `admin` (`ReferenceError: module is not defined` en chargeant
   `@angular/core/fesm2022/core.mjs` via `jest-preset-angular`, un mode de
   panne différent des deux du spike précédent). Testé isolément (`nx test
   api` seul avec le flag, puis `nx run-many --target=test --all
   --exclude=api` sans le flag) : **les deux passent séparément avec les
   mêmes comptes qu'en baseline**, mais **aucune commande unique ne teste
   les 6 projets ensemble avec ce flag global** — il faudrait soit deux
   invocations distinctes (CI en deux étapes), soit une façon de scoper
   `NODE_OPTIONS` au seul target `api` (mécanisme Nx par-projet non
   exploré dans le budget de ce spike — candidat: `options.env` sur le
   target `test` d'`apps/api/project.json`, à vérifier si cette piste est
   reprise).
4. **`nx build api` (webpack) et `nx lint` (`api`, `api-domain`,
   `api-adapters`, `dtos`) restent verts** sous NestJS 12.1.0, sans erreur
   nouvelle (uniquement les mêmes warnings `no-explicit-any` préexistants).
5. **Express 5.2.1** (voir découverte annexe ci-dessus) reste **non
   qualifié** — non testé au runtime (pas de `.env`/MongoDB disponible
   dans ce spike), et les tests de caractérisation sur
   `AdsController`/`AdsRepositoryNest` demandés par le mandat pour ce
   sous-point n'ont **pas** été écrits dans cette session (hors budget du
   spike Jest/Node). Reste un vrai sous-point ouvert avant d'adopter la
   migration en confiance.
6. **Rien commité** : conformément au mandat ("succès complet et
   *validé*" — la validation `senior-dev` n'a pas encore eu lieu),
   `package.json`/`yarn.lock` ont été restaurés à l'identique
   (`git checkout --` puis `yarn install` sous Node 22 pour reconstituer
   `node_modules` NestJS 11.x) après avoir confirmé le résultat. Seule
   cette mise à jour de documentation est committée. État détaillé et
   méthode complète en §4 Phase 0bis.

### 1.5 Couverture de tests par domaine — synthèse

| Domaine / lib | Specs présentes | Trous principaux |
|---|---|---|
| `libs/api/domain` (ads) | `ads.service.spec.ts` (bon niveau, voir §1.2) | `findAll`/`findOne`/`findOnePublished`/`findOneUnpublished`/`findAllByOwner` non testés isolément |
| `libs/api/domain` (categories/cities/countries/users/moderators) | **0 spec** pour les 5 services domaine | Tout le comportement (dont le `top: true`/pseudo-filtre de `CategoriesService.findTop`) n'est vérifié qu'indirectement, s'il l'est |
| `libs/api/adapters` | **0 spec** (aucun fichier `*.spec.ts` dans toute la lib) | 5 mappers (`ad`, `category`, `city`, `country`, `user`) sans test — y compris le `NotFoundException` levé par `AdMapper.modelToDTO` sur `null`, un comportement qui mérite un test avant d'être déplacé (§1.3 point 5) |
| `libs/dtos` | **0 spec** | Pas de logique à tester a priori (types + décorateurs de validation), risque faible |
| `apps/api` controllers | `ads.controller.spec.ts` (racine `api/`), `admin-publication.controller.spec.ts` (sous `api/admin/`, pas la racine) | `categories.controller.ts`, `countries.controller.ts`, `users.controller.ts` (les 3 à la racine de `api/`) — **aucun test** |
| `apps/api` infrastructure services | 0 spec dédié (les services infra sont de fines extensions, couvertes indirectement par les tests de controller/domaine) | Acceptable en l'état vu leur taille (1 ligne de logique : `extends X { constructor(repo) { super(repo) } }`) |
| `apps/api` persistence | `ads-repository-nest.spec.ts` | `categories-repository-nest.ts`, `cities-repository-nest.ts`, `countries-repository-nest.ts`, `users-repository-nest.ts`, `moderator-identity-repository-nest.ts` — **aucun test** |
| `apps/api` auth | `moderator-identity.service.spec.ts`, `permissions.guard.spec.ts` | Bonne couverture pour la partie sécurité déjà auditée (issue #49) |
| `apps/webapp` | 30 fichiers `*.spec.ts` | Concentrés sur `shared/components/*` ; `shared/services/*` (8 fichiers, la couche d'accès API) intégralement non testée (§1.3 point 10) |
| `apps/admin` | 5 fichiers `*.spec.ts` | Pas de spec dédiée vue pour `PublicationsStore`/`PublicationsEffects` eux-mêmes (à confirmer précisément avant refactor, voir phase 3) |
| `apps/webapp-e2e`, `apps/admin-e2e` | **0 scénario réel** | **Angle mort ajouté après revue senior** : les deux projets ne contiennent que le placeholder généré par Nx (`cy.login('my-email@something.com', ...)`, `getGreeting().contains('Welcome admin')`), jamais adapté à l'application réelle. Il n'existe aujourd'hui **aucun test de bout en bout fonctionnel** sur le cycle de vie d'une annonce ni sur le flux de modération admin — voir Phase 1bis (§4) et §8. |

**Lecture d'ensemble** : la partie la plus fragile *historiquement*
(`AdsService`) est en fait la mieux couverte. Le vrai déficit de tests est
sur les domaines « ennuyeux » (categories/cities/countries/users) et sur
toute la couche mapping/adapters — c'est-à-dire exactement les endroits
où personne ne pense à regarder avant de les toucher, et donc les plus
susceptibles de régresser silencieusement une fois ce chantier commencé.

## 2. Versions cibles (état réel, pas la doc)

| Composant | Cible | Justification |
|---|---|---|
| Angular | **Rester sur `~22.1.7`** (déjà fait) | Migration achevée et vérifiée (build/lint/test verts aux 8 paliers). Rien à planifier ici — seulement de la modernisation *idiomatique* (§1.3 point 9), pas une montée de version. |
| NestJS | **`~12.x` dernier patch, conditionné à la levée du verrou Jest/ESM (§1.4)** | Rester sur 11.x indéfiniment n'est pas un drame (11.x est une version supportée), mais un majeur de retard qui grandit avec le temps augmente le coût du prochain palier. Recommandation : traiter la levée du verrou Jest comme un ticket d'outillage à part (phase 0bis, risque quasi nul **sur le code métier** — vérifié : aucun constructeur de service domaine n'a de paramètre optionnel non hérité — mais **pas un risque quasi nul en charge d'outillage**, correction acceptée après revue senior : une première tentative avec une solution plausible a déjà échoué, voir §1.4 et la Phase 0bis révisée en §4). |
| Mongoose (driver) | Rester sur `^9.10.2` (déjà fait) | Aligné sur le peer-range de `@nestjs/mongoose`. |
| TypeScript | Rester sur `~6.0.3` (déjà fait) | Aligné avec les peer-ranges Angular/Nest actuels. |
| Nx | Rester sur `22.7.12` (déjà fait) | Nx n'est qu'un facilitateur ici (mandat centré Angular/NestJS) — aucune raison de bouger indépendamment d'un besoin fonctionnel. |
| `@ngrx/store` + `@ngrx/effects` (ou `@ngrx/signals`) | **Nouvelle dépendance à introduire côté `admin`** | Remplace la réimplémentation maison (§1.3 point 8). `@ngrx/signals` (SignalStore) est le candidat le plus cohérent avec une cible Angular 22 + adoption progressive des signals côté composants — à confirmer en phase de spike (voir §4, phase 4). |

**Un point à trancher avec l'utilisateur avant d'aller plus loin** :
est-ce que « versions cibles » du mandat visait un chantier de montée de
version (qui n'a plus lieu d'être, il est fait) ou la confirmation que
l'état actuel est la bonne cible ? Ce document part du principe que c'est
la seconde lecture, mais c'est une hypothèse à valider (§7).

## 3. Principes directeurs SOLID / Clean Architecture pour ce chantier

1. **Aucun refactor sans test de caractérisation préalable.** Avant de
   toucher un fichier identifié en §1.3/§1.5, un test qui verrouille le
   comportement *actuel* (bugs et TODOs compris, sauf s'ils sont
   explicitement dans le scope du refactor) est écrit et vérifié vert
   d'abord.
2. **DIP déjà largement respecté côté domaine — le préserver, pas le
   réinventer.** Toute nouvelle méthode de service domaine continue de ne
   dépendre que d'interfaces de repository, jamais d'un import Nest ou
   Mongoose.
3. **SRP : un controller route, un service orchestre, un mapper mappe.**
   La logique métier trouvée dans `AdsController` (§1.3 points 3-4) migre
   vers la couche service/domaine ; les mappers (§1.3 point 5) redeviennent
   des fonctions pures sans effet de bord ni exception.
4. **OCP sur les filtres de recherche** : `AdsRepositoryNest` extrait sa
   construction de filtre Mongo dans une classe dédiée, ouverte à
   l'extension (nouveau critère = nouvelle méthode/composant) sans modifier
   le corps de `findAll`/`count`.
5. **ISP : une interface n'expose que ce qui est réellement utilisé et
   implémenté.** `findAllByUserId` (§1.3 point 2) est retirée de
   `AdsRepository` plutôt que « corrigée dans le vide ».
6. **Ne pas dupliquer un écosystème testé par une réimplémentation
   maison sans raison forte.** La bascule `admin` vers `@ngrx/store`/
   `@ngrx/signals` (§1.3 point 8) suit ce principe — le hand-rolled actuel
   fonctionne, mais chaque bug RxJS qu'il faut redécouvrir (le commentaire
   sur le placement de `catchError` en est la preuve) est un bug que la
   librairie a déjà résolu une fois pour toutes.
7. **Toute modification de comportement change de PR/commit par rapport à
   tout refactor structurel pur.** Un commit qui déplace du code (extraction
   de classe, renommage) ne doit rien changer au comportement observable ;
   un commit qui change un comportement (ex. typer un filtre de requête)
   est isolé et signalé comme tel dans son message.

## 4. Roadmap phasée

Chaque phase est livrable et testable indépendamment ; l'ordre reflète les
dépendances (une phase qui touche `libs/dtos` doit être terminée et publiée
avant qu'une phase front puisse s'appuyer dessus, par exemple).

### Phase 0 — Corriger la documentation obsolète (risque quasi nul, à faire en premier)

- **Objectif** : `CLAUDE.md` reflète l'état réel du code (Angular 22, Nx 22,
  NestJS 11, section "Ad lifecycle" mise à jour pour refléter que la garde
  de transition est en place). *Mise à jour 2026-09-25 : le TODO APPROVED,
  seul point encore ouvert à l'époque de cette phase, est résolu depuis —
  voir Phase 6 et §7.2.*
- **Fichiers touchés** : `CLAUDE.md` uniquement.
- **Principe appliqué** : aucun (documentation), mais condition
  préalable à la confiance dans tout le reste du chantier — un cadrage basé
  sur une doc fausse a déjà coûté le mauvais départ de ce document lui-même.
- **Tests** : aucun (pas de code). Revue humaine simple.
- **Charge estimée** : XS (moins d'une heure).
- **Risque** : nul — aucun fichier de production touché.
- **Critère d'acceptation** : diff limité à `CLAUDE.md` (et à ce fichier),
  relu par un humain, aucune section technique du `CLAUDE.md` révisé ne
  contredit un constat vérifié par le code en §1 ci-dessus.
- **Rollback** : revert du commit unique, sans aucun effet sur le code
  applicatif.

### Phase 0bis — Débloquer NestJS 11→12 (outillage, pas de code métier)

- **Objectif (reformulé après revue senior)** : **spike time-boxé** (une
  demi-journée) pour évaluer (a) `babel-jest` scopé à `@nestjs/*` vs. (b)
  migration du runner Jest d'`apps/api` en mode ESM natif. Ce n'est **pas**
  "refaire le bump déjà préparé" — une première tentative avec une
  solution plausible (transformIgnorePatterns) a déjà échoué (voir annexe).
  Si aucune des deux voies ne converge dans le budget du spike, la phase
  est documentée et reportée sans bloquer la suite du chantier, plutôt que
  de laisser filer le budget.
- **Fichiers touchés** : `apps/api/jest.config.ts` (+ éventuellement un
  preset Babel ajouté aux devDependencies), `package.json`. **Ne pas
  toucher `jest.preset.js` partagé** sauf nécessité avérée — si c'est
  nécessaire, le traiter comme un changement de risque supérieur (voir
  critère d'acceptation).
- **Principe appliqué** : aucun changement d'architecture — chantier
  d'infrastructure de test pur.
- **Tests** : la suite existante d'`apps/api` doit rester verte à
  l'identique après le bump (nombre exact de suites/tests **re-vérifié en
  tout début de phase**, pas supposé égal à un relevé antérieur) ; c'est le
  test de non-régression lui-même, pas besoin d'en ajouter.
- **Charge estimée** : spike time-boxé à une demi-journée pour la décision
  (a) vs (b) ; l'implémentation complète si une voie converge est
  volontairement non chiffrée avant la fin du spike — s'engager sur une
  durée avant d'avoir la réponse serait reproduire l'optimisme déjà
  sanctionné une fois par l'historique documenté en annexe.
- **Risque** : moyen. Si (a) échoue, (b) est plus lourd (migration ESM
  native de la config Jest) ; risque supplémentaire si le changement finit
  par toucher `jest.preset.js` partagé — régression silencieuse possible
  sur **d'autres** projets Nx que `api`.
- **Critère d'acceptation** : `nx test api` vert sur la totalité des suites
  existantes (compte re-vérifié en début de phase) **et** `nx run-many
  --target=test --all` reste vert sur tous les autres projets si
  `jest.preset.js` a été touché.
- **Rollback** : si `jest.preset.js` partagé a été modifié, le revert de ce
  fichier est la priorité absolue (impact cross-projet) ; sinon, revert
  simple du bump de version et de `apps/api/jest.config.ts`. Rester sur
  NestJS 11.x n'est pas bloquant fonctionnellement — le rollback n'a donc
  aucune urgence produit derrière lui.

**Résultat du spike (exécuté le 2026-09-24) : reporté, ni (a) ni (b) ne
convergent dans le budget.** Détail complet en §1.4 (mise à jour du même
jour). Résumé :

1. **Baseline re-vérifiée avant tout changement** (pas supposée égale à un
   relevé antérieur, comme demandé) : `NODE_PATH=<worktree>/node_modules
   npx nx run-many --target=test --all --skip-nx-cache` →
   `api-domain` 6 suites/41 tests, `api-adapters` 5/28, `api` 21/130,
   `webapp` 30/43, `admin` 5 suites/10 tests (9 passés + 1 skip), `dtos`
   aucun test. Tous verts.
2. **Overlay local créé pour tester réellement, pas seulement en théorie** :
   le symlink unique `node_modules/@nestjs → /home/tanos/bella/node_modules/@nestjs`
   a été temporairement éclaté en symlinks par sous-paquet (même technique
   que l'overlay `class-validator` du sous-point 4 de la Phase 2), avec
   `@nestjs/common@12.1.0` et `@nestjs/core@12.1.0` posés en overlay réel
   (tarballs téléchargés depuis le registre npm public, jamais installés
   ni écrits dans l'arbre partagé `/home/tanos/bella`). Un fichier de test
   jetable (`apps/api/src/__nest12_spike__.spec.ts`, jamais commité)
   important `Injectable`/`Module` de `@nestjs/common` et `NestFactory` de
   `@nestjs/core` a servi de reproduction minimale.
3. **(a) `babel-jest` scopé à `@nestjs/*`** — implémenté dans
   `apps/api/jest.config.ts` (transform différencié ts-jest/babel-jest par
   regex + `transformIgnorePatterns` élargi). Résultat : dépasse le point
   d'échec de la tentative précédente (`transformIgnorePatterns` seul,
   voir annexe) — `@nestjs/common/index.js` et sa chaîne `pipes/index.js`
   se transpilent et se chargent. Bute ensuite sur
   `utils/load-package.util.js`, qui utilise `import.meta.url` (via
   `createRequire(import.meta.url)`) — construction qu'
   `@babel/plugin-transform-modules-commonjs` ne convertit pas en
   CommonJS sans plugin dédié (absent de la stack, aucun candidat mûr
   trouvé en local). Ce fichier est chargé de façon non paresseuse dès
   qu'on importe `@nestjs/common` (via `ValidationPipe`/`ParseArrayPipe`),
   donc pas contournable en évitant simplement ce module précis.
4. **(b) Jest en mode ESM natif** — `extensionsToTreatAsEsm`, `ts-jest`
   `useESM: true`, `tsconfig.spec.json` en `module: esnext`,
   `NODE_OPTIONS=--experimental-vm-modules`. Résultat : passe l'erreur
   "Must use import" (le loader ESM expérimental de Jest prend bien en
   charge `@nestjs/common` comme un vrai module ES), mais échoue au
   linking : `SyntaxError: The requested module '@nestjs/common' does not
   provide an export named 'Injectable'` — la chaîne profonde d'`export *
   from` (`index.js` → `pipes/index.js` → ...) n'est pas résolue de façon
   fiable par le support `--experimental-vm-modules`, cohérent avec la
   mise en garde déjà notée en annexe ("non trivial avec ts-jest+Nx").
5. **Piste non prévue au départ, trouvée dans le message d'erreur Jest
   lui-même** : "Use Node v24.9+ where Jest supports require(esm)
   natively." Node installé ici : `v22.23.2`. Une montée de Node
   éliminerait le problème à la racine, mais c'est un changement
   d'infrastructure (poste de dev, CI, PM2/EC2 — `ecosystem.config.js`),
   hors périmètre outillage-Jest de cette phase — **candidat le plus
   prometteur pour une prochaine tentative**, à cadrer comme sa propre
   phase 0ter si l'utilisateur veut la reprendre.
6. **Découverte annexe** : `@nestjs/platform-express@12.1.0` épingle
   Express en version exacte `5.2.1` (majeur, avec toute sa sous-chaîne
   `body-parser@2`/`router@2`/`send@1`/etc.) — un risque produit sur le
   routage réel, séparé du problème Jest, à traiter dans son propre
   sous-point le jour où ce palier est repris (voir §1.4).
7. **Nettoyage effectué** : fichier de test jetable supprimé,
   `apps/api/jest.config.ts` et `apps/api/tsconfig.spec.json` restaurés à
   l'identique (`git checkout --`), overlay `node_modules/@nestjs` remis
   à son symlink unique d'origine. `NODE_PATH=<worktree>/node_modules npx
   nx run-many --target=test --all --skip-nx-cache` reconfirmé vert avec
   les mêmes chiffres qu'au point 1 (aucune régression introduite par le
   spike). `git status` propre avant et après — **aucun commit de code
   n'a résulté de cette phase**, conformément au point 4 du mandat du
   spike (ne pas forcer si aucune voie ne converge).
8. **Décision** : Phase 0bis reportée. Rester sur NestJS 11.x n'est pas
   bloquant fonctionnellement (critère de rollback déjà posé ci-dessus) —
   ce n'est donc pas un échec du chantier. Prochaine étape si reprise :
   évaluer la piste Node ≥ 24.9 (point 5) comme nouvelle option a, avant
   de retenter (a)/(b) telles quelles.

**Reprise du spike (2026-09-25) — piste Node ≥24.9, succès technique,
en attente de revue `senior-dev` avant adoption.** L'utilisateur a
installé Node `v24.21.0` via `nvm` (`~/.nvm/versions/node/v24.21.0`),
**sans le rendre par défaut** (`~/.nvm/alias/default` reste `22`,
`package.json` `engines` reste `>=22 <23` — non touchés, conformément au
mandat) spécifiquement pour tester cette piste. Méthode et résultat,
dans l'ordre exécuté :

1. **Sanity check Node 24 seul, NestJS 11.x inchangé** (`npx nx run-many
   --target={build,lint,test} --all` sous `nvm use 24.21.0`) : **vert**.
   - `build` : les 3 apps buildent ; le seul échec initial
     (`admin:build:production`) était un refus réseau du sandbox vers
     `fonts.googleapis.com` (rien à voir avec Node) — résolu en autorisant
     ce host, build vert ensuite.
   - `lint` : `admin`/`webapp`/`webapp-e2e`/`admin-e2e` échouent — mais
     **à l'identique sous Node 22 et Node 24** (reproduit les deux, diff
     nul), donc préexistant sur cette branche, indépendant de ce spike
     (constructeurs vides `@typescript-eslint/no-empty-function` dans
     `dashboard.component.ts`/`carousel.component.ts`/
     `my-publications.component.ts`, et une erreur de config ESLint sur
     `plugin:cypress/recommended` dans les projets e2e — ni l'un ni
     l'autre ne sont dans le périmètre de ce spike, non corrigés).
   - `test` : 6/6 projets verts, mêmes comptes qu'au dernier relevé
     (`api-domain` 6/41, `api-adapters` 5/28, `api` 21/130, `admin` 7
     suites/26 tests (1 skip), `webapp` 39/89 — la hausse webapp/admin
     vs. le relevé du 24 reflète le travail de couverture fait entre
     temps sur d'autres sous-vagues, pas une variation due à Node 24).
   - **Conclusion sanity check : Angular 22/Nx 22/le reste de la stack
     tolèrent Node 24 sans régression.**
2. **État réel des versions re-vérifié avant tout changement** (pas
   supposé) : `node_modules/@nestjs/{common,core,platform-express}`
   à `11.2.6`, exactement comme déclaré dans `package.json` — donc bien
   11→12 direct à tenter, pas de palier intermédiaire déjà fait sur cette
   branche. Découverte notable en creusant l'état réel : **ce worktree a
   son propre `node_modules` indépendant**, pas un symlink partagé vers
   `/home/tanos/bella/node_modules` (vérifié en écrivant un fichier
   marqueur dans l'un, en constatant son absence dans l'autre) — l'overlay
   par symlinks-éclatés du spike du 24 n'est donc plus nécessaire ; un
   vrai `yarn install` scopé à ce worktree suffit et ne touche jamais
   l'arbre partagé (confirmé par le même test de marqueur après
   l'installation). Le commentaire dans `apps/api/jest.config.ts`
   décrivant "un symlink unique... vers le node_modules partagé" est donc
   **obsolète** (drift documentaire mineur, non corrigé dans ce spike —
   la logique du `moduleNameMapper` qu'il justifie reste correcte et
   nécessaire, seule l'explication du *pourquoi* a changé).
3. **Overlay/installation** : `package.json` édité (`@nestjs/axios`
   `~4.0.1→~12.0.1`, `common`/`core` `~11.2.6→~12.1.0`, `config`
   `~4.0.4→~12.0.1`, `mongoose` `~11.0.4→~12.0.0`, `passport`
   `~11.0.5→~12.0.0`, `platform-express` `~11.2.6→~12.1.0`, `swagger`
   `~11.4.7→~12.0.2`, `terminus` `~11.1.1→~12.1.0`, `schematics`
   `~11.1.0→~12.0.5`, `testing` `~11.2.6→~12.1.0` ; `@nestjs/jwt` déjà à
   `~12.0.2` sur cette branche, inchangé). Versions choisies après
   vérification une à une des `peerDependencies` publiées sur le registre
   npm (toutes compatibles entre elles pour `@nestjs/common@^12.0.0` /
   `@nestjs/core@^12.0.0`, `mongoose@^9.10.2` satisfait le peer
   `@nestjs/mongoose@12.0.0`, `typescript@~6.0.3` satisfait le peer
   `@nestjs/swagger@12.0.2`/`@nestjs/schematics@12.0.5`
   `>=6.0.0`/`^5.5.0||^6.0.0`). `yarn install --ignore-engines` (le flag
   `--ignore-engines`, pas une édition du champ `engines` de
   `package.json`, pour contourner le refus de Yarn 1 de tourner sous
   Node 24 alors que `engines` dit `>=22 <23` — champ non touché,
   conformément au mandat) exécuté sous `nvm use 24.21.0`, avec `yarn`
   obtenu via `corepack` du Node 24 lui-même (`corepack` est fourni
   nativement par Node ≥16.9, aucune installation globale nécessaire).
   Résultat : install propre, aucun conflit de peer bloquant. Confirmé
   installé : `@nestjs/{common,core,platform-express,testing}@12.1.0`,
   `mongoose`-wrapper/`passport`-wrapper `@12.0.0`, `swagger@12.0.2`,
   `terminus@12.1.0`, `axios-wrapper@12.0.1`, `config@12.0.1`,
   `schematics@12.0.5`. Seuls `package.json`/`yarn.lock` modifiés — **zéro
   changement sur `apps/api/jest.config.ts`, `tsconfig.spec.json` ou
   `jest.preset.js`**.
4. **`nx test api` sous Node 24.21.0 + `NODE_OPTIONS=--experimental-vm-modules`**
   (voir §1.4 pour le détail technique de pourquoi les deux sont
   nécessaires) : **21 suites / 130 tests, tous verts — identique au
   compte baseline NestJS 11.x.** C'est le résultat central de la reprise
   de ce spike : le verrou Jest/ESM des deux tentatives du 24 est levé,
   sans qu'aucune des deux configurations qui avaient échoué
   (`babel-jest` scopé, mode ESM natif `ts-jest`/`extensionsToTreatAsEsm`)
   n'ait été nécessaire.
5. **`nx build api` (webpack)** : vert, sous Node 24, avec NestJS 12.1.0.
   **`nx lint`** sur `api`/`api-domain`/`api-adapters`/`dtos` : vert (0
   erreur, uniquement les mêmes warnings `no-explicit-any` préexistants
   qu'en baseline). `nx run-many --target=test --all --exclude=api` (sans
   le flag ESM) : les 5 autres projets verts, mêmes comptes qu'en
   baseline — la présence de NestJS 12.1.0 dans l'arbre ne casse rien
   côté webapp/admin.
6. **Caveat découvert en testant la combinaison `run-many` + flag global**
   (détaillé en §1.4 point 3) : `NODE_OPTIONS=--experimental-vm-modules`
   positionné pour toute l'invocation `nx run-many --target=test --all`
   fait échouer `admin:test`/`webapp:test` (`ReferenceError: module is not
   defined` dans `@angular/core/fesm2022/core.mjs` chargé par
   `jest-preset-angular`) car `@nx/jest` exécute `jest.runCLI` in-process
   et Nx forke un processus par projet en héritant de `NODE_OPTIONS` —
   donc le flag fuit vers des projets qui n'en ont pas besoin et que ça
   casse. **Aucune commande unique ne fait passer les 6 projets ensemble**
   avec ce flag global ; testé et vert **séparément** (`nx test api` seul
   avec le flag, `run-many --exclude=api` sans). Point resté ouvert :
   scoper `NODE_OPTIONS` au seul target `test` d'`api` (candidat non
   exploré : `options.env` sur ce target dans `apps/api/project.json`, si
   ce mécanisme existe en Nx 22 — pas vérifié dans le budget de ce spike).
7. **Express 5.2.1 non qualifié** (voir découverte annexe déjà documentée
   en §1.4) : confirmé toujours d'actualité — `@nestjs/platform-express@12.1.0`
   épingle exactement `express@5.2.1`, installé cette fois pour de vrai
   (nesté sous `node_modules/@nestjs/platform-express/node_modules/express`,
   Yarn 1 ayant gardé `express@4.22.3` au niveau racine pour
   `swagger-ui-express`). Non testé au runtime réel (pas de `.env`/MongoDB
   dans ce spike) ; les tests de caractérisation sur
   `AdsController`/`AdsRepositoryNest` demandés par le mandat pour ce
   sous-point **n'ont pas été écrits** — reste un sous-point à part entière
   avant d'adopter la migration en confiance, pas traité dans cette
   session.
8. **Nettoyage** : conformément au mandat ("succès complet **et validé**"
   — la validation `senior-dev` n'a pas eu lieu dans cette session),
   `package.json`/`yarn.lock` restaurés (`git checkout --`), puis
   `yarn install` relancé sous Node 22 (par défaut, sans
   `--ignore-engines`, cette fois conforme à `engines`) pour reconstituer
   `node_modules` à l'identique de l'état NestJS 11.x (`@nestjs/common`
   confirmé revenu à `11.2.6`, `express` racine confirmé revenu à
   `4.22.3`). `npx nx run-many --target=test --all --skip-nx-cache` sous
   Node 22 reconfirmé vert, mêmes 21/130 côté `api` qu'avant le spike.
   Aucun binaire global installé de façon persistante (le `yarn` utilisé
   sous Node 24 vient de `corepack`, fourni par la distribution Node
   elle-même, rien ajouté à `~/.nvm`). `~/.nvm/alias/default` et
   `package.json` `engines` **non touchés**. `git status` propre en fin
   de session hormis cette mise à jour de documentation — **aucun commit
   de code n'a résulté de cette reprise**, seule la documentation est
   committée.
9. **Décision** : le verrou technique Jest/ESM qui bloquait le palier
   NestJS 11→12 depuis le 2026-09-24 est **levé** — la piste Node ≥24.9
   fonctionne, à la fois plus simple (zéro fichier de config Jest touché)
   et plus contraignante (nécessite `--experimental-vm-modules` en plus
   de Node ≥24.9, et un caveat d'invocation `run-many` non résolu) que ce
   que le message d'erreur Jest laissait entendre. **Ne pas considérer ce
   palier acquis** : (a) migration Express 5 non qualifiée par des tests
   de caractérisation (mandat, point 4/7 ci-dessus), (b) caveat
   d'invocation `run-many`/`NODE_OPTIONS` à résoudre avant intégration CI,
   (c) décision de faire de Node 24 le runtime par défaut du poste de dev
   / CI / PM2-EC2 est **hors mandat de ce spike**, à remonter séparément à
   l'utilisateur si cette voie est retenue.

**Revue `senior-dev` (2026-09-25) — VALIDÉ, avec une réserve non
bloquante.** Vérification indépendante, pas de confiance sur parole :
`senior-dev` a **reproduit lui-même tout le spike** (bump réel de
`package.json` vers NestJS 12.1.0 sous Node 24.21.0 via `yarn install
--ignore-engines`/corepack, `nx test api` sous
`NODE_OPTIONS=--experimental-vm-modules`), confirmant à l'identique le
résultat central (21 suites/130 tests verts, `jest.config.ts`/
`tsconfig.spec.json` inchangés), le mécanisme technique précis
(`require('vm').SourceTextModule` passe de `undefined` à `'function'`
avec le flag, y compris sous 24.21) et le caveat `run-many` (39/39 suites
`webapp:test` en échec avec le flag positionné globalement — reproduit,
pas supposé). Restauration post-vérification confirmée propre
(`package.json`/`yarn.lock` revenus à l'identique, `@nestjs/common` à
`11.2.6`, `express` racine à `4.22.3`, suite complète revérifiée verte,
`git status` propre). Seule réserve, non bloquante et déjà corrigée par
la reformulation de §7.5 ci-dessous : le point 9 ci-dessus (l'arbitrage
Node 24 par défaut) n'avait pas été reporté dans la liste consolidée §7 —
un défaut de maintenance croisée entre sections, pas une inexactitude
factuelle sur le spike lui-même. Détail complet :
`CHANTIER-MODERNISATION-REVIEW-SPIKE-NODE24.md`.

**Qualification des deux sous-points restés ouverts (2026-09-25, session
tech-lead post-revue senior-dev) — sur décision explicite utilisateur
("poursuivre vers l'adoption").**

**1. Express 5 — recherche croisée avec le code réel, pas une liste
générique.** Les breaking changes Express 4→5 documentés (migration guide
officiel) sont : (a) parseur de query string par défaut `qs`
(extended)→`querystring` natif Node (simple) ; (b) suppression de
`req.param(name)` ; (c) `res.status()` n'accepte plus que des entiers
100-999 ; (d) syntaxe des routes wildcard/optionnelles/regex qui change
(path-to-regexp v8) ; (e) `req.query` devient un getter non réassignable ;
(f) forwarding automatique des rejets de promesses async vers les error
handlers ; (g) signatures `res.json(obj, status)`/`res.send(body,
status)`/`res.redirect(url, status)` supprimées au profit de
`res.status(x).json(obj)` etc.

Vérifié en lisant le code réel, pas supposé :
- `apps/api/src/app/api/ad-search-query.dto.ts` (le DTO de
  `AdsController.getAll`/`getMyPublications`, construit à partir de
  `@Query()`) est **100 % scalaire** — `@IsString()`, `@IsNumberString()`,
  `@Type(() => Number) @IsInt()` sur chaque champ (`category`, `city`,
  `country`, `keyword`, `quality`, `minPrice`, `maxPrice`, `limit`),
  aucun tableau, aucun objet imbriqué déclaré.
- Grep exhaustif de tous les `@Query(...)` de `apps/api/src` (`grep -rn
  "@Query("` hors specs) : `AdsController.getMostRecentAds`
  (`category`/`country`/`limit`), `CategoriesController.getAll`
  (`selectable`), `AdminPublicationController` (`page`/`pageSize` × 3
  endpoints) — tous des `@Query('x')` scalaires individuels, aucun DTO
  imbriqué/tableau ailleurs dans l'API.
- Donc **le risque (a) — le changement de parseur qs vs querystring — ne
  s'applique à aucune requête bien formée que les deux front-ends
  envoient réellement** : pour des clés `a=1&a=2` ou des valeurs scalaires
  simples, `qs` et `querystring` produisent un résultat identique ; ils ne
  divergent que sur la notation imbriquée par crochets
  (`?keyword[$ne]=1` → objet imbriqué sous `qs`, clé littérale
  `'keyword[$ne]'` sous `querystring`), notation qu'aucun DTO de ce repo
  n'utilise ni n'attend.
- `grep -rn "\.param(" apps/api/src` (hors specs) : **aucune occurrence** —
  risque (b) inapplicable.
- `grep -rn "@Res(\|@Req(" apps/api/src` et recherche de `res.status`/
  `res.json`/`res.send` : **aucune occurrence** — tous les contrôleurs
  laissent Nest gérer la sérialisation/le code de statut via ses propres
  `HttpException` (`NotFoundException`, `ForbiddenException`, ...) ;
  risques (c) et (g) inapplicables au code applicatif (ils resteraient la
  responsabilité de la couche de compat `@nestjs/platform-express`
  elle-même, hors périmètre de ce repo).
- Routes de tous les contrôleurs (`ads`, `admin/publication`, `categories`,
  `countries`, `users`, `app`, `health`) grep-ées pour tout caractère
  `* ( ) ?` dans les chaînes de route : **aucune** — uniquement des
  segments littéraux et des `:param` simples, jamais de wildcard, de
  regex ou de segment optionnel. Risque (d) inapplicable.
- `grep -rn "\.query\s*=\|req\.query\[" apps/api/src` (hors specs) et
  lecture de tous les guards/interceptors/`cors.config.ts` : **aucune
  mutation de `req.query`**. Risque (e) inapplicable.
- Risque (f) : Nest ne s'appuie pas sur le forwarding natif Express pour
  ses propres handlers (pipeline RxJS/intercepteurs), donc sans objet ici.

**Conclusion : aucun des breaking changes documentés d'Express 4→5 n'a
d'impact fonctionnel différentiel concret sur la surface d'API actuelle de
ce repo**, vérifié par lecture exhaustive du code plutôt que supposé. Ce
n'est pas une raison de n'écrire aucun test : la seule zone où le choix du
parseur *pourrait* théoriquement compter est une requête malformée/
adverse essayant de faire passer une forme imbriquée/tableau à travers la
validation (ex. tentative d'injection NoSQL visant
`AdsMongoFilterBuilder`, qui étale tel quel dans le filtre Mongo tout ce
que le pipe de validation laisse passer — voir
`ads-mongo-filter-builder.ts`). Quatre tests de caractérisation additifs
ont été ajoutés à `apps/api/src/app/api/ad-search-query.dto.spec.ts`
(nouveau `describe`, aucune assertion existante modifiée), sur l'instance
réelle `adSearchQueryValidationPipe` utilisée en production :
1. rejet d'une valeur imbriquée façon `qs` (`{ keyword: { $ne: '1' } }`,
   ce que produirait `?keyword[$ne]=1` sous Express 4) ;
2. rejet d'une valeur imbriquée façon `qs` sur `minPrice`/`maxPrice` ;
3. rejet d'une clé littérale à crochets façon `querystring`
   (`{ 'keyword[$ne]': '1' }`, ce que produirait le même `?keyword[$ne]=1`
   sous Express 5) ;
4. rejet d'une valeur tableau sur un champ scalaire (`category: ['cars',
   'bikes']`, forme identique sous les deux parseurs, donc pas une
   divergence 4→5 en soi, mais une forme que ni le DTO ni
   `AdsMongoFilterBuilder` ne sont censés accepter).

Résultat empirique, dans l'ordre exécuté :
- **Baseline (Node 22.23.2, `@nestjs/common@11.2.6`, `express@4.22.3`
  racine)** : `nx test api --testPathPatterns=ad-search-query.dto.spec.ts`
  → 12/12 verts (8 tests existants + 4 nouveaux). `nx test api
  --skip-nx-cache` complet → 21 suites / **134** tests verts (130 + 4).
- **Overlay Node 24.21.0 + bump réel `@nestjs/{axios,common,config,core,
  mongoose,passport,platform-express,swagger,terminus,schematics,
  testing}` vers leurs versions `~12.x`** (mêmes versions que la reprise
  du spike précédent, `yarn install --ignore-engines` via `corepack`) :
  `express` confirmé installé en `5.2.1` sous
  `node_modules/@nestjs/platform-express/node_modules/express` (racine
  Yarn 1 gardée à `4.22.3` pour `swagger-ui-express`, comme déjà noté).
  `NODE_OPTIONS=--experimental-vm-modules nx test api --skip-nx-cache` →
  **21 suites / 134 tests verts, y compris les 4 nouveaux** — aucune
  divergence. Restauration ensuite scrupuleuse (`git checkout --
  package.json yarn.lock`, `yarn install` sous Node 22 par défaut,
  `@nestjs/common` reconfirmé `11.2.6`, `express` racine reconfirmé
  `4.22.3`).
- **Limite assumée de cette qualification** : ces tests exercent
  `adSearchQueryValidationPipe.transform()` directement sur un objet JS
  déjà construit — comme tout le reste de la suite `apps/api` (aucun
  `supertest`/serveur HTTP réel dans ce repo, seulement des tests
  unitaires/de module Nest). Ils prouvent que la couche de validation
  applicative se comporte à l'identique après le bump de dépendances
  (donc que rien dans la chaîne `class-validator`/`class-transformer`/
  NestJS 12 n'a changé ce comportement), mais ils n'exercent **pas** le
  parseur Express réel lui-même au runtime HTTP (aucun `.env`/MongoDB
  disponible dans ce spike pour monter un serveur réel, comme déjà noté
  au point 7 de la reprise du spike ci-dessus). Étant donné que (i) la
  validation applicative est la seule ligne de défense pertinente ici
  (elle rejette les deux formes possibles quel que soit le parseur qui les
  a produites) et (ii) aucun DTO/paramètre de cette API n'utilise de forme
  imbriquée/tableau légitime, ce niveau de test est jugé suffisant pour
  qualifier ce risque précis sans monter un serveur HTTP réel — mais ce
  n'est pas un test end-to-end du parseur Express lui-même, à noter pour
  qui reprendrait ce palier avec un environnement `.env`/MongoDB
  disponible.

**Décision : le risque Express 5 documenté au point 7 de la reprise du
spike est levé pour la surface d'API actuelle** — aucun comportement
fonctionnel ne diverge, confirmé à la fois par lecture exhaustive du code
et par exécution empirique des tests de caractérisation sous les deux
stacks. Cela ne présume pas d'un futur DTO qui introduirait un champ
tableau/imbriqué : si un tel DTO apparaît, ce point devra être requalifié.

**2. Caveat `NODE_OPTIONS`/`run-many` — résolu par un mécanisme Nx natif,
pas par `options.env` (qui n'existe pas sur cet executor).** Le candidat
envisagé par le point 6 de la reprise du spike (`options.env` dans
`apps/api/project.json`) a été vérifié et **n'existe pas** : le schéma de
l'executor `@nx/jest:jest` (`node_modules/@nx/jest/src/executors/jest/
schema.json`, `@nx/jest@22.7.12` — version confirmée dans `package.json`)
ne déclare aucune propriété `env`/`options.env`, uniquement des options
correspondant à des flags CLI Jest.

En creusant le tasks-runner de `nx@22.7.12` lui-même
(`node_modules/nx/dist/src/tasks-runner/task-env.js` et
`task-env-paths.js`), Nx supporte nativement un mécanisme différent mais
équivalent en pratique : des fichiers **dotenv scopés par projet ET par
target**, au nom `<project-root>/.env.<target>` (et ses variantes
`.env.<target>.local`, `.<target>.env`, `.<target>.local.env`), chargés
automatiquement dans l'environnement du process forké pour **cette seule
tâche** (`getEnvPathsForTask`/`loadDotEnvFilesForTask`, appelé par
`task-orchestrator.js` avant de forker le process de chaque tâche). Ce
chargement est actif par défaut pour `run-many`/`run-one`/`affected`
(`NX_LOAD_DOT_ENV_FILES !== 'false'`), donc sans configuration
supplémentaire ni flag à ajouter à la commande quotidienne.

Implémenté : `apps/api/.env.test` (commenté, contenu unique :
`NODE_OPTIONS=--experimental-vm-modules`), avec une exception dédiée dans
`.gitignore` (`!/apps/api/.env.test`, à côté de l'exception `.env.dist`
déjà existante — ce fichier ne contient aucun secret, uniquement un flag
d'outillage de test).

Vérifié empiriquement, dans les deux sens :
- **Sous l'overlay Node 24/NestJS 12/Express 5**, `NODE_OPTIONS` **non
  positionné dans le shell** (`unset NODE_OPTIONS` confirmé avant
  exécution) : `nx run-many --target=test --all --skip-nx-cache` →
  **les 6 projets verts en une seule commande** — `api-domain` 6/41,
  `admin` 7/26 (1 skip), `api-adapters` 5/28, `webapp` 39/89, `api`
  21/**134** (le process `api:test` affiche bien les warnings
  `ExperimentalWarning: VM Modules...`, preuve que le flag a été injecté
  pour cette seule tâche), `dtos` sans test. C'est le résultat central :
  le caveat documenté au point 6 de la reprise du spike (`webapp`/`admin`
  cassés par un `NODE_OPTIONS` global) est résolu — plus besoin de lancer
  `api` séparément du reste.
- **Sous la stack actuelle (Node 22.23.2, NestJS 11.x)**, avec
  `apps/api/.env.test` toujours présent et `NODE_OPTIONS` toujours non
  positionné dans le shell : `nx run-many --target=test --all
  --skip-nx-cache` → les 6 projets verts, mêmes comptes qu'en baseline
  (`api` 21/134 y compris les 4 nouveaux tests Express 5, `webapp` 39/89,
  `admin` 7/26, `api-domain` 6/41, `api-adapters` 5/28) — **neutre**, le
  flag ne casse rien sous NestJS 11 (`ts-jest` en CommonJS l'ignore
  silencieusement ; sous Node 22 il ne produit même pas le warning
  `ExperimentalWarning` observé sous Node 24, sans doute une différence de
  maturité du flag entre versions Node, sans incidence sur le résultat).
- Conforme au point 4 du mandat de cette tâche : `apps/api/project.json`
  **n'a pas été modifié** (le mécanisme retenu ne passe pas par lui) ;
  seul l'ajout du fichier `apps/api/.env.test` + son exception
  `.gitignore` a un effet, et il est vérifié inoffensif sous la stack
  actuelle — donc committable indépendamment du bump NestJS 12, comme
  autorisé par le mandat.

**Décision : le caveat `NODE_OPTIONS`/`run-many` est résolu**, par un
mécanisme Nx documenté et natif plutôt que par un outillage ad hoc
(`cross-env`, wrapper de script npm) qui aurait changé la façon dont
l'équipe lance ses tests au quotidien — `nx test api` et `nx run-many
--target=test --all` continuent de s'invoquer exactement comme avant,
sans flag ni variable à positionner manuellement.

**Ce qui reste hors mandat de cette session, à remonter à l'utilisateur**
(inchangé par rapport à la reprise du spike) : la décision d'adopter Node
≥24.9 comme runtime par défaut du poste de dev / CI / déploiement
PM2-EC2 (`ecosystem.config.js`, `package.json` `engines`,
`~/.nvm/alias/default`) pour pouvoir effectivement bumper NestJS 11→12 en
production. Les deux sous-points qui empêchaient de considérer ce palier
"acquis en confiance" sont maintenant qualifiés et ne bloquent plus cette
décision produit/infra — mais la décision elle-même reste entièrement
ouverte.

**Revue `senior-dev` (2026-09-25) — VALIDÉ.** Vérification indépendante
complète, pas une relecture du rapport : grep exhaustif refait sur tous
les `@Query()` de l'API (confirmé 100 % scalaires), `nx test api`
relancé (21/134 verts confirmé), et l'overlay complet reproduit une
troisième fois de façon indépendante (bump réel vers NestJS ~12.x sous
Node 24.21.0 via corepack, `express@5.2.1` niché confirmé, tests
identiques 21/134 verts, restauration scrupuleuse ensuite revérifiée
propre). Sur le caveat `NODE_OPTIONS`, la vérification est allée plus
loin que le rapport du tech-lead : remontée jusqu'à
`run-many.js`/`run-one.js`/`affected.js` dans les sources de `nx@22.7.12`
pour confirmer que `NX_LOAD_DOT_ENV_FILES` est actif par défaut (pas
seulement plausible), et `nx run-many --target=test --all` (sans
`NODE_OPTIONS` dans le shell) relancé indépendamment sous baseline et
sous overlay — 6/6 projets verts dans les deux cas, `ExperimentalWarning`
visible uniquement sur la tâche `api:test` sous overlay, preuve directe
de l'isolation. Aucun écart trouvé entre les affirmations du tech-lead et
les reproductions indépendantes. Détail complet :
`CHANTIER-MODERNISATION-REVIEW-EXPRESS5-NODEOPTIONS.md`. **Les deux
sous-points qui restaient à qualifier avant de considérer le palier
NestJS 12/Node ≥24.9 "acquis en confiance" sont donc definitivement
clos** — seule la décision produit/infra ci-dessus reste ouverte.

### Phase 1 — Filet de sécurité : tests de caractérisation sur les domaines non couverts

- **Objectif** : combler les trous de §1.5 **avant** de toucher au code
  qu'ils couvrent. Priorité : `libs/api/adapters` (5 mappers, y compris le
  comportement `NotFoundException` actuel d'`AdMapper` à figer avant de le
  déplacer en phase 2), puis les 5 services domaine sans spec
  (categories/cities/countries/users/moderators), puis les repositories
  Nest sans spec (categories/cities/countries/users/moderator-identity),
  puis les 3 controllers sans spec (categories/countries/users).
- **Fichiers touchés** : uniquement des `*.spec.ts` nouveaux — zéro fichier
  de production modifié.
- **Principe appliqué** : c'est la mise en pratique du principe 1 (§3).
- **Tests** : c'est la phase elle-même. Critère de sortie : chaque fichier
  listé en §1.5 comme non couvert a au moins un test qui échouerait si son
  comportement actuel changeait silencieusement.
- **Charge estimée** : M (5 services domaine + 5 mappers + 5 repositories
  Nest + 3 controllers, mais purement additif et répétitif — pas de
  logique de conception nouvelle par fichier).
- **Risque** : faible — aucun fichier de production modifié, uniquement des
  `*.spec.ts` nouveaux.
- **Critère d'acceptation** : chaque fichier listé en §1.5 comme non
  couvert a au moins un test vert ; `nx run-many --target=test --all`
  reste vert.
- **Rollback** : trivial — suppression des fichiers `*.spec.ts` ajoutés,
  aucun impact sur le code de production.
- **Dépendances** : aucune — peut démarrer en parallèle de la phase 0bis.

### Phase 1bis — Combler l'angle mort e2e (ajoutée après revue senior — voir §8)

- **Objectif** : `admin-e2e` et `webapp-e2e` sont aujourd'hui des
  placeholders Nx non fonctionnels (voir §1.5) — zéro filet d'intégration
  réel sur le cycle de vie d'une annonce ou le flux de modération. Pour un
  mandat "sans régression" qui va toucher le contrôleur ads, le store de
  modération (phase 4) et la conversion standalone (phase 5) — les
  endroits où un bug de câblage (guard mal branché, routing cassé après
  extraction de NgModule, observable qui ne se déclenche plus) n'est
  détecté par **aucun** test unitaire — remplacer le placeholder par un
  minimum de 2 scénarios réels et stables : (a) webapp — poster une
  annonce jusqu'à `SUBMITTED` ; (b) admin — se connecter et
  approuver/rejeter une annonce depuis la file d'attente.
- **Fichiers touchés** : `apps/webapp-e2e/src/e2e/*`,
  `apps/admin-e2e/src/e2e/*`, potentiellement la configuration Cypress et
  des fixtures/données de seed dédiées au test, et un moyen de simuler
  l'authentification Auth0 en environnement de test (compte de test ou
  mock du provider) sans quoi aucun des deux scénarios ne peut s'exécuter.
- **Principe appliqué** : aucun principe SOLID — c'est la mise en place du
  filet d'intégration que le principe 1 (§3, tests de caractérisation) ne
  peut pas fournir seul, puisqu'il protège une fonction isolée, pas le
  câblage entre modules/guards/routes.
- **Charge estimée** : **L — la plus grosse inconnue de charge de tout ce
  chantier**, à chiffrer précisément avant de s'engager sur un délai. La
  partie non triviale n'est pas l'écriture des scénarios Cypress eux-mêmes
  mais l'outillage autour (compte de test Auth0 fonctionnel de bout en
  bout, données de fixtures Mongo stables et isolées entre exécutions,
  gestion d'un service tiers comme Cloudinary en environnement de test).
  Le libellé "2-3 scénarios" de la revue senior sous-estime probablement ce
  coût d'outillage si on le lit comme "quelques heures" — à traiter comme
  un chantier à part entière, pas une tâche annexe d'une phase de tests.
- **Risque** : moyen — risque d'un chantier d'outillage e2e sous-estimé
  (comptes de test, stabilité des fixtures, flakiness Cypress), **pas** un
  risque de régression métier (la phase est additive, aucun fichier de
  production n'est modifié).
- **Critère d'acceptation** : les 2 scénarios listés ci-dessus passent de
  façon stable — au moins 3 exécutions consécutives vertes, pas une seule —
  en CI locale ou équivalent.
- **Rollback** : additif — revert des commits Cypress sans impact sur le
  reste du chantier. **Clause explicite si la charge dérape** : si le
  chiffrage en tout début de phase dépasse le budget disponible, la phase
  peut être reportée, mais alors les phases 4 et 5 doivent documenter
  explicitement qu'elles avancent **sans filet d'intégration** (risque
  accepté et écrit noir sur blanc, pas silencieusement ignoré — c'est
  précisément le reproche adressé par la revue senior au document
  original).
- **Dépendances** : aucune techniquement pour démarrer, mais doit être
  terminée — ou son report explicitement acté par l'utilisateur — avant le
  lancement des phases 4 et 5.

**Résultat du chiffrage (exécuté le 2026-09-24) : reporté — un des trois
prérequis est bloquant dans cet environnement, les deux autres ne le sont
pas.** Aucun scénario Cypress n'a été écrit ; le chiffrage a précédé toute
implémentation, comme exigé.

1. **Compte de test Auth0 — bloquant, pas de contournement honnête
   trouvé.**
   - Aucun `.env` n'existe dans ce worktree (seulement `.env.dist`) ;
     aucune variable d'environnement Auth0 (client secret, identifiants
     d'un utilisateur de test) n'est présente dans cette session.
   - `curl https://dev-bata.eu.auth0.com/.well-known/openid-configuration`
     est refusé par défaut par la politique réseau de cette session sandbox
     précise (`deny network-outbound dev-bata.eu.auth0.com:443`).
     **Correction après revue senior (2026-09-24,
     `CHANTIER-MODERNISATION-REVIEW-PHASE1BIS.md`)** : ce n'est **pas** un
     mur réseau structurel — le dev senior a refait le même appel en
     autorisant explicitement ce domaine pour une commande, et **le tenant
     répond normalement** (document de découverte OIDC complet, `jwks_uri`
     inclus). Le vrai blocage dur et permanent n'est donc pas le réseau
     (contournable à la commande près) mais l'absence totale
     d'identifiants — voir point suivant.
   - Même avec le réseau ouvert, il n'existe aucun identifiant réel (mot de
     passe d'un compte de test, ou client secret pour un grant
     machine-to-machine) permettant d'obtenir un JWT réellement signé par
     ce tenant, et ce mandat n'autorise pas d'en créer un dans un tenant
     Auth0 tiers appartenant à quelqu'un d'autre. **C'est ce point-là,
     seul, qui justifie le report** — pas une indisponibilité réseau. Un
     login Cypress headless réaliste demanderait donc soit **(a)** ces
     identifiants + le grant "Resource Owner Password" activé sur ce
     client (aucun des deux disponibles), soit **(b)** mocker entièrement
     le SDK `@auth0/auth0-angular`/
     `auth0-spa-js` côté front — l'alternative que le mandat demandait
     explicitement d'évaluer. Évaluée sérieusement, elle est écartée :
     reproduire le format interne (non documenté, instable entre versions
     du SDK) du cache de token dans `localStorage` ne suffit pas, il
     faudrait **aussi** qu'un JWT signé valide passe `JwtAuthGuard`, qui
     vérifie la signature via `jwks-rsa` contre les clés publiques réelles
     du tenant — donc mocker "juste assez" pour que les deux scénarios
     passent reviendrait à retirer la vraie frontière de sécurité du test
     plutôt qu'à la vérifier. C'est exactement le "mock silencieux d'une
     chose critique" que le mandat de cette session interdit explicitement,
     pas une simplification anodine.
   - Alternative propre identifiée mais hors budget de cette session : un
     serveur OIDC/JWKS local factice, avec `AUTH_ISSUER_URL`/
     `AUTH_AUDIENCE` redirigés dessus en configuration de test, et les deux
     `environment.ts` pointés dessus pour l'e2e. C'est un chantier
     d'infrastructure de test à part entière (pas quelques heures),
     cohérent avec le label "L" déjà posé par la revue senior — candidat
     naturel pour une reprise future de cette phase, structurée comme son
     propre spike time-boxé (sur le modèle de la Phase 0bis), pas pour
     cette session.
2. **MongoDB local — pas bloquant, vérifié fonctionnel.**
   - `mongod`/`mongosh` v8.0.32 sont installés dans le sandbox. Un `mongod`
     local démarre avec succès sur un port dédié (`--dbpath` isolé,
     `--nounixsocket` — le socket Unix par défaut dans `/tmp/mongodb-*.sock`
     est refusé en écriture par le sandbox ; `--nounixsocket` contourne
     proprement, sans toucher de configuration partagée). Testé et arrêté
     proprement pendant ce chiffrage, aucune trace laissée.
   - Les fixtures `apps/api/src/app/infrastructure/fixtures/*.fixture.mongodb`
     sont des scripts `mongosh` directement exécutables
     (`db.<collection>.drop()` + `insertMany`) — une base isolée et
     reproductible entre exécutions (nouveau `dbpath` par run, ou
     drop+reseed avant chaque suite) est donc réaliste.
   - Point non couvert par les fixtures existantes, à noter pour une
     reprise future : il n'existe **aucun** `users.fixture.mongodb`, alors
     que les deux scénarios visés dépendent d'un utilisateur applicatif
     (`CompleteProfileGuard` webapp exige un profil complété ; le flux
     admin dépend d'une identité modérateur en base) — une fixture dédiée
     resterait à écrire, mais c'est un ajout, pas un blocage.
3. **Cloudinary — pas bloquant, l'upload est réellement contournable dans
   le flux `post-an-ad`.**
   - Vérifié dans le code : le champ `images` du formulaire
     (`apps/webapp/src/app/pages/post-an-ad/ad-form/ad-form.component.ts`,
     `type: 'picture-uploader'`) n'a **pas** `required: true`, contrairement
     à tous les autres champs du même formulaire (titre, catégorie,
     qualité, ...).
   - `UploadService.uploadMultiple()`
     (`apps/webapp/src/app/shared/components/upload/upload.service.ts`)
     court-circuite vers `of([])` quand `files` est vide/`undefined` —
     aucun appel réseau vers Cloudinary n'est déclenché si le scénario e2e
     ne fournit aucune image.
   - Le scénario "poster une annonce jusqu'à SUBMITTED" peut donc être
     écrit sans jamais toucher Cloudinary.

**Verdict** : les deux scénarios visés (webapp, admin) sont chacun gardés
par un login Auth0 réel (`AuthGuard` sur `post-an-ad` côté webapp ;
`AuthGuard` + `PermissionsGuard` sur `dashboard`/`publications` côté
admin), donc les deux sont bloqués par le seul point 1 ci-dessus,
indépendamment du fait que les points 2 et 3 soient chiffrés comme
faisables.

**Décision (clause de rollback explicitement prévue par cette section) :
Phase 1bis reportée.** Pas un abandon — le chiffrage exigé par le mandat a
été fait concrètement (mongod réellement démarré, réseau réellement
testé, code réellement lu), pas supposé, et le seul obstacle dur trouvé
est documenté avec sa cause exacte plutôt que contourné en inventant des
identifiants ou en mockant silencieusement la couche d'authentification.

**Conséquence actée, comme l'exige la clause de rollback** : si les Phases
4 et 5 sont lancées, elles avanceront **sans filet d'intégration e2e**.
Risque accepté et écrit noir sur blanc, pas ignoré :
- Phase 4 (store admin) : le scope obligatoire retenu (4a, nettoyage) est
  déjà qualifié à risque faible, sans changement de comportement — impact
  limité de l'absence d'e2e.
- Phase 5 (standalone Angular) : c'est la phase qui en pâtit le plus — sa
  propre section documente déjà qu'un risque de câblage inter-modules
  (import manquant, provider mal enregistré) n'est détecté de façon fiable
  que par un e2e ou une vérification manuelle au navigateur. Sans Phase
  1bis, ce risque doit être couvert par une **vérification manuelle au
  navigateur systématique par sous-vague** (webapp puis admin), en plus du
  build/lint/test automatisé — recommandation ajoutée ici pour compenser
  partiellement l'absence de filet automatisé ; insuffisant en soi (une
  vérification manuelle ne remplace pas 3 exécutions automatisées stables)
  mais mieux que rien.

**Prochaine étape si cette phase est reprise plus tard** : obtenir soit
**(a)** un compte de test Auth0 réel avec le grant "Resource Owner
Password" activé pour ce client (décision qui doit venir de qui gère le
tenant `dev-bata`, hors mandat Tech Lead), soit **(b)** budgéter le
chantier "serveur OIDC/JWKS local factice" comme son propre spike
time-boxé, sur le modèle de la Phase 0bis.

**Revue senior indépendante (2026-09-24,
`CHANTIER-MODERNISATION-REVIEW-PHASE1BIS.md`) : validé avec réserves
mineures, aucune ne remettant en cause le report.** Trois points relevés,
tous traités :

1. La formulation "tenant injoignable" ci-dessus a été corrigée (voir le
   sous-point 1 juste au-dessus) — le vrai blocage dur est l'absence
   d'identifiants, pas le réseau, qui n'est qu'une restriction par défaut
   de cette session sandbox précise (contournable à la commande près,
   vérifié par le dev senior).
2. **Option de consolation suggérée par le dev senior, évaluée et à son
   tour reportée** : un scénario e2e public minimal côté `webapp` (ex.
   `/annonces` se charge, sans Auth0) a été considéré comme candidat à
   coût quasi nul. En creusant `WelcomeGuard`/`WelcomeService`
   (`apps/webapp/src/app/pages/welcome/`), ce n'est pas aussi trivial que
   la suggestion initiale le laissait penser : `annonces` porte
   `canActivate: [WelcomeGuard]`, et ce guard redirige vers `/welcome` sur
   toute session fraîche tant que `UserSettingsService.hasCountrySet()`
   est faux (pas de simple page publique ouverte par défaut) — un
   scénario stable devrait donc pré-semer le `localStorage` attendu par
   `UserSettingsService` avant `cy.visit`, **et** absorber de façon fiable
   la résolution de `AuthCustomService.isLoading$` (le SDK Auth0 démarre
   toujours, même pour un visiteur non connecté, avant que le guard ne
   conclue). C'est un test légitime et sans Auth0 réel, mais ce n'est plus
   un "coût quasi nul" — c'est un vrai petit chantier de câblage e2e avec
   son propre risque de flakiness (résolution de `isLoading$`), exactement
   le type de coût d'outillage sous-estimé que cette phase existe pour
   éviter de traiter à la légère. Reporté avec le reste de la phase plutôt
   que tenté sous pression de budget dans cette session — mais retenu
   comme la piste la moins chère pour une reprise partielle, avant même le
   spike OIDC complet.
3. **Checklist de vérification manuelle pour la Phase 5** : non écrite
   maintenant (prématuré tant que la Phase 5 n'est pas engagée), mais
   actée comme obligation explicite à remplir *au moment du déclenchement
   réel* de cette phase, pas laissée comme intention générale — voir la
   Phase 5 elle-même (§4) pour le rappel.

### Phase 2 — Nettoyage SOLID côté API (derrière le filet de sécurité de la phase 1)

- **Objectif** : traiter §1.3 points 1-7 un par un, chacun son propre
  commit vérifié build/lint/test. **Statut révisé après revue senior** :
  deux sous-points (2 et 8) ne sont **pas** acquis malgré leur numérotation
  séquentielle — ils dépendent de réponses aux questions ouvertes §7.3/§7.4
  qui n'existent pas encore. Ils sont gelés explicitement ci-dessous plutôt
  que traités comme les autres.

  **Sous-points exécutables sans dépendance externe :**
  1. Extraire `AdsMongoFilterBuilder` hors d'`AdsRepositoryNest` (OCP).
  2. *(numéro réservé — voir "Sous-points gelés" ci-dessous : c'était
     `findAllByUserId`)*
  3. **Scindé en deux, après revue senior (voir §1.3 point 3 et §8)** :
     - **3a — Extraction pure** de `shuffle`/`fakeMostRecentAds`
       d'`AdsController` vers un service applicatif dédié (SRP, aucun
       changement de comportement) — **risque bas**.
     - **3b — Policy owner-or-permission** : extraire la vérification
       d'autorisation inline de `publishAd()` vers une policy dédiée.
       **Reclassifié en changement à risque de comportement potentiel** :
       la policy doit reproduire *exactement* la même logique de
       résolution (`getUser`/`findOne`/comparaison d'ownership), verrouillée
       par un test de caractérisation dédié écrit **avant** le déplacement
       — pas un simple copier-coller comme le sous-entendait la formulation
       initiale.
  4. **[Débloqué et exécuté le 2026-09-24, avec une réserve
     d'environnement documentée ci-dessous]** Typer les filtres de requête
     (`AdSearchQueryDTO` + `class-validator`) sur `getAll`/
     `getMyPublications` — **ce point change un comportement observable**
     (rejet de query params invalides) et doit donc être un commit séparé,
     signalé comme tel (principe 7).

     **Historique du blocage et de sa résolution** : `class-validator` et
     `class-transformer` étaient absents de l'environnement (ni dans
     `package.json`, ni dans `node_modules`). Ce worktree n'a pas de
     `node_modules` propre : il résout ses dépendances par remontée de
     répertoire vers celui, **physiquement partagé**, du dépôt principal
     `/home/tanos/bella` (utilisé aussi par les autres worktrees actifs).
     Installer une dépendance classiquement (`yarn add`) depuis ce worktree
     écrirait dans cet arbre partagé — interdit par la fiche de rôle Tech
     Lead. Une première tentative d'overlay local (symlinks vers les
     paquets partagés + paquets réels ajoutés localement pour
     `class-validator`/`class-transformer`/leurs dépendances) avait fait
     apparaître une erreur TypeScript instable sur un fichier étranger à ce
     sous-point (`admin-publication.controller.ts:35`,
     `Property 'headers' does not exist on type 'RequestWithUser'`) —
     investigation poussée (3 worktrees isolés, dont `main` `b0912af` lui
     même) : cette erreur préexistait, indépendante de tout changement de
     ce chantier, et a été **corrigée en même temps que le sous-point 6**
     (typage explicite de `headers` via `IncomingHttpHeaders`, voir le
     commit du sous-point 6) — elle n'était donc pas liée à
     `class-validator` mais l'a fait apparaître par coïncidence temporelle.
     Une fois cette erreur corrigée, l'overlay local a été retenté :
     **`nx build/lint/test api` passent tous les trois**, à une condition
     près, découverte lors de cette seconde tentative — `@nestjs/common`'s
     `ValidationPipe` charge `class-validator` via un `require()` interne
     paresseux (`loadPackage`), résolu relativement à l'emplacement **réel**
     de `@nestjs/common` (le lien symbolique `node_modules/@nestjs` de
     l'overlay pointe vers le dossier réel partagé, donc Node résout ce
     `require()` en remontant depuis ce dossier réel, jamais vers l'overlay
     local) — l'overlay local seul ne suffit pas pour ce cas précis
     d'usage. Contournement retenu, sans toucher l'arbre partagé : la
     variable d'environnement standard Node `NODE_PATH` pointée vers le
     `node_modules` de ce worktree, qui ajoute ce dossier aux chemins de
     résolution consultés par **tout** `require()`, y compris ceux internes
     à une dépendance.
     **Limite connue à documenter pour la suite** : cette solution dépend
     de deux choses non committées dans git (`node_modules` est dans
     `.gitignore`) — l'overlay local lui-même et `NODE_PATH` positionné au
     lancement des commandes `nx`. Une session future qui relance `nx test
     api`/`nx build api` **sans ces deux éléments** retrouvera l'échec
     initial (paquet introuvable). La résolution définitive et propre
     reste un vrai `yarn install` scopé à ce worktree (chaque worktree Nx
     devrait avoir son propre `node_modules`, ce qui n'est pas le cas ici)
     — non tenté dans cette session par prudence sur le temps/la charge
     réseau que ça engagerait, l'overlay + `NODE_PATH` étant suffisant pour
     boucler ce sous-point dans l'immédiat. `package.json` a été mis à jour
     (`class-validator`/`class-transformer` ajoutés aux `dependencies`) ;
     **`yarn.lock` n'a volontairement pas été régénéré** (pas d'installation
     réelle exécutée) — à faire lors du prochain vrai `yarn install` de ce
     worktree.

     **Bug réel trouvé par la revue dev senior sur `3bc8dfd`, corrigé le
     2026-09-24** : `getAll`/`getMyPublications` liaient `@Query()
     filter: AdSearchQueryDTO` **et** un `@Query('limit') limit: number`
     séparé sur le même handler. Un `@Query()` sans clé résout à l'objet
     `req.query` **entier** (`limit` inclus), donc avec
     `forbidNonWhitelisted: true`, tout appel réel avec `?limit=` sur ces
     deux routes recevait un 400 (« property limit should not exist »),
     alors que `limit` est un paramètre documenté des deux — reproduit
     empiriquement par le dev senior. Impact réel nul au moment de la
     découverte (grep confirmé : aucun front n'envoie `?limit=` sur ces
     deux routes précises), mais défaut de contrat sur un paramètre
     documenté. Corrigé en ajoutant `limit` comme propriété de
     `AdSearchQueryDTO` (`@IsOptional() @Type(() => Number) @IsInt()`,
     seul champ de ce DTO coercé en nombre plutôt que gardé en chaîne
     numérique, car `AdsController` le repasse directement en
     `FilterOptions.limit`, typé `number` côté domaine) et en retirant le
     second `@Query('limit')` des deux handlers — `AdsController` extrait
     désormais `limit` du même `filter` et le sort explicitement des
     critères avant de les passer au filtre Mongo (`AdsMongoFilterBuilder`
     renvoie sinon tel quel toute clé qu'on lui donne). Couvert par de
     nouveaux tests dans `ad-search-query.dto.spec.ts` (acceptation +
     coercion de `?limit=` au niveau du pipe) et `ads.controller.spec.ts`
     (`getAll`/`getMyPublications` lisent `limit` sur `filter` sans le
     faire fuiter dans les critères Mongo).
  5. **Sortir `NotFoundException` (et `BadRequestException`) d'`AdMapper`
     et de `UserMapper`** — le `null`/`undefined` devient la
     responsabilité de l'appelant (SRP). **Reclassifié après revue senior
     (2026-09-24, voir §1.3bis) au même niveau de risque que le
     sous-point 4** : ce n'est pas un renommage/déplacement sans
     changement de comportement — tout appelant qui compte aujourd'hui
     sur cette exception levée automatiquement (`AdsController`,
     `UsersController.getProfile`/`findOne`) verrait un DTO malformé au
     lieu d'un rejet propre si le mapper cesse de lever sans que
     l'appelant ne rattrape le cas explicitement. Commit séparé
     obligatoire, avec ses propres tests du nouveau comportement de rejet
     côté appelant, en plus des tests de non-régression hérités de la
     Phase 1 (principe 7, §3).
  6. Extraire la pagination dupliquée d'`AdminPublicationController` dans
     un helper partagé.
  7. Retirer le commentaire TODO obsolète de `cities.service.ts`.
  8. **Ajouté 2026-09-24, sur recommandation de la revue senior Phase 1 —
     ajouter `@UseGuards(JwtAuthGuard)` sur `UsersController.findOne`
     (`GET /users/:id`)** : faille d'auth confirmée en Phase 1
     (`CHANTIER-MODERNISATION-REVIEW-PHASE1.md`, point 7) — `findOne` est
     le seul handler de `users.controller.ts` sans `@UseGuards(JwtAuthGuard)`
     (comparé à `check`/`getProfile`/`createProfile`/`updateProfile`/
     `deleteProfile`). Traité au rythme normal de cette phase (pas en
     hotfix d'urgence, décision déjà actée), mais ouvre la séquence des
     sous-points exécutables sur recommandation du dev senior. **Risque
     réévalué à l'exécution (2026-09-24), pas "bas" comme initialement
     qualifié** : `apps/webapp/src/app/pages/user/profile/profile.service.ts`
     appelle `GET /users/${id}` sans jamais attacher de JWT (cet endpoint
     n'est pas dans `AuthModule.forRoot(...).httpInterceptor.allowedList`
     d'`apps/webapp/src/app/app.module.ts`), et la route qui l'utilise —
     `profil/:id/:username` dans `apps/webapp/src/app/app-routing.module.ts`
     — n'est gardée que par `WelcomeGuard` (onboarding), pas par `AuthGuard`
     (Auth0). C'est donc aujourd'hui une page de profil **publique**
     (visible sans connexion, avec un DTO déjà restreint côté back par
     `UserMapper.modelToProfileDTO` à `id`/`username`/`country`/`picture`,
     sans email). Ajouter le guard API sans rien changer côté front rendrait
     cette page inutilisable pour tout visiteur non connecté (401
     systématique) — **ce n'est plus un simple ajout de garde manquante,
     c'est une régression fonctionnelle sur une page publique existante**,
     donc une question produit (voir §7, nouvelle question 11), pas une
     décision technique isolée. **Exécution suspendue côté code tant que
     l'utilisateur n'a pas arbitré** cette conséquence découverte pendant
     l'exécution — conformément à la règle du Tech Lead de ne jamais
     trancher seul une question produit.
     - **Fichiers touchés (si/quand débloqué)** : `apps/api/src/app/api/users.controller.ts`
       (ajout du guard), `apps/api/src/app/api/users.controller.spec.ts`
       (test de caractérisation `efc3e09` à inverser : le test qui asserte
       `Reflect.getMetadata(GUARDS_METADATA, UsersController.prototype.findOne)`
       →`toBeUndefined()` doit désormais asserter une valeur définie,
       modification du test précis validé QA en Phase 1 — pas un nouveau
       fichier).
     - **Tests** : mise à jour du test de caractérisation existant dans le
       même commit (comportement attendu de ce test précis, comme demandé) ;
       reste vert : le test de contrôle croisé sur `getProfile` (inchangé) et
       le test de mapping `UserMapper.modelToProfileDTO` (inchangé).
     - **Risque** : bas côté API isolée (guard déjà utilisé partout
       ailleurs sur ce controller) ; **moyen à élevé côté produit** vu la
       casse de la page de profil public webapp identifiée ci-dessus, tant
       qu'aucune réponse n'a été donnée sur le sort de cette page.
     - **Critère d'acceptation** : `Reflect.getMetadata(GUARDS_METADATA,
       UsersController.prototype.findOne)` retourne une valeur définie
       (non `undefined`) ; `nx run-many --target={build,lint,test} --all`
       vert ; **et** une réponse écrite à la question ouverte §7.11 existe
       avant que ce commit soit considéré définitif (le guard peut être
       posé techniquement avant cette réponse si l'utilisateur le demande
       explicitement, mais la régression front doit alors être traitée dans
       le même lot, pas laissée de côté silencieusement).
     - **Rollback** : commit isolé — revert de `@UseGuards(JwtAuthGuard)`
       sur `findOne` et du test associé, sans effet sur le reste de la
       Phase 2.
     - **Modification de test existant** : oui — comme pour tout changement
       de test déjà présent dans le repo, ce commit doit être soumis à
       `qa-reviewer` avant d'être considéré acquis (même règle de
       gouvernance que `efc3e09`, §5).
     - **CLÔTURE (2026-09-25) — RÉSOLU, plan ci-dessus abandonné.**
       L'utilisateur a tranché §7 question 11 directement : option (b),
       garder l'endpoint public, ne pas ajouter le guard. Conséquence :
       le plan « Fichiers touchés / Tests / Critère d'acceptation /
       Rollback » ci-dessus, écrit pour le cas où le guard serait ajouté,
       ne s'applique plus — **aucune de ces actions n'est exécutée**.
       `apps/api/src/app/api/users.controller.ts` et son
       `.spec.ts` (notamment le test `efc3e09` qui asserte
       `Reflect.getMetadata(GUARDS_METADATA,
       UsersController.prototype.findOne)` → `toBeUndefined()`) restent
       **inchangés**, ce qui est désormais le comportement correct et
       définitif, pas un report. Ce sous-point est clos comme documentation
       pure : voir §7.11 pour la décision complète et sa justification.
  9. **Ajouté 2026-09-24, sur recommandation de la revue senior Phase 1 —
     corriger `CategoriesController.getAll`** : `@Query() selectable:
     boolean` lie tout l'objet query (toujours truthy, même `{}`) au
     paramètre `selectable` au lieu d'en extraire la valeur — bug
     fonctionnel confirmé en Phase 1 et déjà caractérisé par
     `categories.controller.spec.ts` (« always filters selectable:true,
     even with no query params at all » / « still filters selectable:true
     even when the caller explicitly sends ?selectable=false »). Correction :
     `@Query('selectable') selectable?: string`, conversion explicite en
     booléen (`selectable === 'true'`), de sorte que `?selectable=false`
     exclue réellement les catégories non-sélectionnables. Traité comme un
     changement de comportement observable, pas un simple nettoyage SOLID.
     - **Fichiers touchés** : `apps/api/src/app/api/categories.controller.ts`,
       `apps/api/src/app/api/categories.controller.spec.ts` (les deux tests
       de caractérisation Phase 1 doivent être mis à jour pour refléter le
       nouveau comportement correct : `?selectable=false`→`{selectable:
       false}`, pas de query param/`?selectable=true`→`{selectable: true}` ;
       le test « toujours true » n'a plus lieu d'être et devient un test du
       comportement corrigé).
     - **Tests** : mise à jour des tests de caractérisation existants (même
       fichier, gouvernance §5) **et** ajout d'un nouveau test prouvant que
       `?selectable=false` et `?selectable=true` donnent des résultats
       différents (`findAll` appelé avec des filtres distincts selon la
       valeur du query param), en plus du test de mapping (`getAll` via
       `CategoryMapper.modelToDTOList`) et de `getTop`, inchangés.
     - **Risque** : bas — `CategoriesController.getAll` est un GET public
       en lecture seule, aucun état persistant modifié ; grep à faire avant
       le commit pour confirmer qu'aucun front (`webapp`/`admin`) ne dépend
       du comportement bugué actuel (ex. un appel qui enverrait
       `?selectable=false` en s'attendant, par erreur alignée sur le bug, à
       recevoir quand même les catégories sélectionnables).
     - **Critère d'acceptation** : `GET /categories?selectable=false` et
       `GET /categories?selectable=true` produisent des appels
       `categoryService.findAll` avec des filtres différents (`{selectable:
       false}` vs `{selectable: true}`) ; `nx run-many
       --target={build,lint,test} --all` vert.
     - **Rollback** : commit isolé — revert du controller et de son spec,
       sans effet sur le reste de la Phase 2.
     - **Modification de test existant** : oui (les deux tests de
       caractérisation Phase 1 changent d'assertion pour refléter le
       comportement corrigé) — soumis à `qa-reviewer` avant d'être
       considéré acquis, même règle de gouvernance que pour le sous-point 8
       et `efc3e09`.

  **Sous-points anciennement gelés (§7.3/§7.4) — DÉBLOQUÉS ET CLOS
  (2026-09-25, session tech-lead), l'utilisateur ayant répondu aux deux
  questions ouvertes. Détail complet en §7.3/§7.4 ; résumé ici :**
  - **`findAllByUserId`** : n'a **pas** été retiré d'`AdsRepository` comme
    initialement envisagé (ISP) — grep re-exécuté cette session, toujours
    zéro appelant réel confirmé, mais l'utilisateur a demandé de
    **terminer** (implémenter) plutôt que supprimer, l'implémentation
    précédente (`throw new Error('Method not implemented.')`) étant un
    contrat cassé, pas seulement mort. Implémenté (commit `4032458`,
    `apps/api/src/app/infrastructure/persistence/repositories/ads-repository-nest.ts`) :
    requête Mongo directe par `owner`, hypothèse documentée dans le
    commentaire de la méthode faute d'intention d'origine récupérable.
    Test de caractérisation existant modifié pour verrouiller le nouveau
    comportement (`ads-repository-nest.spec.ts`) — soumission `qa-reviewer`
    requise avant considération définitive, non faite dans cette session.
  - **`CitiesModule`** : rien à clarifier/retirer — vérification effectuée
    avant toute conclusion (comme demandé), et `CitiesModule`/
    `CitiesService` se sont révélés **ne pas être du code mort** : ils sont
    consommés par `CountriesController.getCities`
    (`GET /countries/:iso2/cities`), lui-même appelé par deux consommateurs
    front réels (formulaire `post-an-ad`, filtre de recherche). Un
    `CitiesController` séparé n'a jamais été nécessaire. **Aucune
    modification de code** pour ce sous-point (aucune n'était justifiée).
- **Fichiers touchés** : `apps/api/src/app/infrastructure/persistence/repositories/ads-repository-nest.ts` (+ `.spec.ts`, `findAllByUserId`), `apps/api/src/app/api/ads.controller.ts`, `apps/api/src/app/api/admin/admin-publication.controller.ts`, `libs/api/domain/src/lib/ads/ads.repository.ts`, `libs/api/adapters/src/lib/ad.mapper.ts`, `libs/api/domain/src/lib/cities/cities.service.ts`, `apps/api/src/app/api/users.controller.ts` (+ `.spec.ts`, sous-point 8), `apps/api/src/app/api/categories.controller.ts` (+ `.spec.ts`, sous-point 9), `apps/api/src/app/api/ad-search-query.dto.ts` (+ `.spec.ts`, nouveau, sous-point 4), `package.json` (ajout `class-validator`/`class-transformer`, sous-point 4).
- **Principes appliqués** : OCP, ISP, SRP (détaillés ci-dessus) ; 8 et 9
  sont des corrections de bug fonctionnel/faille de sécurité découvertes en
  Phase 1, pas des applications de principe SOLID au sens strict.
- **Tests** : la suite de la phase 1 (+ celle déjà existante) doit rester
  verte à l'identique pour tout sous-point qui ne change pas le
  comportement (1, 3a, 6, 7) ; le sous-point 3b ajoute un test de
  caractérisation avant déplacement ; les sous-points 4 (typage strict des
  requêtes) et 5 (sortie de `NotFoundException`/`BadRequestException` des
  mappers — reclassifié après revue senior, voir §1.3bis) ajoutent chacun
  de nouveaux tests pour leur propre changement de comportement observable
  (rejet des query params invalides pour 4, rejet explicite du cas
  introuvable côté appelant pour 5), en plus de garder les cas valides
  existants verts ; le sous-point 8 **modifie** le test de caractérisation
  existant `efc3e09` (inversion de l'assertion `GUARDS_METADATA`) ; le
  sous-point 9 **modifie** les deux tests de caractérisation Phase 1 de
  `categories.controller.spec.ts` et ajoute un nouveau test du
  comportement corrigé.
- **Charge estimée** : M-L pour l'ensemble des sous-points exécutables
  (désormais 9 commits indépendants avec 8 et 9) ; les 2 sous-points gelés
  n'ont pas de charge engagée tant que §7.3/§7.4 ne sont pas répondues.
- **Risque** : faible pour 1, 3a, 6, 7, 9 (9 : GET public en lecture seule,
  comportement corrigé strictement plus conforme à l'intention documentée
  de l'endpoint) ; moyen pour 3b (policy à reproduire fidèlement), 4 et 5
  (chacun un nouveau comportement observable côté API — 5 reclassifié
  après revue senior, voir §1.3bis) ; **8 CLOS (2026-09-25)** — l'utilisateur
  a tranché §7.11 (endpoint gardé public, guard non ajouté), donc plus
  de risque produit engagé sur ce sous-point : aucun code touché.
- **Critère d'acceptation** : `nx run-many --target={build,lint,test}
  --all` vert après chaque commit ; pour 1/3a/6/7, zéro différence dans
  les résultats de tests hérités de la phase 1 ; pour 3b, le test de
  caractérisation écrit avant déplacement reste vert après déplacement ;
  pour 4 et 5, les cas valides existants restent verts et de nouveaux
  tests couvrent explicitement le nouveau comportement de rejet (query
  params invalides pour 4, cas introuvable/mal formé pour 5) ; pour 9,
  `?selectable=false` et `?selectable=true` produisent des filtres
  distincts ; pour 8, résolu par documentation seule — voir §7.11 pour la
  décision et la clôture détaillée du sous-point, aucun critère de code à
  vérifier puisqu'aucun changement de code n'était attendu.
- **Rollback** : chaque sous-point est un commit isolé (principe 7, §3) —
  revert du commit précis concerné en cas de régression, jamais un
  rollback groupé, les sous-points étant indépendants entre eux.

### Phase 3 — Combler la couverture front (webapp)

- **Statut (2026-09-24) : terminée et committée** (2 commits sur
  `chantier/modernisation`, `49eb9c0` et `e53b039`). Détail :
  - **Premier passage interrompu.** Un agent précédent avait déjà écrit
    les 8 `.spec.ts` mais a été coupé en plein milieu par une limite de
    dépense API, avant tout commit — état laissé : 8 fichiers untracked,
    `nx test webapp` en échec (37 suites vertes / 1 rouge, `TS2345` dans
    `ads.service.spec.ts:186`).
  - **Vérification avant reprise, pas de confiance aveugle.** Les 8
    fichiers ont été relus un par un contre le code réel des services
    correspondants (pas seulement contre eux-mêmes) avant d'être
    conservés :
    - `categories.service.spec.ts`, `countries.service.spec.ts` :
      couverture HTTP réelle (`HttpClientTestingModule` +
      `HttpTestingController`) par endpoint, assertions sur URL, méthode,
      params ; `categories` couvre en plus le comportement de cache de
      `getAll()`.
    - `contact.service.spec.ts`, `my-device.service.spec.ts`,
      `qualities.service.spec.ts`, `search.service.spec.ts`,
      `user-settings.service.spec.ts` : ces 5 services n'émettent
      **aucun** appel HTTP direct (dérivation pure, délégué
      device-detector, liste statique, orchestrateur qui délègue le HTTP
      à `AdsService`, store `BehaviorSubject`/`localStorage`). Chaque
      spec documente ce constat en commentaire et substitue au "cas
      d'erreur HTTP" le vrai mode d'échec du service (entrée manquante,
      type d'appareil alterné, erreur remontée par le service en amont,
      entrée `localStorage` vide/effacée) — ce n'est pas du remplissage
      cosmétique, chaque assertion est vérifiable contre le code de
      production correspondant.
    - `ads.service.spec.ts` : couverture complète (`getAll`,
      `getPublishedOne`, `getUnpublishedOne`, `getMostRecentAdsByCategory`,
      `create`, `search`, les 3 listes scoped par appelant), mais
      contenait l'erreur TS2345 ci-dessus.
  - **Correction de l'erreur TS2345.** Vérifié la définition réelle de
    `AdDTO`/`CreateAdDTO` avant de corriger, dans `libs/dtos/src/lib/ads/`
    **et** dans le modèle local dupliqué du webapp
    (`apps/webapp/src/app/shared/models/ads.model.ts` — porte lui-même un
    `// TODO find a way to factorize DTO`, dette déjà connue, non traitée
    ici) : dans les deux, `AdDTO.country` est un `string` (code pays) et
    `CreateAdDTO.country` un objet pays complet (`CountryDTO` /
    `CountryDetailedDTO`) — une différence de type volontaire, pas une
    coquille. Le test construisait un fixture `AdDTO` via
    `buildAd({ id: '3', ...payload })` où `payload: CreateAdDTO`, ce qui
    ne type-check pas même si `payload` ne renseigne jamais `country` à
    l'exécution. Corrigé en castant le spread en
    `Omit<CreateAdDTO, 'country'>`, sans affaiblir le typage de `AdDTO`
    ni de l'utilitaire `buildAd`.
  - **Résultat mesuré** : avant correction, `nx test webapp` : 37 suites
    vertes / 1 échec, 71 tests verts. Après correction : **38 suites
    vertes, 87 tests verts** (0 échec). `nx run-many --target=test --all
    --skip-nx-cache` (les 6 projets : `dtos` sans tests, `api-domain` 41
    tests, `api-adapters` 28, `admin` 26 dont 1 skip, `webapp` 87, `api`
    130) est intégralement vert.
  - Aucun fichier de production modifié — phase strictement additive,
    conforme au critère d'acceptation ci-dessous.
  - Soumis à `senior-dev` en séquence après ces commits (jamais en
    parallèle) pour challenger la réalité de la couverture. **Verdict :
    validé, sans réserve bloquante** — revue complète dans
    `CHANTIER-MODERNISATION-REVIEW-PHASE3.md`. Point non bloquant relevé
    par la revue et tracé en §7 point 12 : `UserSettingsService.reset()`
    ne resynchronise pas l'état en mémoire, et le test Phase 3 associé ne
    verrouille pas explicitement ce comportement.

- **Objectif** : un test par service dans `apps/webapp/src/app/shared/services/*.ts` (8 fichiers, §1.3 point 10), avant tout refactor futur de cette couche.
- **Fichiers touchés** : uniquement des `*.spec.ts` nouveaux.
- **Principe appliqué** : principe 1 (§3), transposé au front.
- **Tests** : c'est la phase elle-même.
- **Charge estimée** : S (8 fichiers de service, pattern répétitif — appel
  HTTP mocké, assertions sur URL/méthode/payload).
- **Risque** : faible — additif, aucun fichier de production modifié.
- **Critère d'acceptation** : chaque fichier de `shared/services/*.ts` a au
  moins un `.spec.ts` couvrant le cas de succès et un cas d'erreur HTTP.
- **Rollback** : trivial, suppression des specs ajoutées sans impact sur le
  code de production.
- **Dépendances** : aucune, indépendante des phases API.

### Phase 4 — Store admin : nettoyer, pas remplacer (révisée après revue senior — décision en §8)

- **Statut (2026-09-24) : 4a terminée et committée** (4 commits sur
  `chantier/modernisation`, entre `b15fecb` et `ccb9896`). Détail :
  - Écart constaté par rapport à ce document en démarrant l'exécution :
    la "couverture indirecte actuelle via `PublicationsComponent`"
    mentionnée plus bas n'existe pas — `PublicationsComponent` n'a
    **aucun** `.spec.ts`, donc `PublicationsStore`/`PublicationsEffects`
    partaient d'une couverture zéro, pas seulement indirecte. Corrigé
    ici, sans remettre en cause le périmètre 4a lui-même.
  - Test de caractérisation de `handleActionResult` écrit et vert
    **avant** tout nettoyage (`publications.effects.spec.ts`, commit
    `b15fecb`) : confirme le comportement décrit dans le commentaire du
    code — approve recharge uniquement "unpublished", reject recharge
    "unpublished"+"archived", archive recharge les trois listes, un
    échec ne recharge rien.
  - Les trois `console.log` de debug retirés (commit `c0bcf21`) :
    `PublicationsEffects.start()` ("Init effects"),
    `PublicationsStore.dispatch()` ("Dispatch ..."),
    `PublicationsStoreModule.forRoot()` ("Load PublicationsStoreModule").
    Le `console.error` de `loadPage()` est conservé (erreur réelle, pas
    du bruit de debug).
  - Specs dédiées ajoutées (commit `34444c4`) : `publications.store.spec.ts`
    (nouveau) et extension de `publications.effects.spec.ts` (effets de
    chargement unpublished/published/archived, cas succès et échec).
    Couverture admin passée de 9 à 25 tests passants (+16), zéro
    régression sur les 6 projets (`nx run-many --target=test --all`
    vert avant et après, mêmes chiffres api/api-domain/api-adapters/
    webapp qu'à la baseline).
  - Commentaire ajouté dans `store/utils.ts` (commit `ccb9896`)
    documentant que le pattern maison est un choix assumé (renvoi §4/§8),
    pas un oubli.
  - **4b reste gelée**, non engagée — inchangé par cette exécution.
  - **Revue `senior-dev` : validée, sans réserve bloquante** (2026-09-24).
    Revue complète dans `CHANTIER-MODERNISATION-REVIEW-PHASE4A.md`
    (fichier dédié, jamais une édition de ce document). Vérifications
    indépendantes confirmées : le test de caractérisation verrouille la
    branche réelle du code (pas seulement le commentaire) ; le retrait
    des `console.log` n'a aucun effet de bord ; les nouvelles specs
    testent un comportement réel (le test `BehaviorSubject` échouerait
    si le sujet était rétrogradé en `Subject`, le test de resouscription
    après échec exerce directement le risque RxJS documenté par le
    commentaire sur `catchError`) ; l'écart "couverture zéro vs.
    indirecte" est confirmé réel, documenter plutôt que bloquer était le
    bon choix. Deux suggestions non bloquantes pour un futur passage sur
    ce code : couvrir aussi les chemins d'échec de reject/archive dans le
    test de caractérisation, et vérifier les payloads (page/pageSize) des
    actions redispatchées, pas seulement leur type. **Phase 4a considérée
    terminée.**
- **Décision du Tech Lead (2026-09-24, après revue senior)** : la version
  précédente de cette phase visait un remplacement complet du store maison
  par `@ngrx/store`/`@ngrx/effects` ou `@ngrx/signals`, au nom du principe
  6 (§3). La revue senior a vérifié qu'**un seul composant**
  (`PublicationsComponent`) touche le système de store dans tout
  `apps/admin`, et qu'il ne consomme même pas `PublicationsStore`
  directement mais exclusivement deux façades minces déjà en place
  (`PublicationsState`, `PublicationsActions`). Le seul défaut concret
  relevé est cosmétique/hygiène (`console.log` de debug oubliés, pas de
  DevTools, pas de sélecteurs mémoïsés) — **aucun bug fonctionnel
  constaté**. **J'accepte l'argument** : un ROI justifié uniquement par un
  principe général, face à un blast radius réel plus petit qu'anticipé
  mais un risque qui reste concentré sur un flux utilisateur visible en
  continu, ne suffit pas à motiver une réécriture complète aujourd'hui.
  Discussion complète en §8.
- **Objectif révisé, en deux temps** :
  - **4a — Nettoyage (scope obligatoire de cette phase)** : retirer les
    `console.log('Dispatch ...')`/`console.log('Init effects')` du code de
    production ; ajouter les specs manquantes sur `PublicationsStore`/
    `PublicationsEffects` (au-delà de la couverture indirecte actuelle via
    `PublicationsComponent`) ; documenter en commentaire que le pattern
    maison (`Subject`/`BehaviorSubject`, `dispatch()`/`ofType()` réécrits
    dans `store/utils.ts`) est un choix assumé et pourquoi, pour qu'une
    session future ne le redécouvre pas comme un problème non documenté.
  - **4b — Bascule complète vers `@ngrx/store`/`@ngrx/signals` (optionnelle,
    non engagée dans ce chantier)** : ne démarre que si l'utilisateur
    indique une raison explicite **hors ROI pur** (standard d'équipe,
    recrutement, dette perçue à un niveau organisationnel — voir §7,
    nouvelle question). Si déclenchée, reprend telle quelle la description
    originale : spike de décision `@ngrx/store` vs. `@ngrx/signals`, avec
    la contrainte de préserver l'API publique de `PublicationsState`/
    `PublicationsActions` (mêmes noms de méthode, mêmes types
    d'observable exposés) pour que `publications.component.ts` et son
    template n'aient rien à changer. Déclencheur naturel sans validation
    supplémentaire : l'apparition d'un **second store** dans `admin`,
    moment où la réimplémentation maison commence à coûter plus cher
    qu'une dépendance partagée.
- **Fichiers touchés (4a)** : `apps/admin/src/app/store/publications/*`
  (5 fichiers) uniquement.
- **Principe appliqué** : principe 6 (§3) reste valide en général, mais ne
  s'applique pas mécaniquement ici faute de second usage ou de bug
  fonctionnel démontré — voir §8.
- **Tests** : test de caractérisation de `handleActionResult` écrit
  **avant** 4a (reload sélectif par type d'action — approve ne recharge
  que "unpublished", reject recharge "unpublished"+"archived", archive
  recharge les trois — confirmé par la revue senior comme un comportement
  métier non trivial, justifié par un commentaire explicite dans le code),
  pour que le nettoyage ne le casse pas silencieusement.
- **Charge estimée** : XS-S pour 4a (retrait de logs + tests de
  caractérisation + commentaire). 4b, si un jour déclenchée, reprend
  l'ordre de grandeur M-L déjà implicite dans la version précédente de ce
  document (spike + réécriture + tests de non-régression sur un flux
  utilisateur visible en continu).
- **Risque** : faible pour 4a (pas de changement de comportement). 4b
  resterait la phase la plus risquée fonctionnellement du chantier si elle
  est un jour déclenchée (seule phase touchant un flux utilisateur visible
  en continu) — d'où sa mise en attente plutôt que son abandon pur.
- **Critère d'acceptation (4a)** : zéro `console.log` restant sous
  `apps/admin/src/app/store/publications/` ; `PublicationsStore` et
  `PublicationsEffects` chacun couverts par au moins un test dédié ;
  `handleActionResult` verrouillé par un test de caractérisation explicite
  par type d'action (approve/reject/archive).
- **Rollback** : additif/soustractif simple (retrait de logs, ajout de
  tests, commentaire) — revert du commit précis sans effet de bord, aucune
  implémentation fonctionnelle ne changeant en 4a.
- **Dépendances** : aucune stricte ; peut suivre ou précéder la phase 3.

### Phase 5 — Modernisation idiomatique Angular : `standalone: true`

- **Objectif** : reprendre exactement le plan déjà posé par la session
  précédente (voir annexe, section « 3. Composants `standalone: true` ») —
  ce chantier ne le redéfinit pas, il le confirme et l'ordonnance après les
  phases API/tests ci-dessus, pour bénéficier d'une suite de tests plus
  complète (phases 1 et 3) au moment de vérifier l'absence de régression.
- **Fichiers touchés** : potentiellement les deux apps en totalité (effet
  de propagation NgModule → standalone documenté dans l'annexe).
- **Principe appliqué** : aucun principe SOLID nouveau — c'est une
  modernisation de plateforme, pas un refactor d'architecture métier.
- **Tests** : par lot vérifié (build/lint/test), jamais en un seul commit,
  comme deja fait pour les sweeps `@if`/`@for` et `inject()`. **Ajouté
  après revue senior** : les tests unitaires existants protègent la
  logique interne des composants, pas le câblage (un `import` manquant
  dans les `imports` d'un composant standalone une fois retiré de son
  NgModule, un provider qui n'est plus enregistré au bon niveau) — c'est un
  risque d'intégration que seul un e2e ou une vérification manuelle au
  navigateur détecte de façon fiable. D'où la dépendance forte (pas
  seulement un bénéfice) sur la Phase 1bis ci-dessous.
- **Recommandation ajoutée après revue senior** : scinder en deux
  sous-vagues séquentielles, webapp puis admin (pas les deux en parallèle),
  pour ne pas cumuler deux surfaces de régression d'intégration
  simultanées sans filet e2e complet sur les deux apps à la fois.
- **Obligation ajoutée après le chiffrage/la revue Phase 1bis (2026-09-24,
  voir §4 Phase 1bis)** : la Phase 1bis étant reportée, cette phase
  démarre sans filet e2e automatisé. La "vérification manuelle au
  navigateur systématique par sous-vague" mentionnée en Phase 1bis **doit
  être transformée en checklist écrite concrète (les parcours exacts à
  rejouer à la main, webapp puis admin) au moment où cette Phase 5 est
  réellement engagée** — pas laissée comme intention générale à ce
  stade-ci, où l'écrire serait prématuré.
- **Charge estimée** : L (potentiellement les deux apps en totalité,
  propagation NgModule → standalone) — à re-chiffrer par sous-vague une
  fois la Phase 1bis terminée et le nombre réel de composants/modules
  affectés mesuré (réactiver `@angular-eslint/prefer-standalone` pour
  compter, comme fait pour les 4 règles a11y en annexe).
- **Risque** : élevé sur le câblage inter-modules, faible sur la logique
  interne des composants (déjà couverte par les specs unitaires
  existantes) — la nature du risque est spécifiquement celle qu'un e2e
  détecte et qu'un test unitaire ne détecte pas.
- **Critère d'acceptation (corrigé le 2026-09-24 après revue senior du lot
  pilote — voir `CHANTIER-MODERNISATION-REVIEW-PHASE5-PILOTE.md` point 6)**
  : le libellé original de ce critère (ci-dessous, barré) renvoyait à "les
  scénarios e2e de la Phase 1bis", devenu impossible à satisfaire tel
  qu'écrit depuis le report acté de cette phase (§7.10) — résidu de
  rédaction jamais corrigé quand le statut "engagée" a été ajouté plus bas.
  Le critère réellement en vigueur, par sous-vague (webapp, puis admin) :
  `nx run-many --target={build,lint,test} --all` vert **et** la checklist
  de vérification manuelle au navigateur ci-dessous rejouée (par lot, pas
  composant par composant) sans régression constatée sur les parcours
  qu'elle couvre — sans dépendance à un filet e2e qui n'existe pas.
  ~~et les scénarios e2e de la Phase 1bis passent toujours de façon stable
  après la sous-vague, pas seulement avant.~~
- **Rollback** : par lot vérifié (comme déjà pratiqué pour `@if`/`@for` et
  `inject()`) — revert du lot précis en cas de régression détectée au
  build/lint/test ou par les scénarios e2e, jamais un rollback de toute la
  phase.
- **Dépendances** : **doit** suivre la Phase 1bis (e2e) sauf report
  explicitement acté par l'utilisateur (voir Phase 1bis) ; bénéficie
  également des phases 1 et 3 pour un filet de sécurité unitaire plus
  large.

**Statut (2026-09-24) : engagée.** Le report de la Phase 1bis ayant déjà
été explicitement acté (voir plus haut, "Conséquence actée"), cette phase
démarre sans filet e2e, compensée par la checklist manuelle ci-dessous.
Chiffrage réel exécuté avant tout commit, comme exigé par le mandat.

#### Chiffrage réel (exécuté le 2026-09-24)

`@angular-eslint/prefer-standalone` réactivée temporairement à `'error'`
dans `apps/webapp/eslint.config.mjs` et `apps/admin/eslint.config.mjs`
(même méthode que pour les 4 règles a11y), `nx lint` relancé sur les deux
apps, violations comptées par fichier distinct, puis règle remise à
`'off'` dans les deux fichiers (diff vérifié nul après coup) puisque
l'exécution de cette session ne traite qu'un lot pilote, pas la
sous-vague complète — la remettre à `'error'` maintenant ferait échouer
le lint sur tous les composants encore non convertis.

| App | Composants non-standalone | Fichiers `@NgModule` existants |
|---|---|---|
| `webapp` | **41** | 47 |
| `admin` | **8** | 11 |
| **Total** | **49** | 58 |

Détail par fichier (composants) capturé dans les logs de lint complets
de cette session — liste webapp et admin disponible sur demande, non
dupliquée ici pour ne pas alourdir le document ; les deux tableaux
ci-dessous suffisent pour prioriser.

Confirme le sizing "L" déjà posé : ce n'est pas 4 fichiers comme pour les
règles a11y, ni les ~65/29 fichiers strictement locaux des sweeps
`inject()`/`@if`-`@for` — chaque conversion a un rayon d'effet qui sort du
fichier (son propre module, et potentiellement tout module qui
déclare/importe/exporte le composant).

**Découverte majeure faite pendant ce chiffrage, qui n'était pas anticipée
dans l'annexe** : contrairement aux sweeps `@if`/`@for` et `inject()`, qui
n'ont jamais eu besoin de toucher un fichier de spec existant, convertir
un composant en `standalone: true` **casse son propre `.spec.ts` s'il en a
un**, dès que ce spec utilise le pattern générique Angular
`TestBed.configureTestingModule({ declarations: [XComponent], ... })` —
un composant standalone ne peut plus figurer dans `declarations`, il doit
être déplacé vers `imports`. Vérifié concrètement sur
`loading.component.spec.ts` : le spec s'écrit
`declarations: [LoadingComponent]`, ce qui échouerait au runtime
(`NG0304`-style, "component is standalone") si `LoadingComponent`
devenait `standalone: true` sans que ce fichier soit édité en même temps.

Or **modifier un fichier de spec existant est explicitement gouverné par
`tech-lead.md`/le mandat de cette session** : isolé dans son propre
commit, feu vert `qa-reviewer` requis avant d'être considéré acquis — le
Tech Lead ne l'a pas fait lui-même cette session, seulement signalé.
**Conséquence concrète sur le chiffrage** : la quasi-totalité des 49
composants a un `.spec.ts` propre (voir répartition ci-dessous), donc la
quasi-totalité des conversions de cette phase va nécessiter un aller-retour
`qa-reviewer` sur le fichier de spec touché — ce n'est pas seulement une
question de volume de code, c'est un nouveau point de gouvernance/process
qui doit être budgété dans la charge, en plus du risque de câblage déjà
documenté. Point à soumettre à `senior-dev` avant de considérer la
méthode d'exécution de cette phase validée (voir le rapport de session).

Répartition par présence d'un spec (mesurée en croisant la liste des
violations avec l'existence d'un `<Composant>.spec.ts` adjacent) :

| App | Sans spec (conversion isolée, pas de test touché) | Avec spec (nécessite qa-reviewer avant conversion) |
|---|---|---|
| `webapp` | 13 (dont `spinner.component.ts`, converti ci-dessous) | 28 |
| `admin` | 4 | 4 |

Les composants "sans spec" ne sont pas pour autant tous sans risque —
`ads-previewer.component.ts`/`carousel.component.ts` (wrapper Swiper,
déjà signalé en annexe comme piège pour `@if`/`@for`) et
`picture-uploader.ts`/`stepped-form-field.ts` (module Angular co-localisé
dans le même fichier que le composant) restent dans le lot "sans spec"
mais avec une complexité de câblage propre, à traiter au cas par cas, pas
en sweep automatique.

#### Checklist de vérification manuelle au navigateur — sous-vague webapp

Écrite ici comme l'exige la Phase 1bis avant tout engagement réel de
cette phase. **Non exécutée par le Tech Lead dans cette session** :
au-delà du blocage Auth0 déjà documenté en Phase 1bis (qui bloque de toute
façon les parcours authentifiés ci-dessous), cette session a aussi vérifié
concrètement qu'un screenshot ou même un simple contrôle réseau local
(`curl`) ne fonctionne pas ici — chaque commande Bash de cet environnement
tourne dans son propre bac à sable réseau isolé, un serveur `nx serve`
lancé en tâche de fond dans un appel n'est pas joignable depuis un appel
`curl` suivant (`Connection refused` malgré un serveur qui a réellement
compilé et démarré, confirmé dans les logs). Cette checklist doit donc
être rejouée par un humain (ou un environnement CI/local avec un vrai
navigateur), pas par un agent dans ce sandbox précis — cohérent avec la
limitation Cypress déjà documentée par la skill `run-bella`.

1. **Navigation publique (non connecté)** — `/`, `/annonces`,
   `/annonces/:category/:title/:id` sur une annonce existante,
   `/recherche` (filtre + résultats) : la page se charge, le header, le
   footer, la sidebar/drawer mobile, le spinner de chargement
   (`bella-loading`/`bella-spinner`), le carrousel de la page d'accueil et
   les cartes d'annonce (`ad-card`) s'affichent normalement ; aucune
   erreur dans la console.
2. **Filtre de recherche** — ouvrir le filtre (`search-filter-button` →
   modale `search-filter`), changer un critère, valider : les résultats
   se mettent à jour, la modale se ferme proprement.
3. **Onboarding pays** (`welcome`) — sur une session sans pays choisi,
   `WelcomeGuard` redirige vers `/welcome` ; sélectionner un pays, vérifier
   la redirection vers `/` et que le choix persiste après rechargement.
4. **Connexion** (`login-signup`/`login-signup-link`/`logout-button`,
   `logged-in-callback`) — cliquer "connexion", flux Auth0 (redirection
   externe puis retour sur `/loggedIn`), puis déconnexion : le header
   reflète l'état connecté/déconnecté. **Bloqué par le même manque de
   compte de test Auth0 que la Phase 1bis** — à défaut, un humain avec un
   compte réel doit le rejouer.
5. **Profil connecté** (`account`, `account/profile/create`,
   `account/profile/form`, `settings`) — compléter/modifier un profil,
   changer le pays dans les réglages : formulaires réactifs, validations
   (`field-error`), sélecteurs (`ng-select-form-field`) fonctionnent.
6. **Profil public d'un tiers** (`profil/:id/:username`) — consulter le
   profil d'un autre utilisateur depuis une carte d'annonce ou un lien
   direct : la page se charge (endpoint public, voir §7 point 11).
7. **Poster une annonce** (`post-an-ad`, garanti par `AuthGuard` +
   `CompleteProfileGuard`) — parcourir les étapes du formulaire
   multi-étapes (`ad-form`, `form.component` générique Formly,
   `stepped-form-field` pour la navigation entre étapes,
   `picture-uploader` pour les photos), soumettre jusqu'à `SUBMITTED` :
   c'est exactement le scénario e2e (a) que la Phase 1bis visait déjà —
   même blocage Auth0.
8. **Mes publications / favoris** (`my-publications`, `bookmarks`) —
   lister ses annonces par statut, ajouter/retirer un favori depuis une
   `ad-card` : les listes se rafraîchissent, les boutons d'action
   répondent.
9. **Détail d'annonce** (`ad-detail`, `ad-contacts`,
   `ad-publisher-card`) — depuis une carte, ouvrir le détail : galerie
   d'images (carrousel), bloc contact, carte du vendeur s'affichent ; le
   bouton de contact déclenche l'action attendue.

Seuls les parcours 1–3 et 6 sont rejouables sans compte Auth0 ; 4, 5, 7, 8
nécessitent l'un des deux contournements déjà identifiés en Phase 1bis
(compte de test réel, ou spike OIDC/JWKS local). Le parcours 9 dépend de
données d'annonce existantes en base (fixtures) mais pas d'authentification.

#### Exécution — lot pilote (2026-09-24)

Un seul lot exécuté cette session, délibérément le plus petit et le plus
sûr possible pour valider la mécanique avant d'aller plus loin :

- **`SpinnerComponent` → `standalone: true`** (commit `1fa187c`) —
  candidat choisi précisément parce qu'il n'a **aucun** fichier de spec
  (donc aucune modification de test à faire arbitrer par `qa-reviewer`),
  aucune dépendance de template, un seul consommateur
  (`loading.module.ts`). `spinner.module.ts` supprimé (mort : son seul
  rôle était de ré-exporter le composant) ; `loading.module.ts` importe
  désormais `SpinnerComponent` directement (les `NgModule` peuvent
  importer un composant standalone depuis Angular 14). `LoadingComponent`
  lui-même **volontairement laissé non-standalone** dans ce commit — il a
  un spec propre (`loading.component.spec.ts`, `declarations:
  [LoadingComponent]`) dont la conversion attend `qa-reviewer`.
  Vérifié : `nx lint/build/test webapp` verts, baselines inchangées (39
  problèmes lint : 5 erreurs/34 warnings ; 38/38 suites, 87/87 tests).
  Vérification manuelle au navigateur **non faite** (limitation sandbox
  ci-dessus) — à faire par un humain avant de considérer ce lot
  définitivement acquis, malgré le vert automatisé.

#### Amendements actés après la revue senior du lot pilote (2026-09-24)

Revue indépendante : `CHANTIER-MODERNISATION-REVIEW-PHASE5-PILOTE.md`.
Verdict : **validé avec réserves**, toutes actionnables directement par le
Tech Lead, aucune question produit nouvelle. Quatre amendements actés
ci-dessous, qui remplacent la méthode initialement esquissée plus haut
dans cette section.

1. **Cadence `qa-reviewer` — répond à la question ouverte §7.13** :
   un aller-retour `qa-reviewer` **par composant** pour un changement
   mécaniquement identique (`declarations: [X]` → `imports: [X]`, rien
   d'autre dans le fichier de spec) est disproportionné — le mandat de
   `qa-reviewer` n'exige pas cette granularité, seule la règle §5 exige
   que **chaque commit qui modifie un spec existant reste isolé**, pas
   qu'il déclenche sa propre session de revue. **Décision actée** : un
   commit par composant pour l'édition de spec (rollback fin, cohérent
   avec la pratique déjà en place), mais soumission à `qa-reviewer`
   **groupée par lots de 5 à 10 composants** plutôt qu'un aller-retour
   unitaire — ramène la charge de process de ~32 sessions à ~4-6 sans
   rien perdre sur l'isolement des commits ni sur la rigueur de la revue
   individuelle par fichier. Ceci répond et clôt la question ouverte §7.13
   (l'exécution de la règle de gouvernance §5 pour cette phase) ; §7.7
   (qui fait la revue "en général", au-delà de cette phase précise) reste
   ouverte.
2. **Garde-fou `nx build`/`strictTemplates`/`NG8001` — à vérifier
   empiriquement, pas supposé** : `apps/webapp/tsconfig.json` a
   `strictTemplates: true`, qui active le diagnostic `NG8001` ("is not a
   known element") pour tout élément personnalisé absent des `imports` (ou
   `schemas`) de son unité de compilation — **indépendamment** du schéma
   utilisé par le *spec* du composant (la plupart utilisent
   `NO_ERRORS_SCHEMA` via `apps/webapp/src/testing/testing-support.ts`,
   qui neutralise la détection d'un import manquant *dans le spec*, mais
   ne neutralise rien côté compilation du composant standalone lui-même).
   **Plan de vérification** : sur le premier composant converti qui a à la
   fois un `.spec.ts` et des enfants de template `bella-*` (candidat
   naturel : `header.component.ts`, qui en compose trois —
   `bella-search-filter-button`, `bella-logout-btn`,
   `bella-auth-login-signup`), retirer délibérément une entrée de son
   tableau `imports` standalone, lancer `nx build webapp`, confirmer
   l'échec `NG8001` (ou documenter l'absence d'échec si le test infirme
   l'hypothèse), remettre l'entrée correcte, documenter le résultat ici
   avant de committer. **Résultat (vérifié le 2026-09-24, sur
   `header.component.ts` une fois converti standalone)** : hypothèse
   **confirmée**. `LogoutButtonModule` retiré délibérément du tableau
   `imports` de `HeaderComponent` (`bella-logout-btn` reste dans son
   template) ; `nx build webapp` échoue immédiatement avec :
   `NG8001: 'bella-logout-btn' is not a known element: [...] verify that
   it is included in the '@Component.imports' of this component`,
   pointant exactement la ligne du template en cause. Import remis,
   `nx build webapp` de nouveau vert (résultat lu du cache Nx, hash de
   fichier identique à avant le test). **`nx build webapp` est donc
   confirmé comme un garde-fou anti-câblage réel et bon marché pour cette
   classe précise de bug** (import standalone manquant pour un enfant de
   template), indépendamment de `NO_ERRORS_SCHEMA` côté spec — à traiter
   comme une vérification systématique de chaque lot (déjà dans le
   critère d'acceptation), pas comme une garantie optionnelle. Ça ne
   couvre pas pour autant les classes de risque qu'un diagnostic de
   template ne voit pas (portée d'un provider, injection runtime,
   régression CSS/host-binding, retrait accidentel d'un
   `ModuleWithProviders`/`forRoot()`) — la checklist manuelle reste
   nécessaire pour celles-ci.
3. **Tri par accessibilité à la vérification manuelle — s'ajoute au tri
   sans-spec/avec-spec, ne le remplace pas** : les composants de
   formulaire (`ng-select-form-field`, `field-error`, `picture-uploader`,
   `stepped-form-field`) ne sont utilisés que derrière
   `AuthGuard`/`CompleteProfileGuard` (`post-an-ad`,
   `account/profile/form`, `settings` — vérifié par grep sur
   `app-routing.module.ts` et les `*.module.ts` qui les déclarent) : une
   fois convertis, aucune des trois protections (spec fidèle — voir point
   2 —, e2e, vérification humaine) ne s'applique vraiment tant qu'aucun
   humain avec un compte Auth0 réel ne les a rejoués. **Décision actée** :
   à l'intérieur de chaque groupe sans-spec/avec-spec, prioriser les
   composants **accessibles publiquement** (reachable sans connexion,
   vérifié route par route dans `app-routing.module.ts` : `annonces`,
   `annonces/:category/:title/:id`, `profil/:id/:username` ne portent
   qu'un `WelcomeGuard` ou aucun guard) et traiter en dernier ceux
   **exclusivement derrière Auth0** (`account`, `post-an-ad`,
   `bookmarks`, `my-publications`, `settings` portent `AuthGuard` et/ou
   `CompleteProfileGuard`) — dont la mise en "acquis" définitif reste
   gelée jusqu'à vérification humaine réelle avec un compte Auth0, pas
   seulement jusqu'à build/lint/test verts.
4. **Critère d'acceptation Phase 5 corrigé** : voir plus haut dans cette
   section (résidu de rédaction pointant vers les scénarios e2e Phase 1bis,
   remplacé par un renvoi explicite à la checklist manuelle).

#### Exécution — suite (2026-09-24, session tech-lead post-revue)

**Les 12 composants "sans spec" restants sont tous convertis**, dans
l'ordre public puis Auth0-gated décidé ci-dessus :

- **Publics** (6) : `SearchResultsComponent`, `ProfileComponent`,
  `AdContactsComponent`, `AdsPreviewerComponent`, `SearchFilterComponent`
  + `SearchFilterButtonComponent` (converti en un seul commit, couplés
  par ouverture de modale dynamique).
- **Auth0-gated** (6) : `LoggedInCallbackComponent`,
  `CreateProfileComponent`, `PostAnAdComponent`, puis les trois champs
  Formly `NgSelectFormFieldComponent`/`SteppedFormFieldComponent`/
  `PictureUploaderFormFieldComponent` (un seul commit — trois field
  types ngx-formly 6.3.12 wirés uniquement par
  `FormlyModule.forChild({ types: [...] })`, jamais par sélecteur direct
  dans un template, vérifié par grep ; ngx-formly instancie les
  composants standalone dynamiquement sans avoir besoin qu'ils soient
  déclarés dans un `NgModule`).

Chaque commit vérifié `nx lint/build/test webapp` vert, baselines
inchangées (39 problèmes lint/5 erreurs, 38/38 suites, 87/87 tests). Les
trois derniers (formulaires) restent **gelés** au sens de l'amendement 3
ci-dessus : non considérés acquis tant qu'un humain avec un compte Auth0
réel n'a pas rejoué `post-an-ad` et `account/profile/form`.

**Premier lot "avec spec" — en préparation, 7 composants convertis sur
28, PAS encore soumis à `qa-reviewer`** (conformément au mandat : ne pas
soumettre soi-même un lot incomplet) :

1. `LoadingComponent` — public (rendu sur toutes les routes, aucun
   guard). Composant laissé volontairement non-standalone par le pilote,
   converti en premier ici.
2. `HeaderComponent` — public. **Choisi comme candidat de vérification
   du garde-fou `NG8001`** (amendement 2) : import retiré
   délibérément, `nx build webapp` a échoué avec `NG8001` pointant la
   ligne exacte du template, import remis, build revérifié vert.
   **Hypothèse confirmée et documentée ci-dessus** — `nx build webapp`
   est un garde-fou anti-câblage réel pour cette classe de bug.
3. `FooterComponent` + `FooterToolbarActionComponent` — public, un seul
   commit (couplage template direct).
4. `AdCardComponent` — public.
5. `AdPublisherCardComponent` + `CarouselComponent` — public, un seul
   commit (tous deux consommés uniquement par `AdDetailModule`).

Chaque conversion suit le même schéma à deux commits : un commit
production (composant + propagation `NgModule`, jamais bloquant), puis
un commit **séparé et isolé** par fichier de spec édité
(`declarations` → `imports`), explicitement marqué "NOT considéré
acquis" dans son message — conforme à l'amendement 1 (cadence groupée)
et à la règle §5. `nx lint/build/test webapp` vert après chacun,
baselines inchangées.

**Décompte exact des commits de code de cette étape (recompté par `git
log`, pas recopié)** : **21 commits**, entre `bd92ebf` (exclu) et
`34742cf` (exclu) — 9 commits "sans spec" (12 composants) + 5 commits
refactor "avec spec" (7 composants) + 7 commits d'édition de spec isolée
(un par composant "avec spec"). Le rapport de session initial de cette
étape annonçait par erreur "19 commits de code" — un écart purement
arithmétique sans conséquence sur le contenu, repéré et corrigé par la
revue senior indépendante (`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md`)
puis revérifié indépendamment ici par une session tech-lead ultérieure —
même résultat, 21.

#### Revue senior du lot (12 sans-spec + 7 avec-spec) et suites données (2026-09-25)

Revue indépendante : `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md`.
Verdict : **validé avec réserves mineures** — aucun blocage sur le code
livré (12 conversions "sans spec" + 5 commits de code "avec spec"
échantillonnés, propagation `NgModule` vérifiée y compris au-delà du
premier consommateur, garde-fou `nx build`/`NG8001` reproduit
indépendamment deux fois sur deux composants différents, tri par
accessibilité vérifié route par route). Trois amendements demandés,
traités avant de reprendre l'exécution :

1. **Décompte "19 commits" corrigé → 21**, voir ci-dessus.
2. **Flakiness `api:test` découverte hors périmètre Phase 5, à traiter
   avant de considérer `nx run-many --target={build,lint,test} --all`
   vert comme un filet fiable** — voir commit `98d552d`
   (`fix(api): stop api:test flakiness from class-validator
   decorators/resolution`) et §5 (stratégie de tests) pour le détail
   complet du diagnostic revérifié et du correctif. Résumé : la revue
   senior avait diagnostiqué une cause unique (`Reflect.getMetadata is
   not a function`, `reflect-metadata` jamais importé explicitement dans
   `apps/api`) ; en revérifiant ce diagnostic avant de corriger (comme
   l'exige le mandat), cette session a confirmé cette première cause
   **et en a trouvé une seconde, indépendante**, masquée par le même
   message générique NestJS : `class-validator`/`class-transformer` ne
   sont installés que dans le `node_modules` propre à ce worktree, alors
   que `node_modules/@nestjs` est un unique symlink vers le
   `node_modules` partagé de `/home/tanos/bella` — la résolution de
   module par défaut de Node, partant du chemin réel (post-symlink) de
   `@nestjs/common`, ne retombe jamais dans l'arbre de ce worktree. Les
   deux causes ont été corrigées (import explicite +
   `setupFiles`/`moduleNameMapper` dans `apps/api/jest.config.ts`) et la
   disparition de la flakiness vérifiée par 6 exécutions directes de la
   suite complète et 5 exécutions de `nx test api --skip-nx-cache`,
   toutes vertes sans avertissement "Nx detected a flaky task" (present à
   chacune des exécutions précédant le correctif).
3. **Éviter de faire tourner `senior-dev` et `qa-reviewer` en parallèle
   sur le même worktree** — noté, aucune action de code requise ; à
   respecter par l'utilisateur pour l'orchestration des prochaines
   revues.

Le premier lot "avec spec" (7 composants : `LoadingComponent`,
`HeaderComponent`, `FooterComponent`, `FooterToolbarActionComponent`,
`AdCardComponent`, `AdPublisherCardComponent`, `CarouselComponent`) a
depuis reçu le feu vert `qa-reviewer`
(`CHANTIER-MODERNISATION-QA-PHASE5-LOT1.md`, **APPROUVÉ sans réserve**) :
les 7 commits d'édition de spec sont désormais considérés **acquis** au
sens de la règle de gouvernance §5.

#### Deuxième lot "avec spec" (2026-09-25 session tech-lead, post-fix reflect-metadata) — en préparation, 7 composants, PAS encore soumis à `qa-reviewer`

Classification vérifiée par grep sur `app-routing.module.ts` et les
`*.module.ts`/`*.component.ts` consommateurs (pas supposée) avant
conversion :

1. `TitledPageComponent` — public (consommé par `settings`, seul guard
   `WelcomeGuard`, en plus des consommateurs Auth0-gated
   `bookmarks`/`post-an-ad`/`account`/`create-profile`). Aucun provider,
   `titled-page.module.ts` supprimé.
2. `LoginSignupLinkComponent` — public (page `welcome`, aucun guard ;
   consommé aussi par `LoginSignupComponent`). Aucun provider,
   `login-signup-link.module.ts` supprimé.
3. `LoginSignupComponent` — public (`HeaderComponent`/`SidebarComponent`,
   affiché app-wide aux visiteurs anonymes). Étend
   `LoginSignupLinkComponent` (héritage de classe TS, pas de sélecteur
   dans son propre template). Aucun provider, `login-signup.module.ts`
   supprimé.
4. `LogoutButtonComponent` — public (même raisonnement que 3). Aucun
   provider, `logout-button.module.ts` supprimé.
5. `SidebarComponent` — public (importé directement par `AppModule`,
   panneau de navigation mobile app-wide, aucun guard de route). Dépend
   des composants 3 et 4, déjà standalone à ce stade. Aucun provider,
   `sidebar.module.ts` supprimé.
6. `DrawerComponent` — public (rendu directement par le template
   d'`AppComponent`, app-wide). `DrawerService` migré de
   `@Injectable()`/`DrawerModule.forRoot()` (appelé une seule fois, dans
   `app.module.ts`) vers `@Injectable({ providedIn: 'root' })` — même
   précédent que `LoadingService`/`ProfileService` (lot 1, déjà revu et
   accepté par senior-dev), un `forRoot()` appelé une seule fois à la
   racine produit le même singleton qu'un provider tree-shakable.
   `drawer.module.ts` supprimé.
7. `WelcomeComponent` — public (route `welcome`, **aucun guard du
   tout**). `WelcomeService` et `WelcomeGuard` migrés du même schéma
   `forRoot()` unique (`WelcomeModule.forRoot()` dans `app.module.ts`)
   vers `providedIn: 'root'` — même précédent, même raisonnement. Le
   provider de composant existant sur `SettingsComponent` (`providers:
   [WelcomeService]`, lui donnant sa propre instance dédiée) reste
   inchangé et continue de fonctionner à l'identique : Angular DI résout
   toujours le provider le plus proche, indépendamment de `providedIn`.
   `welcome.module.ts` devenu entièrement mort (plus rien à fournir en
   `forRoot()`, et un composant standalone routé directement n'a besoin
   d'aucun `NgModule`) — supprimé, ainsi que son import dans
   `app.module.ts`.

Chaque conversion suit le même schéma à deux commits (production, puis
spec isolé), `nx lint/build/test webapp` vérifié vert après chacun,
baselines inchangées (39 problèmes lint : 5 erreurs/34 warnings ; 38/38
suites, 87/87 tests) — y compris `settings.component.spec.ts`, l'autre
consommateur de `WelcomeService`, revérifié non affecté par la migration
du point 7. `nx build webapp` (garde-fou NG8001) vert après chaque
commit de production.

**Reste à faire pour cette sous-vague (webapp)**, mis à jour après le feu
vert `qa-reviewer` du deuxième lot (voir sous-section suivante) et
l'exécution du troisième lot (voir plus bas) :

1. ~~14 composants "avec spec" restants~~ → ~~8 restants après le
   troisième lot~~ → **0 restant** : le quatrième et dernier lot "avec
   spec" webapp (`FieldErrorComponent`, `UploadComponent`, `FormComponent`,
   `AdFormComponent`, `ProfileFormComponent`, `AccountComponent`,
   `BookmarksComponent`, `MyPublicationsComponent`) a été converti (voir
   sous-section "Quatrième et dernier lot" ci-dessus) — les 8 confirmés
   Auth0-gated route par route, pas supposés. La sous-vague webapp est
   donc **convertie techniquement à 100% (41/41)**, mais **14 composants
   restent GELÉS** (6 du lot "sans spec" initial + 8 de ce dernier lot) au
   sens de l'amendement 3 de la revue du lot pilote : leur mise en
   "acquis" définitif reste gelée jusqu'à vérification humaine réelle au
   navigateur avec un compte Auth0, qui suppose elle-même le blocage
   runtime `class-validator` résolu (voir sous-section dédiée ci-dessous —
   **résolu** depuis la session précédente) — ce fix lève uniquement le
   blocage "serveur qui ne démarre pas", pas le blocage "pas de compte
   Auth0 de test" (§7 point 10, toujours ouvert). **La sous-vague webapp
   n'est donc PAS déclarée "terminée" au sens plein** — uniquement
   "convertie techniquement, vérification humaine en attente" pour sa
   partie gelée, conformément au mandat.

   **Clarification cosmétique demandée par `senior-dev`
   (`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT4-CLOTURE-WEBAPP.md` §5)** :
   "Auth0-gated" dans ce décompte de 14 recouvre en réalité deux notions
   distinctes, jamais distinguées explicitement jusqu'ici — (a) gelé par
   **garde de route** (`AuthGuard`/`CompleteProfileGuard` présent sur la
   route, 13 des 14 composants) et (b) gelé par **dépendance fonctionnelle
   au flot Auth0 lui-même**, sans aucun garde de route : seul
   `LoggedInCallbackComponent` (route `loggedIn`) est dans ce second cas —
   il ne porte aucun `AuthGuard` (vérifié dans `app-routing.module.ts`),
   mais n'a de sens que rejoué via une vraie redirection Auth0, justifié
   explicitement dans le message du commit `df4168b`. Ce n'est pas une
   erreur de classification ni une reclassification : les deux catégories
   partagent la même limitation de vérification (§7 point 10, pas de
   compte de test Auth0 dans ce sandbox) et restent donc gelées ensemble
   au même titre.
2. La sous-vague `admin` (8 composants, 4 sans spec/4 avec spec) —
   **mise à jour** : la condition initialement posée ici ("seulement
   après webapp entièrement close, y compris `qa-reviewer`/`senior-dev`
   du quatrième lot") a été explicitement levée par `senior-dev` dans sa
   revue de clôture de la sous-vague webapp
   (`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT4-CLOTURE-WEBAPP.md` §7,
   verdict "VALIDÉ, sans réserve bloquante", GO explicite pour démarrer
   `admin` sans attendre le passage `qa-reviewer` du quatrième lot
   webapp) — la recommandation "pas les deux apps en parallèle" visait
   le risque de cumuler deux surfaces de régression d'intégration
   **non vérifiées** simultanément, pas de bloquer `admin` tant qu'un
   aller-retour `qa-reviewer` purement administratif sur webapp traîne.
   **`admin` est maintenant convertie techniquement à 100% (8/8)** — voir
   sous-section dédiée plus bas.

La méthode (chiffrage + lot pilote + amendements 1-4) a déjà été soumise
à et validée par `senior-dev` — voir
`CHANTIER-MODERNISATION-REVIEW-PHASE5-PILOTE.md` (méthode) et
`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md` (exécution du lot 1,
validée avec réserves mineures, toutes traitées). Le prochain point de
passage `senior-dev`/`qa-reviewer` est la soumission du troisième lot
"avec spec" ci-dessous (6 composants) — pas encore faite par cette
session (le mandat de cette session est d'exécuter, pas de déclencher la
revue).

#### Deuxième lot "avec spec" — feu vert `qa-reviewer` et revue senior reçus, acquis (2026-09-25)

`CHANTIER-MODERNISATION-QA-PHASE5-LOT2.md` : **APPROUVÉ, sans réserve**,
pour les 7 modifications de `.spec.ts` du deuxième lot
(`TitledPageComponent`, `LoginSignupLinkComponent`, `LoginSignupComponent`,
`LogoutButtonComponent`, `SidebarComponent`, `DrawerComponent`,
`WelcomeComponent`) — chaque diff vérifié strictement mécanique
(`declarations` → `imports`), impact de la migration
`forRoot()` → `providedIn: 'root'` (`DrawerService`/`WelcomeService`/
`WelcomeGuard`) vérifié nul sur tout spec existant (harnais partagé,
`settings.component.spec.ts`, `drawer.service.spec.ts`), suite complète
revérifiée (38/38 suites, 87/87 tests). Les 7 commits d'édition de spec
de ce lot sont désormais **acquis** au sens de la règle de gouvernance §5.

`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2-SUITE.md` (revue `senior-dev`
indépendante, même portée) : **validée avec réserves** — décompte 21
reconfirmé, fix `reflect-metadata`/`api:test` reconfirmé stable (5
exécutions directes supplémentaires, toutes vertes), le deuxième lot
"avec spec" lui-même confirmé propre (échantillon de 4 diffs complets sur
7, portée du singleton `providedIn: 'root'` vérifiée neutre en
production, `nx run-many --target={build,lint,test} --all` vert sur les 6
projets). **Un point bloquant distinct du code livré** : le fix
`98d552d` ne corrige la résolution `class-validator`/`class-transformer`
que pour Jest (`moduleNameMapper`) — le serveur réel
(`node dist/apps/api/main.js`, donc aussi `nx serve api`) plantait
toujours au démarrage dans ce worktree au moment de cette revue,
empêchant toute vérification manuelle des items Auth0-gated. Traité en
premier par la session suivante — voir sous-section dédiée ci-dessous.
La citation trompeuse des commits `ab693f6`/`1d0defe` signalée par
`qa-reviewer` a également été confirmée par cette revue — voir la
sous-section "Correction de citation" ci-dessous.

Les deux documents étaient untracked dans ce worktree (produits par des
sessions d'agent précédentes) ; ajoutés au suivi git par le commit doc de
cette section.

#### Résolution du blocage runtime `class-validator` (serveur réel) — 2026-09-25

**Contexte** : depuis la Phase 2 sous-point 4 (§4 plus haut) et confirmé
par la revue `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2-SUITE.md` §1.c,
`node dist/apps/api/main.js` (et donc `nx serve api`) plantait
immédiatement (`[Nest] ERROR [PackageLoader] The "class-validator"
package is missing`, `process.exit(1)` dans `loadPackage` d'`@nestjs/common`)
: `class-validator`/`class-transformer` n'étaient installés que dans un
overlay local à ce worktree (4 paquets réels ajoutés manuellement),
jamais dans l'arbre `node_modules` partagé vers lequel pointait le
symlink unique `node_modules/@nestjs` — la résolution Node, partant du
chemin réel (post-symlink) d'`@nestjs/common`, ne retombait jamais dans
l'overlay local. Ce blocage empêchait toute vérification manuelle réelle
des composants Auth0-gated encore gelés en Phase 5, et l'usage du skill
`run-bella` dans ce worktree.

**Fix tenté et exécuté cette session** : le fix propre identifié depuis
la Phase 2 mais jamais exécuté par prudence sur le temps/la charge
réseau — un vrai `yarn install`, scopé à ce worktree uniquement (jamais
de `yarn add`/`install` dans `/home/tanos/bella` ni dans un autre
worktree, aucune écriture dans l'arbre partagé).

1. Réseau vérifié accessible avant tout install complet (`curl` ciblé
   vers `registry.yarnpkg.com`, `HTTP 200`), conformément au mandat de
   prudence.
2. Deux premières tentatives d'installation ont échoué avec le message
   trompeur de yarn classic `"You don't appear to have an internet
   connection"` : la cause réelle était un cache local corrompu
   (`/tmp/.../.yarn-cache-1000/.../npm-@rspack-binding-darwin-x64-1.6.8-.../`
   — une extraction incomplète d'un paquet binaire optionnel pour une
   plateforme non pertinente ici, macOS Intel, alors que ce worktree
   tourne sous Linux x64) et non un problème réseau : un `curl` direct du
   même fichier a réussi instantanément (18.5 Mo). Cache corrompu purgé,
   puis `node_modules` existant (mélange de 917 symlinks vers l'arbre
   partagé + 4 paquets réels de l'overlay) entièrement supprimé — sûr,
   `node_modules` est dans `.gitignore` de ce worktree, confirmé par
   `git check-ignore -v` avant suppression — et un install complet
   propre relancé.
3. **Install complet réussi en ~53s**, aucune écriture dans l'arbre
   partagé (`git -C /home/tanos/bella status --short` revérifié inchangé
   par cette opération). `node_modules` de ce worktree contient désormais
   **0 symlink** (contre 917 avant) — chaque worktree Nx a maintenant son
   propre arbre `node_modules` réel pour ce worktree, comme visé depuis
   la Phase 2. `yarn.lock` régénéré (29 lignes ajoutées, incluant enfin
   `class-validator`/`class-transformer` et leurs dépendances — non fait
   lors de leur ajout initial en Phase 2, comme documenté à l'époque).

**Vérification** (pas seulement `nx build`/`nx test`, qui ne font que
compiler — exactement la limite pointée par la revue senior) :
- `node dist/apps/api/main.js` lancé en arrière-plan, logs surveillés,
  process tué proprement après vérification (rien laissé tournant) : le
  serveur **démarre sans planter**, progresse à travers toute
  l'initialisation Nest (`MyConfigModule`, `PassportModule`,
  `DatabaseModule`, `MongooseModule`, `HttpModule`, `AppModule`,
  `ConfigModule` ×3, `TerminusModule`, `InfrastructureModule`) — aucune
  trace de l'erreur `PackageLoader`/`class-validator`. Le process reste
  ensuite en attente (connexion Mongo avec une URI `undefined`, aucun
  `.env` dans ce worktree — comportement attendu et hors périmètre de ce
  fix, pas un nouveau problème).
- `nx build api` : vert (`webpack compiled successfully`).
- `nx run-many --target={build,lint,test} --all` (les 6 projets) :
  **vert, baselines identiques à celles documentées précédemment** —
  `api` 21/21 suites 130/130 tests, `api-domain` 6/41, `api-adapters`
  5/28, `webapp` 38/87, `admin` 7/26 (1 skip) ; lint `api` 120
  warnings/0 erreur, `webapp` 39 problèmes (5 erreurs/34 avertissements),
  `admin` 13 problèmes (3 erreurs/10 avertissements) — tous identiques
  aux chiffres de référence déjà documentés, aucune régression introduite
  par l'install. `admin:build:production` a d'abord échoué sur
  `fonts.googleapis.com` bloqué par le bac à sable de cette session
  (artefact déjà documenté dans les revues précédentes, pas une
  régression), vert une fois le domaine autorisé pour la commande.

**Statut : résolu.** Le serveur réel démarre désormais dans ce worktree.
La limite précédemment documentée en Phase 2 (« deux choses non
committées dans git : l'overlay local et `NODE_PATH` ») n'existe plus —
il n'y a plus d'overlay ni de `NODE_PATH` à positionner, juste un
`node_modules` réel et complet issu d'un `yarn install` standard.
**Reste ouvert / à surveiller pour la suite** : `node_modules` restant
hors git (normal, `.gitignore`), toute session future qui supprimerait ce
`node_modules` (ou tout worktree recréé à neuf) devra refaire ce même
`yarn install` — ce n'est plus un contournement fragile, c'est
l'opération standard désormais possible. Les items Auth0-gated encore
gelés en Phase 5 (§4) restent gelés pour une autre raison, indépendante :
il manque toujours un compte de test Auth0 fonctionnel dans ce sandbox
(§7 point 10) — ce fix lève le blocage "serveur qui ne démarre pas", pas
le blocage "pas de compte Auth0 de test".

#### Correction de citation — commits `ab693f6`/`1d0defe` (2026-09-25)

Signalé par `qa-reviewer` (`CHANTIER-MODERNISATION-QA-PHASE5-LOT2.md`,
« Remarque non bloquante sur la citation de précédent ») et confirmé
indépendamment par `senior-dev`
(`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2-SUITE.md` §4) : les messages
des commits `ab693f6` (`DrawerComponent standalone: true`) et `1d0defe`
(`WelcomeComponent standalone: true`) citent
`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md §1` comme précédent « déjà
revu et accepté » pour le pattern `forRoot()` → `providedIn: 'root'`
appliqué à `DrawerService`, `WelcomeService` et `WelcomeGuard`. C'est
inexact : ce §1 couvre exclusivement `ProfileService` et `LoadingService`
(lot précédent) — `DrawerService`/`WelcomeService`/`WelcomeGuard` n'y
sont pas mentionnés, et n'avaient été vérifiés par personne avant la
session QA du deuxième lot.

**Conformément au mandat (jamais réécrire l'historique git existant),
cette correction est consignée ici plutôt que par un amend/rebase** :
- Le résultat technique cité par ces deux commits est correct — vérifié
  indépendamment à la fois par `qa-reviewer` (impact nul sur tout spec
  existant) et par `senior-dev` (portée du singleton `providedIn: 'root'`
  vérifiée neutre en production par lecture des points d'appel réels,
  pas par analogie). Ce n'est donc pas un problème de fond sur le code
  livré.
- C'est une pratique de citation à corriger : un message de commit ne
  doit pas s'attribuer une couverture de revue qu'il n'avait pas encore
  reçue au moment où il a été écrit, même quand la conclusion se révèle
  juste après coup. La couverture réelle de `DrawerService`/
  `WelcomeService`/`WelcomeGuard` date de la session QA du deuxième lot
  (`CHANTIER-MODERNISATION-QA-PHASE5-LOT2.md`) et de la revue senior qui
  l'a suivie (`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2-SUITE.md` §3),
  pas du §1 de `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md` cité à tort
  par ces deux messages.

#### Troisième lot "avec spec" (2026-09-25, session tech-lead post-fix runtime) — 6 composants, APPROUVÉ SANS RÉSERVE par qa-reviewer, validé sans réserve par senior-dev

Classification vérifiée par lecture directe de `app-routing.module.ts`,
`main-routing.module.ts` et des `*.module.ts` consommateurs (pas
supposée) avant conversion — les 6 candidats identifiés par la session
précédente comme "probablement publics" (voir "reste à faire" ci-dessus)
ont bien été vérifiés route par route, pas traités comme acquis
d'office :

1. `HomeComponent` — public (route enfant de `annonces`, dont le seul
   guard parent est `WelcomeGuard`, onboarding, pas Auth0 — vérifié dans
   `app-routing.module.ts`/`main-routing.module.ts`). `HomeService`
   déplacé de `HomeModule.providers` (portée module, un seul consommateur)
   vers `providers: [HomeService]` sur le composant lui-même — **pas**
   `providedIn: 'root'`, contrairement au précédent Loading/Profile/
   Drawer/Welcome : `HomeService` n'a jamais été enregistré via un
   `forRoot()` explicite, juste un `@Injectable()` nu porté par un module
   à portée normale ; le déplacer vers le composant (son unique
   consommateur) préserve exactement la même portée d'injecteur qu'avant
   (un seul consommateur déclaré par `HomeModule`), sans élargir la
   portée à `providedIn: 'root'` par analogie non vérifiée avec un
   pattern différent. `home.module.ts` supprimé (mort : plus rien à
   déclarer ni fournir) ; `main.module.ts` mis à jour (import retiré —
   `HomeComponent` n'a jamais eu besoin d'y figurer, il est routé
   directement par `main-routing.module.ts`, jamais utilisé par sélecteur
   de template dans `MainModule`).
2. `AdsByCategoryComponent` — public (même route parent `annonces`,
   route enfant `:category`). Aucun provider. `ads-by-category.module.ts`
   supprimé (même raisonnement), `main.module.ts` mis à jour.
3. `MainComponent` — public (route `annonces`, `WelcomeGuard` seul sur le
   parent). `HeaderComponent`/`FooterComponent` (déjà standalone, lot 1)
   importés directement sur le composant plutôt que via `MainModule` —
   ils n'y étaient que pour son template. `main.module.ts` perd son
   `declarations` (vide désormais) ; reste en vie comme cible
   `loadChildren` de la route `annonces` (routage inchangé,
   `MainRoutingModule` route toujours `component: MainComponent`
   directement).
4. `AdDetailComponent` — public (route racine
   `annonces/:category/:title/:id`, **aucun guard du tout**, vérifié dans
   `app-routing.module.ts`). `imports`: mêmes composants qu'
   `ad-detail.module.ts` déclarait (`AdContactsComponent`, `TranslatePipe`,
   `HeaderComponent`, `CarouselComponent`, `AdPublisherCardComponent`),
   tous déjà standalone. `ad-detail.module.ts` supprimé — son seul
   consommateur était `main.module.ts`, pour une route commentée dans
   `main-routing.module.ts` (la vraie route vit dans `AppRoutingModule`
   racine et référence `AdDetailComponent` directement, sans jamais avoir
   eu besoin du module).
5. `SettingsComponent` — public (route `settings`, `canLoad: [WelcomeGuard]`
   seul, déjà vérifié au chiffrage §4). Son `providers: [WelcomeService]`
   au niveau composant (donnant sa propre instance dédiée, distincte du
   singleton `providedIn: 'root'` depuis le lot 2) reste inchangé — un
   provider de composant est toujours le plus proche dans l'arbre de DI,
   standalone ou non. `settings.module.ts` conservé en vie (cible
   `loadChildren` de la route `settings`, toujours nécessaire pour le
   lazy loading) mais réduit à `imports: [SettingsRoutingModule]` —
   `CommonModule`/`TitledPageComponent`/`HttpClientModule` n'y étaient
   que pour déclarer `SettingsComponent`, et `HttpClientModule` était de
   toute façon déjà redondant avec celui importé à la racine
   (`app.module.ts`).
6. `AppComponent` — public par construction (composant racine/bootstrap,
   rendu pour tout visiteur quel que soit son état d'authentification).
   `imports: [RouterOutlet, DrawerComponent, SidebarComponent,
   LoadingComponent]` — les trois mêmes composants que `app.module.ts`
   importait déjà juste pour le template d'`AppComponent` (tous déjà
   standalone), plus `RouterOutlet` (première utilisation d'une directive
   standalone du routeur dans ce codebase, nécessaire pour le
   `<router-outlet>` nu du template). `app.module.ts` perd son
   `declarations: [AppComponent]` (un composant standalone peut rester
   l'entrée `bootstrap` d'un module NgModule sans y être déclaré — les
   deux sont indépendants) ; `bootstrap: [AppComponent]` inchangé.

Chaque conversion suit le même schéma à deux commits (production, puis
spec isolé) déjà utilisé pour les lots précédents, `nx lint/build/test
webapp` vérifié vert après **chaque** commit de production (pas
seulement à la fin du lot), baselines inchangées (39 problèmes lint : 5
erreurs/34 avertissements ; 38/38 suites, 87/87 tests) à chaque étape.
`nx run-many --target=test --all` (6 projets) revérifié vert en fin de
lot, toutes baselines identiques.

**12 commits de code** (6 paires refactor+spec), entre `97cb77c` (exclu,
doc qui clôt le lot précédent) et `d98445c` (inclus) :
`c06761c`/`538e961` (Home), `ea174c9`/`5e129b5` (AdsByCategory),
`20c67ea`/`afcee3c` (Main), `06a5e23`/`6d0f439` (AdDetail),
`091c045`/`a13bfc9` (Settings), `3c80c2c`/`d98445c` (App).

**Statut : lot complet (6/6), acquis.** `CHANTIER-MODERNISATION-QA-PHASE5-LOT3.md`
(`qa-reviewer`) : **APPROUVÉ SANS RÉSERVE** pour les 6 commits d'édition de
spec de ce lot — tous strictement mécaniques
(`declarations`→`imports`), aucune assertion supprimée/affaiblie, le point
`HomeService` (provider component-level) vérifié indépendamment et confirmé
sans impact (aucun consommateur tiers du service). Les 6 commits de spec de
ce lot sont donc **acquis** au sens de la règle de gouvernance §5.
`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT3.md` (`senior-dev`) : **validée
sans réserve** — resolution du blocage runtime `class-validator` revérifiée
empiriquement de zéro (serveur réel démarré et observé, `node_modules`
confirmé sans symlink, arbre partagé `/home/tanos/bella` confirmé non
touché), citation `ab693f6`/`1d0defe` confirmée corrigée, échantillon de 4
diffs de production sur 6 (dont `AppComponent` et `HomeService`, les deux
points signalés comme sensibles) confirmé propre,
`nx run-many --target={build,lint,test} --all` revérifié vert.

*(Correction apportée ici, 2026-09-25, session tech-lead suivante : cette
section affirmait encore "PAS encore soumis à `qa-reviewer`" alors que la
revue avait déjà eu lieu et conclu à une approbation sans réserve —
formulation obsolète relevée par `senior-dev` lui-même en remarque non
bloquante n°2 de `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT3.md`, corrigée
ici sans toucher à l'historique git des commits déjà passés.)*

**Ne pas faire tourner `senior-dev` et `qa-reviewer` en parallèle sur ce
worktree** (risque de collision d'édition déjà documenté,
`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md` §2) — reste valable pour la
suite.

#### Quatrième et dernier lot "avec spec" webapp (2026-09-25, session
tech-lead) — 8 composants, tous confirmés Auth0-gated, PAS encore soumis
à `qa-reviewer`

Clôt la liste des 8 composants "avec spec" restants annoncée par le
troisième lot. Chaque composant reclassifié route par route par lecture
directe de `app-routing.module.ts`, `account-routing.module.ts` et des
`*.module.ts`/`*.component.ts` consommateurs (pas supposé, conformément au
mandat) avant conversion — **les 8 se confirment Auth0-gated**, aucun ne
s'est révélé public contrairement à l'hypothèse initiale :

1. `FieldErrorComponent` — Auth0-gated (seul consommateur :
   `ProfileFormComponent`, reachable seulement via `/account` et
   `/account/profile/form`, `AuthGuard`). Aucun provider, aucun import
   nécessaire (template `@if` seul, ni pipe ni directive structurelle).
   `field-error.module.ts` supprimé (dead).
2. `UploadComponent` — Auth0-gated (seul consommateur :
   `PictureUploaderFormFieldComponent`, déjà standalone, reachable
   uniquement via `/post-an-ad` et `/account/profile/form`). Template sans
   directive/pipe ; `BsModalService` confirmé `providedIn: 'root'` depuis
   ngx-bootstrap 21 (commentaire déjà présent dans
   `testing-support.ts`), donc aucun `ModalModule` nécessaire non plus.
   `upload.module.ts` supprimé (dead).
   **Découverte non triviale, documentée en détail en §7.14** : ce module
   était aussi le seul point de `providers: [UploadService]` en
   production, alors que `UploadService` n'est injecté que par
   `PostAnAdComponent` — un ancêtre de `PictureUploaderFormFieldComponent`
   dans l'arbre de composants, donc hors de portée de tout ce que les
   `imports` de ce dernier peuvent fournir. `PostAnAdComponent.uploadService`
   n'a donc **aucun provider joignable en production, ni avant ni après ce
   commit** — un défaut préexistant, ni introduit ni corrigé ici,
   uniquement mis en lumière par la vérification route par route de ce
   lot. Pas tranché unilatéralement : décision d'architecture hors mandat
   d'une conversion mécanique, remontée en §7.14.

   **CORRECTION (2026-09-25)** : ce diagnostic « préexistant, ni introduit
   ni corrigé ici » est **faux** — voir la correction factuelle complète
   en §7.14. `UploadModule` était importé directement par
   `PostAnAdModule` (même module que `PostAnAdComponent`) avant la Phase
   5 ; c'est le commit `ea0ee06` (`PostAnAdComponent standalone: true`,
   deux commits avant celui-ci) qui a fait disparaître cet import en ne
   vérifiant que les déclarables utilisés par le template, pas les
   providers consommés par la classe. Régression Phase 5 confirmée,
   corrigée (`UploadService` → `providedIn: 'root'`), vérifiée par build
   et par test de caractérisation. §7.14 n'est plus une question ouverte.
3. `FormComponent` — Auth0-gated (seul consommateur :
   `AdFormComponent`, reachable uniquement via `/post-an-ad`).
   **Découverte propre à ce composant** : `FormlyModule.forChild({...})`
   (l'enregistrement des types de champ `stepper`/`picture-uploader`/
   `ng-select`) ne peut pas vivre directement dans les `imports` d'un
   composant standalone — Angular le refuse (`NG2012`, confirmé par un
   échec `nx build` immédiat et explicite dès la première tentative).
   Contourné en isolant ce `.forChild()` dans un `@NgModule` dédié,
   `formly-field-types.module.ts` (renommé depuis `form.module.ts`, dont
   l'autre rôle — déclarer `FormComponent` — est devenu caduc), importé
   directement par `FormComponent` aux côtés de `FormlyModule` (nu, pour
   le sélecteur `<formly-form>` de son propre template, que le module
   `.forChild()` ne réexporte pas puisqu'il ne déclare aucun `exports`).
   `ad-form.module.ts` mis à jour (`FormModule` → `FormComponent`).
4. `AdFormComponent` — Auth0-gated (seul consommateur :
   `PostAnAdComponent`, `/post-an-ad`). `imports: [FormComponent]`.
   `ad-form.module.ts` supprimé (dead) ; `post-an-ad.component.ts` mis à
   jour (`AdFormModule` → `AdFormComponent`).
5. `ProfileFormComponent` — Auth0-gated (deux consommateurs :
   `AccountComponent` et `CreateProfileComponent`, tous deux uniquement
   reachable via `/account`, `AuthGuard`). `imports: [CommonModule,
   ReactiveFormsModule, NgSelectModule, RouterModule, FieldErrorComponent]`.
   `profile-form.module.ts` supprimé (dead, plus aucun consommateur) ;
   `account.module.ts` et `create-profile-component.ts` mis à jour.
6. `AccountComponent` — Auth0-gated (`/account`, `AuthGuard` sur la route
   parente + `CompleteProfileGuard` sur sa propre entrée de route).
   `imports: [CommonModule, RouterModule, TitledPageComponent,
   ProfileFormComponent, LoginSignupComponent, LogoutButtonComponent]`.
   `account.module.ts` réduit à `imports: [AccountRoutingModule]` (même
   schéma que `SettingsModule`/lot 3 : ses autres imports n'existaient que
   pour déclarer `AccountComponent`), reste en vie comme cible
   `loadChildren`.
7. `BookmarksComponent` — Auth0-gated (`/bookmarks`, `AuthGuard` +
   `CompleteProfileGuard` sur la route parente). `imports:
   [TitledPageComponent]`. `bookmarks.module.ts` réduit à `imports:
   [BookmarksRoutingModule]`.
8. `MyPublicationsComponent` — Auth0-gated (`/my-publications`,
   `AuthGuard` + `CompleteProfileGuard`). `imports: [CommonModule,
   AdCardComponent, HeaderComponent, FooterComponent]`.
   `my-publications.module.ts` réduit à `imports:
   [MyPublicationsRoutingModule]`.

**Incident de process ponctuel, sans conséquence sur le contenu livré** :
la conversion d'`AdFormComponent` a d'abord échoué `nx test webapp` après
son commit de production (avant le commit de spec isolé), avec une erreur
Formly distincte du refus habituel "standalone can't be declared" :
`[Formly Error] The type "input" could not be found`. Cause : sous
`NO_ERRORS_SCHEMA`, `<bella-form>` était jusque-là un élément inconnu et
inerte pour ce spec (ni `FormComponent` ni `AdFormModule` n'étaient
visibles du `TestBed`) ; une fois `AdFormComponent` standalone et
important réellement `FormComponent`, l'élément devient résolu et le
`ngOnInit()` d'`AdFormComponent` (jamais exécuté à fond auparavant dans ce
spec) peuple `fields` avec la config Formly réelle, qui exerce pour la
première fois le rendu profond de `<formly-form>` — lequel a besoin des
types de base ngx-formly (`input`/`select`/`textarea`/`multicheckbox`),
fournis en production par `FormlyBootstrapModule` (`app.module.ts`,
racine), absent de `testing-support.ts`. Corrigé en ajoutant
`FormlyBootstrapModule` (dépendance de production déjà existante, pas une
nouveauté) directement dans les `imports` du spec d'`AdFormComponent`
lui-même — même précédent que l'ajout ponctuel de `CountriesService` dans
`profile-form.component.spec.ts`, pas une modification de
`testing-support.ts` partagé. Aucune assertion touchée (`should create`
inchangé). **Commit de spec de ce composant marqué explicitement "NOT
purement mécanique"** dans son propre message, pour une attention
`qa-reviewer` renforcée par rapport au reste du lot, qui lui reste
strictement mécanique.

Chaque conversion suit le même schéma à deux commits (production, puis
spec isolé) que les lots précédents, `nx lint/build/test webapp` vérifié
vert après **chaque** commit de production, baselines inchangées (39
problèmes lint : 5 erreurs/34 avertissements ; 38/38 suites, 87/87 tests)
à chaque étape. `nx run-many --target={build,lint,test} --all` (6 projets)
revérifié vert en fin de lot — `admin:build:production` a de nouveau
affiché l'artefact sandbox `fonts.googleapis.com` déjà documenté dans
toutes les revues précédentes (pas une régression), vert une fois le
domaine autorisé pour la commande.

**16 commits de code** (8 paires refactor+spec), entre `c89ab31` (exclu,
doc qui clôt le lot précédent) et `6697154` (inclus) : `397ef09`/`f42defc`
(FieldError), `55f4d5b`/`aa696a8` (Upload), `865c020`/`252fc0c` (Form),
`8577a96`/`96202c9` (AdForm), `67e5c57`/`e429cd1` (ProfileForm),
`f22c0a1`/`ed64b1a` (Account), `c8a7830`/`f82d7d1` (Bookmarks),
`7ab1e9e`/`6697154` (MyPublications).

**Statut : lot complet (8/8), PAS encore soumis à `qa-reviewer`** —
conformément au mandat, cette session (tech-lead) ne se soumet pas
elle-même à `qa-reviewer` ; ce commit doc ne déclare donc pas les 8
commits d'édition de spec acquis. **Les 8 composants restent GELÉS** au
sens de l'amendement 3 de la revue du lot pilote (§4 plus haut,
"Amendements actés après la revue senior du lot pilote") — leur mise en
"acquis" définitif au niveau produit/UX ne dépend pas seulement du feu
vert `qa-reviewer` sur les specs (requis indépendamment, par la
gouvernance §5, quel que soit le statut gelé) mais d'une vérification
humaine réelle au navigateur avec un compte Auth0 fonctionnel, qui n'a
toujours pas eu lieu dans ce sandbox (§7 point 10, toujours ouvert — le
fix runtime `class-validator` lève le blocage "serveur qui ne démarre
pas", pas le blocage "pas de compte Auth0 de test"). **Prochain point de
passage : soumission de ce quatrième et dernier lot "avec spec" webapp à
`qa-reviewer`** — puis passage devant `senior-dev` pour la clôture
complète de la sous-vague webapp (voir statut global ci-dessous).

#### Sous-vague `admin` (2026-09-25, session tech-lead, après GO explicite
de `senior-dev` — `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT4-CLOTURE-WEBAPP.md`
§7 : "La sous-vague webapp de la Phase 5 peut passer à la sous-vague
`admin`")

**Chiffrage revérifié indépendamment avant tout commit**, comme l'exige
le mandat (rien acquis sans revérification, y compris un chiffre déjà
posé par une session antérieure) : `@angular-eslint/prefer-standalone`
réactivée temporairement à `'error'` dans `apps/admin/eslint.config.mjs`,
`nx lint admin` relancé, violations comptées, règle remise à `'off'`
(diff nul vérifié après coup, même méthode que le chiffrage initial
Phase 5). **8 composants confirmés** — exactement le chiffre du
chiffrage initial (§4 plus haut, "Chiffrage réel"), pas simplement
recopié :

| Composant | Fichier | Spec |
|---|---|---|
| `AppComponent` | `apps/admin/src/app/app.component.ts` | oui |
| `NavbarComponent` | `apps/admin/src/app/shared/components/navbar/navbar.component.ts` | oui |
| `AccessDeniedComponent` | `apps/admin/src/app/pages/access-denied/access-denied.component.ts` | oui |
| `DashboardComponent` | `apps/admin/src/app/pages/dashboard/dashboard.component.ts` | oui |
| `PublicationsComponent` | `apps/admin/src/app/pages/publications/publications.component.ts` | non |
| `PublicationsListComponent` | `apps/admin/src/app/pages/publications/components/list/publications-list.component.ts` | non |
| `ConfirmationDialogComponent` | `apps/admin/src/app/shared/components/confirmation-dialog/confirmation-dialog.component.ts` | non |
| `SidenavComponent` | `apps/admin/src/app/shared/components/sidenav/sidenav.component.ts` | non |

Répartition **4 sans spec / 4 avec spec**, confirmée indépendamment
(présence d'un `.spec.ts` adjacent vérifiée fichier par fichier) —
identique au chiffrage initial.

**Critère de tri revérifié composant par composant, pas supposé**,
conformément au mandat qui demandait explicitement de ne pas assumer que
"public d'abord" n'a pas de sens pour `admin`. Lecture de
`apps/admin/src/app/app.routes.ts` : contrairement à l'hypothèse de
départ ("admin est probablement intégralement derrière Auth0 +
`PermissionsGuard`"), il existe une vraie distinction à trois niveaux,
pas deux :

1. **Coquille applicative, aucun guard du tout** (rendue
   inconditionnellement au bootstrap, avant toute évaluation de garde de
   route — même raisonnement que `AppComponent`/`DrawerComponent`/
   `SidebarComponent` côté webapp, lot 3) : `AppComponent` (composant
   racine) et `NavbarComponent` (enveloppe le `<router-outlet>` dans le
   template d'`AppComponent`, `app.component.html`).
2. **`AuthGuard` seul, sans `PermissionsGuard`** : `AccessDeniedComponent`
   (route `access-denied`) — accessible à tout utilisateur connecté,
   même sans la permission `manage:publications`. C'est exactement la
   distinction que le mandat anticipait comme possible ("une page
   access-denied accessible sans permission complète, vs. le reste du
   dashboard") — confirmée réelle, pas supposée.
3. **`AuthGuard` + `PermissionsGuard` (`manage:publications`)** :
   `DashboardComponent` (route `dashboard`), `PublicationsComponent` et
   `PublicationsListComponent` (route `publications`,
   `PublicationsListComponent` en étant un descendant),
   `ConfirmationDialogComponent` (ouvert uniquement par
   `PublicationsListComponent` via `MatDialog.open()`, jamais par
   sélecteur de template — même portée que son unique consommateur).

**Découverte annexe, non tranchée ici** : `SidenavComponent` n'a **aucun
consommateur vivant** — son seul point d'usage,
`apps/admin/src/app/app.component.html`, est commenté
(`<!-- <bella-sidenav></bella-sidenav> -->`), et `app.module.ts`
l'importait quand même sans que rien ne le rende jamais. Confirmé par
grep exhaustif sur `apps/admin/src`, aucune autre référence. Ce n'est pas
introduit par ce sweep — le commentaire prédate cette session — et n'est
pas corrigé ici (décision produit potentielle : supprimer le composant
mort, ou réactiver le sélecteur commenté — aucune des deux n'est du
ressort d'une conversion mécanique standalone). Signalé pour
information, pas ajouté comme question ouverte formelle en §7 puisque
rien ne bloque : le composant reste tel quel, converti par cohérence
avec le reste du sweep (toujours compté par `nx lint`/
`prefer-standalone`, donc toujours dans le périmètre mécanique de cette
phase), simplement inerte comme avant.

**Ordre d'exécution** : sans-spec d'abord (mandat), triés par
simplicité technique au sein du groupe (aucune distinction
d'accessibilité applicable — les 4 sont soit pleinement gated, soit
`SidenavComponent`, inerte) : `ConfirmationDialogComponent`,
`SidenavComponent`, `PublicationsListComponent`, `PublicationsComponent`
(dans cet ordre, feuille avant parent pour les deux derniers, même
précédent que `FormComponent`→`AdFormComponent` côté webapp lot 4). Puis
avec-spec, triés par le critère d'accessibilité ci-dessus, coquille
d'abord : `NavbarComponent`, `AppComponent`, `AccessDeniedComponent`,
`DashboardComponent`.

**Exécution — 4 composants sans spec, tous convertis, un commit par
composant, acquis** :

1. `ConfirmationDialogComponent` — ouvert uniquement via
   `MatDialog.open()` (jamais par sélecteur direct dans un template,
   même précédent que les modales dynamiques webapp).
   `imports: [CommonModule, MatDialogModule, MatButtonModule]`,
   reproduisant exactement `confirmation-dialog.module.ts`, supprimé
   (mort). `publications-list.module.ts` mis à jour (import retiré,
   n'existait que pour rendre `MatDialogModule` "disponible" — inutile,
   `MatDialog` est `providedIn: 'root'`).
2. `SidenavComponent` — `imports: [RouterModule, MatListModule,
   MatIconModule]`, reproduisant `sidenav.module.ts`, supprimé (mort).
   `app.module.ts` mis à jour (import `SidenavModule` retiré — voir
   découverte "zéro consommateur vivant" ci-dessus).
3. `PublicationsListComponent` — Auth0-gated (tier 3). `imports:
   [CommonModule, MatTableModule, MatButtonModule, MatIconModule,
   MatPaginatorModule]`, reproduisant `publications-list.module.ts`,
   supprimé (mort). `publications.module.ts` mis à jour (import
   `PublicationsListComponent` directement, pas via un module — un
   `NgModule` peut importer un composant standalone depuis Angular 14).
4. `PublicationsComponent` — Auth0-gated (tier 3). `imports:
   [CommonModule, MatTabsModule, PublicationsListComponent]`.
   `MatSnackBarModule` retiré (jamais nécessaire au template,
   `MatSnackBar` est `providedIn: 'root'`, même raisonnement que
   `MatDialog`/point 1). `publications.module.ts` réduit à `imports:
   [RouterModule.forChild(routes)]` — même schéma que
   `SettingsModule`/`AccountModule` côté webapp (lots 3/4) : reste en
   vie comme cible `loadChildren` de la route `publications`.

Chaque commit vérifié `nx build/lint/test admin` vert après coup,
baselines inchangées (13 problèmes lint : 3 erreurs/10 avertissements ;
7/7 suites, 25/26 tests + 1 skip préexistant).

**Exécution — 4 composants avec spec, tous convertis (production +
spec isolé, 8 commits), PAS encore soumis à `qa-reviewer`** —
conformément au mandat, cette session (tech-lead) ne se soumet pas
elle-même à `qa-reviewer` :

1. `NavbarComponent` — coquille (tier 1). Module co-localisé dans
   `navbar.component.ts` lui-même (même fichier), pas un
   `navbar.module.ts` séparé — même motif déjà documenté côté webapp
   pour `picture-uploader.ts`/`stepped-form-field.ts`. `imports:
   [CommonModule, RouterModule, MatToolbarModule, MatSidenavModule,
   MatListModule, MatIconModule, MatButtonModule]`, reproduisant
   `NavbarModule`. `app.module.ts` mis à jour (`NavbarComponent` importé
   directement). **Commit de spec marqué "NOT purement mécanique"** :
   `navbar.component.spec.ts` échouait avec `NG0201: No provider found
   for \`ActivatedRoute\`` après le simple renommage
   `declarations`→`imports` — empiriquement identifié : sous l'ancien
   `TestBed` basé sur `declarations`, les `imports` propres de
   `NavbarModule` (dont `RouterModule`) n'entraient jamais dans le
   module de test dynamique, donc `routerLink`/`routerLinkActive`
   restaient des attributs plats inertes, jamais liés à la vraie
   directive `RouterLink`. Devenu standalone, les `imports` du composant
   s'appliquent toujours, `RouterLink` devient réelle et injecte
   `ActivatedRoute`/`Router` — corrigé en ajoutant `RouterTestingModule`
   (déjà un motif établi dans cette app, `app.component.spec.ts`),
   aucune assertion touchée.
2. `AppComponent` — coquille (tier 1). `imports: [RouterOutlet,
   NavbarComponent]`. `app.module.ts` : `declarations: [AppComponent]`
   retiré (`bootstrap: [AppComponent]` inchangé — un composant
   standalone peut rester l'entrée `bootstrap` sans y être déclaré, même
   précédent que webapp) ; import `NavbarComponent` retiré des `imports`
   du module (devenu redondant, `AppComponent` le fournit lui-même
   désormais). Commit de spec purement mécanique (`RouterTestingModule`
   déjà présent avant cette conversion).
3. `AccessDeniedComponent` — tier 2 (`AuthGuard` seul). `imports:
   [CommonModule, MatButtonModule]`, reproduisant
   `access-denied.module.ts`, réduit à `imports:
   [RouterModule.forChild(routes)]`. Commit de spec purement mécanique.
4. `DashboardComponent` — tier 3 (pleinement gated). Aucun `imports`
   nécessaire (template statique, `<p>dashboard works!</p>`, vérifié par
   lecture, pas supposé). `dashboard.module.ts` réduit à `imports:
   [RouterModule.forChild(routes)]`. Commit de spec purement mécanique.

Chaque commit de production vérifié `nx build/lint admin` vert (le
commit de production échoue systématiquement, et volontairement, au
test tant que le commit de spec isolé suivant n'est pas fait — même
séquence que webapp) ; chaque commit de spec revérifié `nx
build/lint/test admin` vert, baselines inchangées (13 problèmes lint : 3
erreurs/10 avertissements ; 7/7 suites, 25/26 tests + 1 skip
préexistant).

**Vérification finale de complétude** : `@angular-eslint/prefer-standalone`
réactivée une dernière fois après les 8 conversions — **0 violation**,
confirmant que les 8 composants comptés au chiffrage sont bien les 8
convertis, aucun oublié. Remise à `'off'`, diff nul revérifié.
`nx run-many --target={build,lint,test} --all` (6 projets) vert,
baselines identiques à celles déjà documentées pour webapp (`api`
21/130, `api-domain` 6/41, `api-adapters` 5/28, `webapp` 39/89 — +1
suite/+2 tests du test de caractérisation §7.14 ci-dessus, `admin`
7/26+1 skip ; lint `api` 120/0, `webapp` 39/5-34, `admin` 13/3-10).

**Statut : sous-vague `admin` convertie techniquement à 100% (8/8)**,
même situation que webapp : tous les composants "avec spec" (4) restent
**GELÉS** au sens de l'amendement 3 de la revue du lot pilote webapp
(même limitation §7 point 10 — pas de compte de test Auth0 dans ce
sandbox — s'applique aux trois tiers, y compris le tier 1 "coquille",
puisque même un visiteur non authentifié ne peut être rejoué sans
navigateur réel dans ce sandbox). Les 4 composants "sans spec" n'ont pas
de spec à faire approuver, mais restent soumis à la même limitation de
vérification humaine au navigateur pour leur statut "acquis" au sens
produit/UX (pas seulement build/lint/test verts). **Mise à jour** : les
4 commits de spec du lot "avec spec" ont été soumis et **APPROUVÉS SANS
RÉSERVE par `qa-reviewer`** (`CHANTIER-MODERNISATION-QA-PHASE5-ADMIN.md`,
traitement renforcé sur `NavbarComponent` — `RouterTestingModule`
confirmé nécessaire, pas un contournement), puis la sous-vague `admin`
et la Phase 5 dans son ensemble (webapp + admin) ont été **VALIDÉES
techniquement sans réserve bloquante par `senior-dev`**
(`CHANTIER-MODERNISATION-REVIEW-PHASE5-CLOTURE-GLOBALE.md`).

**Phase 5 : terminée techniquement (webapp 41/41, admin 8/8, 100% des
composants recensés convertis en `standalone: true`), vérification
humaine au navigateur en attente** pour les composants restés gelés
(14 côté webapp, 4 côté admin) — bloquée par l'absence d'un compte de
test Auth0 fonctionnel dans ce sandbox (§7 point 10). Aucune autre
sous-vague à démarrer sur cette phase. Deux questions restent ouvertes
et correctement non tranchées par les agents : §7.10 (compte de test
Auth0), §7.15 (sort de `SidenavComponent`, code mort antérieur à ce
chantier).

**§7.14 (`UploadService`) n'est plus une question ouverte (2026-09-25,
session tech-lead)** : la classification précédente — « préexistant,
décision produit à trancher » — était une erreur de diagnostic. Preuve :
`post-an-ad.module.ts` importait `UploadModule` directement (même
module que `PostAnAdComponent`) avant la Phase 5 (`git show
8f954a9:...`) ; le commit `ea0ee06` (premier commit Phase 5 à toucher ce
composant) a fait disparaître cet import en ne vérifiant que les
déclarables utilisés par le template, pas les providers consommés par
la classe — c'est une régression Phase 5, pas un bug préexistant.
Corrigée : `UploadService` est maintenant `@Injectable({ providedIn:
'root' })`, vérifiée sans effet sur ses autres usages (il n'y en a pas
d'autre dans l'app) et sans conflit avec `commonTestProviders`. Détail
complet, preuves et vérifications en §7.14.

#### Audit systématique de rattrapage — angle mort `providers:` des modules supprimés (2026-09-25, session tech-lead)

**Déclencheur** : le bug `UploadService` (§7.14) est une classe de bug
structurelle, pas un cas isolé — la méthode utilisée pendant toute la
Phase 5 pour décider quels imports/modules retirer s'appuyait sur un
grep du template HTML, qui ne peut par construction pas voir un
`providers:` consommé par la classe TypeScript (`inject()`/constructeur)
plutôt que par le template. Objet de cet audit : vérifier si ce même
angle mort a touché d'autres composants parmi les 49 convertis
(41 webapp + 8 admin), de façon exhaustive plutôt que par échantillonnage.

**Méthode** : `git log --all --diff-filter=D --name-only -- '**/*.module.ts'`
recoupé avec les 43 commits de conversion Phase 5 (`git log --oneline
--all | grep standalone`) donne **33 fichiers `*.module.ts` distincts
supprimés pendant cette phase** (un 34e, `form-validation.module.ts`,
supprimé par le commit `17e8d94` de migration Angular 15, antérieur à ce
chantier — exclu, hors périmètre). Pour chacun, contenu lu juste avant
suppression (`git show <commit>^:<path>`) et grep sur `providers`. Les 4
composants admin sans `.module.ts` dédié (`NavbarComponent`,
`AppComponent`, `AccessDeniedComponent`, `DashboardComponent` — déclarés
directement dans `AppModule`/le routing, jamais dans un module par
composant) sont structurellement hors du périmètre de ce bug : rien n'a
été supprimé pour eux, donc rien à auditer.

**Résultat exhaustif — 33 modules supprimés** :

- **24 modules sans clé `providers` du tout** (rien à vérifier) :
  `field-error`, `ad-detail`, `login-signup-link`, `login-signup`,
  `ads-previewer`, `ads-by-category`, `titled-page`, `ad-form`,
  `ad-contacts`, `create-profile`, `header`, `ad-card`, `logout-button`,
  `ng-select-form-field`, `search-results`, `sidebar`, `spinner`,
  `ad-publisher-card`, `carousel`, `footer-toolbar-action`, `footer`,
  `search-filter-button`, `search-filter`, `profile-form` (tous webapp).
- **3 modules avec `providers: []` (vide)** — admin : `sidenav.module.ts`,
  `publications-list.module.ts`, `confirmation-dialog.module.ts`. Non
  applicable : aucun service à vérifier.
- **6 modules avec un `providers:` non vide** — le sous-ensemble
  réellement à risque :

  | Module supprimé (commit) | Service(s) | Pattern pré-Phase-5 | Verdict |
  |---|---|---|---|
  | `loading.module.ts` (`3325e8b`) | `LoadingService` | `LoadingModule.forRoot()` importé par `AppModule` (racine) | **OK** — migré `providedIn: 'root'`, déjà vérifié par `qa-reviewer`/`senior-dev` (lot 2), voir « Correction de citation » ci-dessus |
  | `drawer.module.ts` (`ab693f6`) | `DrawerService` | `DrawerModule.forRoot()` importé par `AppModule` (racine) | **OK** — idem, `providedIn: 'root'` |
  | `welcome.module.ts` (`1d0defe`) | `WelcomeService`, `WelcomeGuard` | `WelcomeModule.forRoot()` importé par `AppModule` (racine) | **OK** — idem, les deux `providedIn: 'root'` |
  | `profile.module.ts` (`9c623c3`) | `ProfileService` | `ProfileModule.forRoot()` importé par `AppModule` (racine) | **OK** — idem, `providedIn: 'root'` |
  | `upload.module.ts` (`55f4d5b`) | `UploadService` | `providers:` **direct** (pas `forRoot()`) sur `@NgModule`, hissé par l'import direct de `PostAnAdModule` | **CASSÉ puis CORRIGÉ** — régression introduite par `ea0ee06` (2 commits avant la suppression du module), fixée en `providedIn: 'root'` ; détail complet en §7.14 |
  | `home.module.ts` (`c06761c`) | `HomeService` | `providers:` **direct** (pas `forRoot()`) sur `@NgModule`, hissé par l'import direct de `MainModule` | **OK, mais même topologie à risque qu'`UploadService`** — voir analyse ci-dessous |

  Les 4 premiers utilisaient le pattern `static forRoot(): ModuleWithProviders`
  et étaient importés une seule fois, à la racine (`AppModule`) — c'est
  l'équivalent fonctionnel exact de `providedIn: 'root'` déjà avant la
  Phase 5 (portée globale, singleton), donc la conversion vers
  `providedIn: 'root'` est une transformation neutre, pas une réduction
  de portée. Ce pattern est *intrinsèquement* sûr vis-à-vis de l'angle
  mort décrit en §7.14, parce que `forRoot()` rend le provider visible
  dans le code (pas caché derrière un import de convenance) et parce que
  son unique importeur était déjà la racine.

  Les 2 derniers (`upload.module.ts`, `home.module.ts`) utilisaient au
  contraire le pattern `providers:` **directement dans le `@NgModule`**
  (pas de `forRoot()`) — c'est exactement le cas structurellement
  dangereux : le provider est hissé silencieusement à l'injecteur de
  *tout* module qui importe ce module, y compris par un import qui n'a
  visiblement rien à voir avec ce provider (le grep template ne peut pas
  le détecter). `upload.module.ts` a cassé pour cette raison précise
  (§7.14). `home.module.ts` porte la même topologie de risque : avant la
  Phase 5, `MainModule` importait `HomeModule` directement (`git show
  8f954a9:apps/webapp/src/app/pages/main/main.module.ts`), hissant
  `providers: [HomeService]` à l'injecteur de `MainModule` — mais il **ne
  s'est pas cassé**, parce que le commit `c06761c`
  (`HomeComponent standalone: true`) a, par coïncidence ou par
  prudence délibérée (l'historique ne permet pas de trancher lequel),
  ajouté `providers: [HomeService]` directement sur le composant
  standalone `HomeComponent` lui-même
  (`apps/webapp/src/app/pages/home/home.component.ts`) — qui est l'unique
  consommateur de ce service dans toute l'app (`grep -rln HomeService
  apps/webapp/src` re-vérifié : seuls `home.component.ts` et
  `home.service.ts` lui-même). Un composant standalone qui se fournit son
  propre service à lui-même via ses propres `providers:` est toujours
  résolvable, sans aucune ambiguïté d'ancêtre/descendant — ce n'est donc
  **pas un bug**, mais ce n'est pas non plus une vérification
  systématique : si le composant qui a hérité de cette responsabilité de
  câblage n'avait pas été le bon (ex. si `HomeService` avait eu un second
  consommateur ailleurs dans l'arbre, non descendant de `HomeComponent`),
  le même bug que `UploadService` se serait reproduit silencieusement.

**Conclusion de l'audit** : un seul bug réel trouvé et déjà corrigé
(`UploadService`, §7.14) ; aucun autre cas cassé. `HomeService` a évité
le même sort par un choix de câblage correct fait au moment de la
conversion, pas par une propriété structurelle qui l'aurait protégé — à
noter comme un aléa plutôt que comme une garantie, mais sans action
corrective nécessaire puisqu'il fonctionne bien aujourd'hui, vérifié à
la fois par lecture (unique consommateur) et empiriquement
(`nx build`/`nx test webapp` verts, aucune régression).

**Vérification empirique finale (2026-09-25)** : `npx nx run-many
--target={build,lint,test} --all` relancé sur les 6 projets — build vert
sur `webapp`/`admin`/`api` (aucune erreur de résolution d'injecteur,
aucune régression de bundle) ; lint aux baselines déjà documentées et
inchangées (`webapp` 5 erreurs/34 avertissements, `admin` 3 erreurs/10
avertissements — dette de lint préexistante, sans rapport avec cet
audit, déjà actée dans ce document) ; test vert sur les 6 projets
(`api` 130/130, `api-domain` 41/41, `api-adapters` 28/28, `webapp`
89/89, `admin` 25/26+1 skip préexistant). Aucun commit de correction
supplémentaire nécessaire au-delà du fix `UploadService` déjà en place.

### Phase 6 — Trancher `APPROVED` dans `AdStatus` — RÉSOLUE, sans objet (2026-09-25)

- **Décision utilisateur (§7.2)** : retirer `APPROVED` de l'enum plutôt
  que l'implémenter. Aucun besoin métier connu ne justifie une étape
  d'approbation séparée aujourd'hui ; `APPROVED` était déclaré depuis
  l'origine du projet sans jamais avoir été assigné.
- **Exécution** (session tech-lead, grep exhaustif d'abord) :
  - `libs/api/domain/src/lib/ads/ad.entity.ts` : `APPROVED = 'APPROVED'`
    retiré de l'enum `AdStatus`.
  - `libs/api/domain/src/lib/ads/ads.service.ts` : TODO
    `// Should be APPROVED before PUBLISHED` retiré (devenu sans objet).
  - `libs/dtos` : vérifié — `AdDTO.status` est typé `string` brut, pas de
    redéclaration/réexport d'`AdStatus` ni de type équivalent à ajuster.
  - Front-ends (`apps/webapp`, `apps/admin`), i18n (`src/assets/i18n/`) :
    grep exhaustif, aucune référence à la valeur `'APPROVED'` d'`AdStatus`.
    Seule occurrence textuelle adjacente trouvée :
    `ApprobationEventType.APPROVED` dans
    `apps/admin/.../publications-list.component.ts` — un enum **local et
    distinct**, purement UI (le type de décision de modération dans la
    boîte de dialogue), jamais sérialisé vers/depuis `AdDTO.status` ;
    **non touché**, hors périmètre de cette décision.
  - `apps/api/.../schemas/ad.schema.ts` dérive dynamiquement son
    `enum: Object.keys(AdStatus)` Mongoose — aucune modification requise
    là, la valeur disparaît automatiquement des statuts acceptés en base.
  - Aucun test existant ne référençait `AdStatus.APPROVED` (grep confirmé
    sur `ads.service.spec.ts` et tous les autres specs) : aucune
    modification de test nécessaire, donc aucune soumission `qa-reviewer`
    requise pour ce changement.
- **Impact `libs/dtos`** : nul — le risque "élevé" anticipé ci-dessous ne
  s'est pas matérialisé, `AdDTO.status` n'ayant jamais dépendu de l'enum
  `AdStatus` par un type partagé.
- **Vérification** : `npx nx run-many --target={build,lint,test} --all`
  vert sur les 6 projets ayant un target `test` (`build` vert sur les 3
  apps buildables) après le retrait — en particulier `nx build`
  (TypeScript) n'a signalé aucune référence orpheline à
  `AdStatus.APPROVED`, ce qui aurait été le signal le plus fiable d'un
  oubli. **Correction (revue `senior-dev`, voir ci-dessous)** : `lint`
  tourne en réalité sur 8 projets dans ce monorepo (2 e2e en plus des 6
  ci-dessus) et n'est **pas** intégralement vert : 8 erreurs pré-existantes
  (5 sur `webapp`, 3 sur `admin`, toutes `@typescript-eslint/no-empty-function`/
  `@angular-eslint/no-empty-lifecycle-method`, antérieures à ce chantier)
  plus une casse de config `plugin:cypress/recommended` sur
  `webapp-e2e`/`admin-e2e` (incompatibilité d'outillage, sans rapport avec
  le code) — aucune de ces erreurs n'est liée au retrait d'`APPROVED`, mais
  la formulation "vert" ci-dessus était trompeuse sur le périmètre réel.
- **Revue `senior-dev` (2026-09-25)** : **VALIDÉ, sans réserve bloquante**
  sur le retrait lui-même (grep, `AdDTO.status`, dérivation Mongoose,
  section "Ad lifecycle" de `CLAUDE.md`, tout re-vérifié indépendamment).
  Deux points signalés sans remettre en cause le verdict : le comptage
  lint imprécis du tech-lead (corrigé ci-dessus) et une dette de
  conception préexistante — `AdDTO.status` étant un `string` brut, un
  futur changement des valeurs possibles de `status` côté API ne casserait
  jamais la compilation TypeScript des front-ends, contrairement à ce
  qu'un type partagé garantirait. Détail complet :
  `CHANTIER-MODERNISATION-REVIEW-APPROVED-REMOVAL.md`.
- **Section conservée ci-dessous telle qu'écrite au moment du chiffrage**,
  pour l'historique de la décision et de son scope initialement estimé :

  > **Objectif initial** : décider si `publish()` doit réellement
  > transiter par `APPROVED` avant `PUBLISHED` (le TODO existant), ou si
  > `APPROVED` doit être retiré de l'enum s'il n'a jamais été et ne sera
  > jamais utilisé. C'est une décision produit, pas seulement technique —
  > voir §7.2. Charge estimée : ne peut être chiffrée avant la décision
  > produit — si "oui, l'implémenter" : M-L (nouvelle transition d'état +
  > impact `libs/dtos` + les deux front-ends, voir §6) ; si "non, retirer
  > la valeur" : S (changement d'enum + vérification qu'aucun code mort
  > n'y fait référence). Risque : élevé si "oui" (seule phase de ce plan
  > qui aurait touché `libs/dtos`, donc l'API et les deux front-ends
  > simultanément) ; nul si "non" tant que la valeur n'est jamais émise —
  > confirmé nul à l'exécution.

## 5. Stratégie de tests / non-régression

- **Baseline avant toute phase de refactor (2, 4, 5)** : capturer l'état
  actuel de `nx run-many --target=test --all` (nombre de suites/tests par
  projet) et `nx run-many --target=lint --all` (nombre de problèmes par
  projet) — les chiffres déjà documentés dans l'annexe (ex. lint webapp 39
  problèmes/5 erreurs, lint admin 15/3) servent de référence si encore
  valides, à revérifier en début de chantier plutôt que supposés inchangés.
- **Tests de caractérisation avant refactor** : chaque fichier de
  production touché en phase 2/4/5 a un test qui verrouille son
  comportement *observable actuel* écrit et vert avant le premier commit de
  refactor qui le touche. Ça inclut les comportements qui ressemblent à des
  bugs mais ne sont pas dans le scope du commit (ex. `AdsController`'s
  `getMostRecentAds` mélange aléatoire — le figer avant de le déplacer,
  même s'il finira peut-être par être retiré plus tard).
- **Un commit = un changement de nature.** Un commit de renommage/extraction
  ne doit produire aucune différence de résultat de test ; un commit qui
  change un comportement (ex. Phase 2.4, typage strict des query params)
  est explicitement signalé comme tel et accompagné de nouveaux tests pour
  le nouveau comportement, en plus des tests de non-régression sur
  l'ancien.
- **Build/lint/test des 6 projets concernés vérifiés à chaque étape**,
  comme la discipline déjà en place sur les paliers de version (`api`,
  `api-domain`, `api-adapters`, `dtos`, `webapp`, `admin`) — pas seulement
  l'app modifiée, pour attraper une régression cross-lib (`libs/dtos` est
  partagée par les 3 apps).
- **`nx run-many --target=test --all` vert n'est un filet fiable que si
  chaque projet l'est individuellement de façon stable, pas seulement en
  moyenne** — enseignement du correctif `api:test` ci-dessous : Nx a sa
  propre détection de tâche "flaky" (retry silencieux, avertissement
  seulement affiché après coup) qui peut masquer un vrai échec
  intermittent derrière un run global vert. En cas de doute sur la
  stabilité d'un projet, le revérifier par plusieurs exécutions directes
  de `nx test <projet> --skip-nx-cache` (au moins 5, pas une seule) avant
  de le déclarer acquis comme filet pour une phase suivante.

#### Correctif : flakiness `api:test` (`class-validator`/`reflect-metadata`), 2026-09-25

Découverte hors périmètre par la revue senior de la Phase 5 (lot 2,
`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md`) : deux suites
(`ads.controller.spec.ts`, `ad-search-query.dto.spec.ts`) échouaient de
façon non déterministe en suite complète, avec le message trompeur *"The
class-validator package is missing"* — en réalité avalé par
`@nestjs/common`'s `loadPackage`, qui remplace **toute** exception
survenue pendant `require('class-validator')` par ce même texte
générique, quelle que soit la cause réelle.

Avant de corriger, cette session a revérifié le diagnostic plutôt que de
lui faire confiance (comme l'exige le mandat) : la flakiness a d'abord
été reproduite (8 échecs sur 8 exécutions directes de `jest`, en
isolant les deux suites ou en suite complète, y compris `--runInBand` —
`nx test api` seul la masquait presque totalement via son propre retry
automatique de tâche "flaky", ne laissant qu'un avertissement après
coup). **Deux causes indépendantes ont été trouvées**, toutes deux
réelles, toutes deux corrigées :

1. **`reflect-metadata` jamais importé explicitement dans `apps/api`**
   (diagnostic initial de la revue senior, confirmé) : les décorateurs
   `class-validator`/`class-transformer` d'`AdSearchQueryDTO`
   (`@Type(() => Number)` notamment) appellent
   `Reflect.getMetadata`/`defineMetadata`, qui n'existent qu'une fois le
   polyfill `reflect-metadata` chargé. En production ça « marche » par
   accident : `@nestjs/core/index.js` fait lui-même
   `require('reflect-metadata')` avant que `AppModule` (et donc
   `AdsController`/`AdSearchQueryDTO`) ne soit importé dans
   `main.ts`. Rien ne garantit cet ordre dans un test unitaire isolé, où
   un fichier de spec peut charger `AdSearchQueryDTO` avant que quoi que
   ce soit n'ait transitivement chargé `@nestjs/core` dans le même
   worker Jest. Reproduit précisément : `TypeError: Reflect.getMetadata
   is not a function` au niveau du décorateur `@Type`, en requérant
   `ad-search-query.dto.ts` isolément avant tout correctif.
2. **Deuxième cause, distincte, trouvée en creusant pourquoi le
   correctif du point 1 seul ne suffisait pas** à faire repasser au vert
   `ads.controller.spec.ts`/`ad-search-query.dto.spec.ts` en isolation :
   `class-validator`/`class-transformer` (dépendances réelles du
   `package.json`, ajoutées Phase 2 sous-point 4) ne sont installées que
   dans le `node_modules` propre à ce worktree — `node_modules/@nestjs`
   y est un symlink unique vers le `node_modules` partagé de
   `/home/tanos/bella`. La résolution de module par défaut de Node, en
   partant du chemin **réel** (post-symlink, donc hors de ce worktree) de
   `@nestjs/common` quand `ValidationPipe` fait
   `require('class-validator')`, ne retombe jamais dans l'arbre de ce
   worktree et échoue avec `Cannot find module 'class-validator'` — de
   nouveau avalée par le même message générique. Diagnostiqué en
   interceptant temporairement l'export `loadPackage` d'`@nestjs/common`
   pour laisser remonter l'erreur réelle au lieu de la laisser avalée
   (fichier de test jetable, jamais commité, supprimé aussitôt le
   diagnostic terminé).

**Correctifs, commit isolé `98d552d`** (séparé de la Phase 5 — c'est un
fix `apps/api`, aucun comportement front touché) :
- `apps/api/src/main.ts` : `import 'reflect-metadata';` explicite en
  toute première ligne (robustesse en production, plus un accident
  d'ordre d'import).
- `apps/api/jest.config.ts` : `setupFiles: ['reflect-metadata']` (fixe
  réellement la cause 1 en test — `main.ts` n'est jamais chargé par les
  tests unitaires) et `moduleNameMapper` pointant explicitement
  `class-validator`/`class-transformer` vers leur install réelle dans ce
  worktree (fixe la cause 2, indépendamment de l'emplacement du fichier
  qui les requiert).

**Vérification** (au-delà d'une seule exécution, comme exigé) : 6
exécutions directes de la suite complète (`jest`, hors `nx`) et 5
exécutions de `nx test api --skip-nx-cache` après le correctif, toutes
vertes (21/21 suites, 130/130 tests), **aucun** avertissement "Nx
detected a flaky task" — présent à chacune des exécutions précédant le
correctif alors que le run global restait "vert" grâce au retry
silencieux de Nx. `nx build api` revérifié vert. Aucun autre projet
touché par ce commit.

### Règle de gouvernance — modification d'un test existant (contrainte de process)

**Toute modification d'un test déjà existant (pas l'ajout d'un test
nouveau) doit être validée par une revue QA dédiée avant d'être acceptée,
qu'elle vienne d'un humain ou d'un agent.** Concrètement pour ce
chantier :

- Un commit qui **ajoute** des tests (phases 1, 3, ou les tests de
  caractérisation des phases 2/4/5) ne déclenche pas cette règle.
- Un commit qui **modifie l'assertion, le mock, ou la structure d'un test
  déjà présent dans le repo** (par opposition à un test que ce chantier
  vient d'ajouter lui-même) doit être isolé dans son propre commit, avec
  dans le message la raison précise du changement (le comportement testé a
  changé intentionnellement, ou le test était incorrect dès le départ), et
  attendre une revue QA explicite avant merge — ne jamais faire ce
  changement "en passant" dans un commit plus large.
- Cette règle est **posée ici comme contrainte de process**, son exécution
  (qui fait la revue, sous quelle forme) reste à définir avec l'utilisateur
  avant la première phase qui pourrait la déclencher — probablement la
  phase 2.4 (typage des query params) ou la phase 4 (remplacement du
  store), les deux endroits les plus susceptibles de nécessiter d'ajuster
  un test existant plutôt que d'en ajouter un nouveau.

## 6. Risques et ordre de dépendances entre libs/apps

- **`libs/dtos` est le point de plus haut risque de propagation** — tel que
  documenté par `CLAUDE.md` et confirmé ici : tout changement de forme
  (ex. Phase 2.4 si elle finit par exposer un nouveau DTO de requête)
  impacte l'API **et** les deux front-ends simultanément. Aucune phase de
  ce plan ne touche `libs/dtos` de façon actuellement identifiée. *Phase 6
  a été résolue (2026-09-25) en retirant `APPROVED` de l'enum plutôt qu'en
  l'implémentant, donc sans jamais toucher `libs/dtos` — le risque évoqué
  ici pour cette phase ne s'est pas matérialisé.*
- **Phase 2 avant Phase 5** : retoucher `AdsController`/`AdsRepositoryNest`
  puis, ensuite seulement, convertir les composants en standalone limite le
  risque de devoir refaire deux fois le même travail de vérification sur
  des fichiers qui bougent deux fois.
- **Phase 4 révisée (voir §4/§8) : le risque fonctionnel majeur d'un
  remplacement complet du store admin n'est plus engagé dans ce chantier.**
  Le scope obligatoire (4a, nettoyage) est à risque faible ; seule la
  bascule complète (4b), optionnelle et non déclenchée par défaut,
  resterait la phase la plus risquée fonctionnellement de tout le plan si
  elle est un jour activée — c'est la seule phase qui toucherait un
  comportement utilisateur visible en continu (le tableau de modération).
  Le test de caractérisation de `handleActionResult` (§4, phase 4) n'est
  pas optionnel, y compris pour le scope réduit à 4a.
- **Phase 1bis (e2e) est un prérequis, pas une simple bonne pratique, pour
  les phases 4 et 5** — ajouté après revue senior (voir §8) : sans elle,
  ces deux phases avancent sans aucun filet d'intégration, précisément là
  où un test unitaire ne peut pas voir un problème de câblage.
- **Phase 0bis (NestJS 12) est indépendante de tout le reste** — peut être
  reportée sans bloquer aucune autre phase si son coût s'avère trop élevé
  une fois chiffré.
- **Risque transverse** : ce chantier touche 4 projets Nx différents
  (`api`, `api-domain`, `api-adapters`, `webapp`, `admin`, potentiellement
  `dtos`) sur une période étendue — le risque de dérive de baseline (lint/
  test qui bougent pour des raisons sans rapport avec ce chantier, comme
  déjà vu plusieurs fois dans l'historique de la montée de version) est
  réel. Revérifier la baseline en début de **chaque** phase, pas une seule
  fois en début de chantier.

## 7. Hypothèses et questions ouvertes (validation utilisateur requise)

1. **Le mandat "versions cibles" visait-il une montée de version à
   planifier, ou la confirmation que l'état actuel (déjà à jour) est la
   bonne cible ?** Ce document part de la seconde lecture (§2) — à
   confirmer, car ça change complètement la nature de ce qu'il y avait à
   produire.
2. **`AdStatus.APPROVED` (Phase 6) — RÉPONDUE (2026-09-25).** Question :
   fallait-il l'implémenter réellement (un modérateur "approuve" avant
   qu'un système ou un second modérateur "publie"), ou retirer cette
   valeur de l'enum si elle ne correspond à aucun besoin produit actuel ou
   prévu ? **Décision de l'utilisateur : retirer `APPROVED` de l'enum**
   (recommandation du Tech Lead suivie — la valeur n'était jamais assignée
   et aucun besoin métier connu ne justifie une étape d'approbation
   séparée aujourd'hui). Exécuté : `APPROVED` retiré de `AdStatus`
   (`ad.entity.ts`), TODO obsolète retiré de `publish()`
   (`ads.service.ts`). Grep exhaustif (`libs/`, `apps/api`, `apps/webapp`,
   `apps/admin`, i18n) confirme qu'aucun autre endroit n'y faisait
   référence ; `libs/dtos` n'était pas concerné (`AdDTO.status: string`
   brut, pas de type `AdStatus` partagé) — donc **Phase 6 est désormais
   sans objet** (voir §4, section Phase 6, pour le détail d'exécution).
   Aucun test existant modifié, donc aucune revue `qa-reviewer` en attente
   pour ce point.
3. **`CitiesModule` sans `CitiesController` (§1.3 point 8) — RÉPONDUE
   (2026-09-25, session tech-lead), vérifiée avant toute conclusion, plus
   une question ouverte.** L'utilisateur avait répondu « oui à terminer,
   même si je suis étonné car on charge bien les villes côté front — mais
   sans doute que ça vient avec les countries. À vérifier avant. » Vérifié
   en premier, comme demandé, avant tout changement de code :
   - **Front `webapp`** : deux consommateurs réels appellent
     `CountriesService.getCitiesByCountry(iso2)`
     (`apps/webapp/src/app/shared/services/countries.service.ts:21-23`) —
     le sélecteur « Ville » du formulaire `post-an-ad`
     (`apps/webapp/src/app/pages/post-an-ad/ad-form/ad-form.component.ts:247`,
     champ formly `city`, activé sur le pays sélectionné) et le filtre de
     recherche (`SearchFilterComponent` via `SearchService.countryCities$`,
     `apps/webapp/src/app/shared/services/search.service.ts:71`). Cette
     méthode appelle `GET /countries/:iso2/cities` — **pas** un DTO
     imbriqué : `CountryDTO`/`CountryDetailedDTO`
     (`libs/dtos/src/lib/countries/country-dto.ts`) n'embarquent aucune
     liste de villes, vérifié directement dans leur définition.
   - **Côté API**, cette route existe déjà et est testée :
     `CountriesController.getCities`
     (`apps/api/src/app/api/countries.controller.ts:22-27`) l'implémente en
     injectant `CitiesService` **directement dans le contrôleur
     `countries`** (`private citiesService: CitiesService` au
     constructeur) plutôt que via un contrôleur `cities` séparé.
     `CitiesModule` est enregistré dans `DOMAIN_MODULES`
     (`infrastructure.module.ts`) et exporté jusqu'à `ApiModule`
     précisément pour rendre `CitiesService` injectable là où
     `CountriesController` en a besoin. Grep exhaustif de
     `CitiesController` sur tout le repo (`apps`, `libs`) : zéro résultat,
     confirmé — il n'en a jamais existé.
   - **Conclusion factuelle, tranchant la question** : l'intuition de
     l'utilisateur était juste. `CitiesModule`/`CitiesService`/
     `CitiesRepository` ne sont **pas du code mort** — ils sont
     activement consommés, seulement pas via leur propre contrôleur REST,
     mais via une route sœur sous le préfixe `/countries`
     (`GET /countries/:iso2/cities`), cohérente avec le fait que choisir
     une ville n'a de sens que dans le contexte d'un pays déjà choisi. Un
     `CitiesController` séparé **n'a jamais été nécessaire** : la
     fonctionnalité qu'il aurait exposée existe déjà, sous une forme
     différente mais pleinement fonctionnelle et déjà en production
     côté front. Il n'y a **rien à terminer et rien à retirer** — la
     seule chose obsolète était la formulation de la question elle-même
     (§1.3 point 8 supposait, à tort, que l'absence de `CitiesController`
     signifiait code mort ou fonctionnalité inachevée). **Aucune action de
     code prise dans cette session, aucune n'étant nécessaire.** Le
     sous-point Phase 2 gelé correspondant (§4) est retiré de la liste des
     sous-points en attente — il n'y a plus rien à trancher ni exécuter
     dessus.
   - **Note annexe, hors périmètre de cette question mais trouvée en
     vérifiant** (pas remontée comme nouvelle question ouverte, juste
     notée) : trois méthodes du `CitiesService` domaine (`findOne`,
     `findByName`, `findAll()` non filtré —
     `libs/api/domain/src/lib/cities/cities.service.ts`) ne sont appelées
     nulle part en production ; seule `findByCountryIso2` l'est (via
     `CountriesController.getCities`). Dead code interne mineur au sein
     d'un service par ailleurs bien vivant, candidat à un nettoyage futur
     si souhaité, pas un sujet à trancher maintenant.
4. **`findAllByUserId` (§1.3 point 2) — RÉPONDUE (2026-09-25, session
   tech-lead).** Grep exhaustif re-exécuté cette session (pas recopié du
   résultat de la Phase 2, le code ayant bougé depuis) sur
   `apps/webapp/src`, `apps/admin/src`, `apps/api/src` et `libs/` : zéro
   appelant réel, confirmé à nouveau — les seules occurrences sont la
   déclaration d'interface (`libs/api/domain/src/lib/ads/ads.repository.ts`),
   l'implémentation (`ads-repository-nest.ts`), son propre test, et un mock
   `jest.fn()` dans `ads.service.spec.ts` (bootstrap de mock de repository,
   pas un appel réel). Aucune piste non plus côté historique git : la
   méthode est présente, non implémentée, depuis le tout premier commit
   ayant introduit `apps/api` — rien n'explique son intention d'origine.

   Contrairement à `CitiesModule`, ce n'était pas juste « non appelée » :
   son implémentation levait `throw new Error('Method not implemented.')`
   inconditionnellement — un contrat cassé, pas seulement mort. Sur
   instruction explicite de l'utilisateur (« à terminer »), **implémentée
   plutôt que retirée** (commit `4032458`) :
   `AdsRepositoryNest.findAllByUserId(userId)` interroge désormais Mongo
   directement par `owner` (`{ owner: userId }`), la façon idiomatique de
   filtrer un chemin `ObjectId` de référence Mongoose (Mongoose caste une
   chaîne hex en `ObjectId` automatiquement). Délibérément **pas** une
   délégation vers `AdsService.findAllByOwner`/`AdsRepository.findAll({owner})`
   — cette dernière attend une `UserEntity` complète en paramètre `owner`,
   pas un simple id, et le `userId: string` de la signature de
   `findAllByUserId` ne s'y prête pas sans un aller-retour avec perte
   d'information (`{ id: userId } as UserEntity`). Hypothèse
   d'implémentation documentée directement dans le commentaire de la
   méthode, faute d'intention d'origine récupérable par ailleurs.

   Test de caractérisation existant modifié
   (`ads-repository-nest.spec.ts`, bloc `describe('findAllByUserId', ...)`,
   qui verrouillait auparavant le `throw`) pour verrouiller le nouveau
   comportement à la place — **modification d'un test existant** au sens
   de la gouvernance (§5/`tech-lead.md`) : feu vert `qa-reviewer` **obtenu
   (2026-09-25) — APPROUVÉ**, verdict porté exclusivement sur ce bloc de
   test (commits/diff retrouvés indépendamment, mock Mongoose et
   assertions jugées strictement plus riches que l'ancien `toThrow`,
   cohérentes avec le style établi du fichier ; suites `api-domain`/`api`
   relancées indépendamment, vertes ; seule réserve non bloquante :
   `findAllByUserId` reste sans appelant réel confirmé, question déjà
   actée ci-dessus, pas un défaut du test). Détail complet :
   `CHANTIER-MODERNISATION-QA-FINDALLBYUSERID.md`. `nx build/lint/test
   api` verts après ce commit. Le
   sous-point Phase 2 gelé correspondant (§4) n'a plus lieu d'être formulé
   comme un retrait — l'action a changé de nature (implémentation, pas
   suppression) — retiré de la liste des sous-points en attente de
   retrait ISP.
5. **NestJS 12 (Phase 0bis) — reformulée une seconde fois (2026-09-25),
   après qualification des deux derniers sous-points bloquants.** L'état
   antérieur de cette question (voir §4, revue `senior-dev` du spike Node
   24, verdict **VALIDÉ avec une réserve non bloquante**) laissait deux
   sous-points non qualifiés avant de considérer le palier NestJS 11→12
   "acquis en confiance" : (a) Express 5 (épinglé par
   `@nestjs/platform-express@12.1.0`) jamais testé au runtime réel ; (b) le
   caveat `NODE_OPTIONS`/`run-many` cassant `webapp:test`/`admin:test`.
   **Les deux sont désormais qualifiés** (§4, section "Qualification des
   deux sous-points restés ouverts (2026-09-25)") :
   - (a) résolu par lecture exhaustive du code + 4 tests de
     caractérisation additifs (`ad-search-query.dto.spec.ts`), passés à la
     fois sous la stack actuelle (Express 4.22.3, baseline) et sous
     l'overlay réel NestJS 12/Express 5.2.1 (Node 24.21.0) : aucun des
     breaking changes Express 4→5 documentés n'a d'impact fonctionnel
     différentiel sur la surface d'API actuelle (tous les DTOs/paramètres
     `@Query()` de ce repo sont scalaires — aucune forme imbriquée/tableau
     nulle part) ;
   - (b) résolu par un mécanisme Nx natif — un fichier dotenv scopé
     projet+target, `apps/api/.env.test`, chargé automatiquement par Nx
     pour la seule tâche `api:test` (pas `options.env` dans
     `apps/api/project.json`, qui n'existe pas sur l'executor
     `@nx/jest:jest`) — vérifié empiriquement : `nx run-many --target=test
     --all` fait passer les 6 projets **en une seule commande**, sans
     `NODE_OPTIONS` positionné dans le shell, aussi bien sous l'overlay
     NestJS 12/Express 5/Node 24 que (neutre) sous la stack actuelle.

   La question qui reste réellement ouverte, posée en toutes lettres au
   point 9 de la section Phase 0bis (§4) et **hors mandat
   tech-lead/senior-dev** (question produit/infra, pas une question
   technique) : **adopter Node ≥24.9 comme runtime par défaut du poste de
   dev / CI / déploiement PM2-EC2** (`ecosystem.config.js`,
   `package.json` `engines`, `~/.nvm/alias/default`), pour pouvoir
   effectivement bumper NestJS 11→12 en production. Aucun sous-point
   technique ne bloque plus cette décision — elle reste entièrement à
   arbitrer par l'utilisateur.
6. **`@ngrx/store` classique vs. `@ngrx/signals` (Phase 4)** : à trancher
   par un spike avant de s'engager sur l'un ou l'autre — ce document ne
   prend pas position, faute d'avoir testé les deux sur ce cas précis.
7. **Qui/quoi fait la "revue QA dédiée" pour la modification d'un test
   existant (§5)** — un humain désigné, un second agent avec un rôle
   distinct, un processus de PR avec un tag spécifique ? La contrainte est
   posée, son exécution ne l'est pas encore.
8. **Périmètre exact de "libs/api/domain" et "libs/api/adapters"
   confirmé transitif** : ce document les traite comme pleinement dans le
   périmètre (ils le sont mécaniquement, `apps/api` en dépend), mais à
   confirmer qu'aucune contrainte n'exclut certains de leurs fichiers.
9. **Ajoutée après revue senior — Phase 4b (bascule complète NgRx)** :
   voulez-vous la déclencher malgré l'absence de bug fonctionnel démontré,
   pour une raison explicite hors ROI pur (standard d'équipe, recrutement,
   dette perçue à un niveau organisationnel) ? Sans réponse explicite,
   cette sous-phase reste en attente indéfiniment (voir §4 phase 4 et §8) —
   ce n'est pas un refus, seulement l'absence de déclencheur.
10. **Ajoutée après revue senior — charge de la Phase 1bis (e2e).**
    **Répondue par le chiffrage du 2026-09-24 (voir §4, Phase 1bis,
    "Résultat du chiffrage")** : le chiffrage a été fait concrètement
    avant d'écrire le moindre scénario, comme demandé. Deux des trois
    prérequis (MongoDB local, contournement Cloudinary) sont faisables
    dans cet environnement ; le troisième (compte de test Auth0
    fonctionnel de bout en bout) est bloquant et bloque à lui seul les
    deux scénarios visés — aucun accès réseau au tenant `dev-bata.eu.auth0.com`
    par défaut dans ce sandbox, aucun identifiant de test disponible, et
    un mock complet du SDK Auth0 a été évalué puis écarté (il faudrait
    aussi contourner la vérification JWKS côté API, ce qui reviendrait à
    retirer la frontière de sécurité testée plutôt qu'à la vérifier).
    **Décision actée par le Tech Lead en appliquant la clause de rollback
    déjà posée en §4 : Phase 1bis reportée**, avec la conséquence
    explicitement actée que les phases 4/5 avanceront sans filet
    d'intégration e2e (compensé partiellement pour la phase 5 par une
    vérification manuelle au navigateur systématique par sous-vague).
    **Reste ouvert pour l'utilisateur** : l'arbitrage entre (a) obtenir un
    vrai compte de test Auth0 (hors mandat Tech Lead — dépend de qui gère
    le tenant) et (b) budgéter un spike "OIDC/JWKS local factice" comme
    prochaine tentative, si cette phase est reprise.
11. **Ajoutée 2026-09-24, découverte pendant l'exécution de la Phase 2,
    sous-point 8 (`GET /users/:id`) — RÉSOLUE (2026-09-25).** Ajouter `@UseGuards(JwtAuthGuard)`
    sur `UsersController.findOne` referme la faille d'auth documentée en
    Phase 1, mais casse aussi une fonctionnalité front existante — la page
    de profil public webapp (`profil/:id/:username`, gardée seulement par
    `WelcomeGuard`/onboarding, pas par `AuthGuard`) appelle cet endpoint
    sans JWT via `ProfileService.getProfile` (`apps/webapp/src/app/pages/user/profile/profile.service.ts`),
    endpoint absent de l'`allowedList` d'intercepteur HTTP. Trois options,
    décision produit à trancher : **(a)** accepter la régression et rendre
    la consultation du profil d'un autre utilisateur réservée aux visiteurs
    connectés (nécessite alors aussi d'ajouter la route au front derrière
    `AuthGuard` et l'endpoint à l'`allowedList`, chantier cross-app, pas
    juste un ajout de guard API) ; **(b)** garder l'endpoint public
    (retirer/ne pas ajouter le guard) au motif que le DTO exposé est déjà
    minimal (`UserMapper.modelToProfileDTO` : `id`/`username`/`country`/
    `picture`, jamais l'email) et documenter ce choix comme volontaire
    plutôt que comme une faille ; **(c)** un entre-deux (ex. endpoint public
    mais distinct de celui utilisé pour un usage authentifié, ou limitation
    de champs déjà suffisante jugée acceptable sans guard). **Bloque
    l'exécution définitive du sous-point Phase 2.8** — le Tech Lead ne
    tranche pas seul entre "fermer une faille d'auth" et "casser une page
    publique existante", les deux étant des affirmations produit
    contradictoires tant que la question n'est pas répondue.

    **Décision de l'utilisateur (2026-09-25), tranchée directement, pas
    déduite par le Tech Lead : option (b) — garder l'endpoint `GET
    /users/:id` public, ne pas ajouter `JwtAuthGuard` sur
    `UsersController.findOne`.** Justification actée, celle déjà posée
    dans la question elle-même : le DTO exposé par cet endpoint est déjà
    minimal (`UserMapper.modelToProfileDTO` : `id`/`username`/`country`/
    `picture`, jamais l'email), donc ce n'est pas une faille d'auth non
    traitée mais un choix produit volontaire — l'exposition publique d'un
    profil restreint est acceptée telle quelle, pas une régression à
    corriger. Ce choix est documenté ici comme définitif, à ne pas
    re-ouvrir sans nouvelle décision produit explicite.

    **Exécution : aucun changement de code n'était attendu ni fait.**
    L'endpoint n'a jamais porté de guard (l'ajout était resté « suspendu
    côté code » depuis la découverte de cette question, comme documenté
    ci-dessus et au sous-point Phase 2.8, §4) — vérifié en relisant
    `apps/api/src/app/api/users.controller.ts` avant de conclure quoi que
    ce soit (méthode tech-lead.md) : `findOne` (`GET /:id`) n'a toujours
    aucun `@UseGuards(...)`, contrairement aux cinq autres handlers du
    controller qui en portent tous un. Aucun écart entre le code réel et
    ce que décrit cette question — rien à retirer, rien à ajouter. Le
    sous-point Phase 2.8 correspondant (§4) est donc clos avec le guard
    **non ajouté**, définitivement cette fois (ce n'était plus une
    suspension d'exécution, mais la décision finale) ; voir §4 Phase 2
    pour la clôture détaillée. `CLAUDE.md` (racine du worktree) vérifié :
    sa section « Authorization (issue #49) » ne mentionne pas `GET
    /users/:id` et ne dit donc rien de trompeur sur ce point — pas de mise
    à jour nécessaire.
12. **Ajoutée 2026-09-24, découverte par `senior-dev` pendant la revue de la
    Phase 3 — RÉSOLUE (2026-09-25).** `UserSettingsService.reset()` (`apps/webapp/src/app/shared/services/user-settings.service.ts`)
    ne fait que `window.localStorage.removeItem(...)` — il ne pousse jamais
    `''` sur `this._country$`. Donc après un `reset()`, `getCountry()` et
    `hasCountrySet()` continuent de renvoyer la valeur en mémoire précédente
    jusqu'à un rechargement complet de page. Ce n'est pas hypothétique :
    `settings.component.ts` appelle ce chemin (via `WelcomeService.reset()`)
    depuis une action "changer de pays" visible puis navigue vers `/` sans
    recharger — `WelcomeGuard` risque donc de continuer à traiter
    l'utilisateur comme "déjà connu" dans la même session SPA au lieu de
    relancer l'onboarding. Le test ajouté en Phase 3
    (`user-settings.service.spec.ts`, cas `reset() removes the persisted
    country entry directly`) n'assert aujourd'hui que sur `localStorage`, pas
    sur `getCountry()`/`hasCountrySet()` post-reset — il ne verrouille donc
    pas ce comportement (bug ou choix volontaire, à trancher). Le Tech Lead
    ne tranche pas ici si c'est un bug produit à corriger ou un choix
    délibéré (ex. le rechargement de page qui suit ailleurs dans le flux
    masque le problème en pratique) : question produit, pas technique.
    Renforcer le test lui-même est une **modification d'un test existant**
    (règle §5/tech-lead.md) et nécessite donc son propre commit isolé +
    feu vert `qa-reviewer` avant d'être acceptée — non fait dans cette
    session, volontairement, pour ne pas mélanger ça avec la clôture
    additive de la Phase 3. Détail complet dans
    `CHANTIER-MODERNISATION-REVIEW-PHASE3.md`.

    **Décision de l'utilisateur (2026-09-25), tranchée directement : c'est
    un bug réel à corriger, pas un comportement voulu.** Corrigé :
    `reset()` route désormais par le setter existant `setCountry('')` au
    lieu d'appeler `window.localStorage.removeItem(...)` directement —
    cohérent avec le seul autre chemin d'écriture de `_country$` dans la
    classe (`setCountry`), qui pousse `country || ''` sur le
    `BehaviorSubject` puis laisse la souscription du constructeur
    (persistante, pas seulement au démarrage) répercuter la valeur falsy
    vers `localStorage.removeItem` — le comportement `localStorage` reste
    donc identique à l'ancien code, seule la mise à jour en mémoire
    manquante est ajoutée. Commit `7632bdd`
    (`fix(webapp): UserSettingsService.reset() also clears in-memory
    country`).

    Le test existant `user-settings.service.spec.ts` (cas `reset()
    removes the persisted country entry directly`) a été renforcé pour
    verrouiller le nouveau comportement complet
    (`getCountry() === ''`/`hasCountrySet() === false` en plus de
    l'assertion `localStorage` déjà présente) — **modification d'un test
    existant** au sens de la gouvernance (§5/`tech-lead.md`), isolée dans
    son propre commit séparé du fix de code : `492f73a`
    (`test(webapp): strengthen reset() spec to lock in-memory country
    clearing`).

    `nx test webapp` relancé après le fix : 39/39 suites, 89/89 tests
    verts, sans régression.

    **Feu vert `qa-reviewer` obtenu (2026-09-25) — APPROUVÉ, sans
    réserve.** Vérification indépendante du diff complet (pas seulement le
    message de commit) : changement strictement additif (l'assertion
    `localStorage` d'origine conservée à l'identique, trois assertions
    ajoutées — précondition + deux postconditions), tracé manuellement
    contre l'ancien code pour confirmer que les nouvelles assertions
    auraient échoué avant le fix (donc pas un verrouillage vide). `nx test
    webapp --skip-nx-cache` relancé indépendamment à deux reprises,
    39/39/89/89 vert. Une tentative de vérification empirique
    supplémentaire (revert temporaire du fix pour observer l'échec) a été
    bloquée par le classifieur auto-mode et non contournée — le verdict
    s'appuie sur la lecture directe du code, jugée suffisante. Détail
    complet : `CHANTIER-MODERNISATION-QA-RESET-COUNTRY.md`. **Point 12
    définitivement clos.**
13. **Ajoutée 2026-09-24, découverte pendant le chiffrage de la Phase 5 —
    RÉPONDUE le 2026-09-24 par la revue senior du lot pilote.** Le point 7
    ci-dessus ("qui fait la revue QA pour une modification de test
    existant") était passé d'une question théorique à une question
    opérationnelle immédiate (convertir un composant en `standalone: true`
    casse son `.spec.ts` s'il en a un, et 28 des 41 composants webapp + 4
    des 8 composants admin sont dans ce cas). Ce n'était pas une question
    produit, mais un point de process soumis à `senior-dev` comme prévu
    (voir `CHANTIER-MODERNISATION-REVIEW-PHASE5-PILOTE.md`) : **réponse
    actée — un commit isolé par composant pour l'édition de spec, mais
    soumission à `qa-reviewer` groupée par lots de 5 à 10 composants**,
    pas un aller-retour unitaire (voir §4 Phase 5, amendement 1). §7.7
    (qui fait la revue "en général", au-delà de cette phase précise) reste
    ouverte pour l'utilisateur.
14. **Ajoutée 2026-09-25, découverte pendant la conversion du quatrième lot
    "avec spec" webapp (Phase 5), en vérifiant route par route le
    consommateur d'`UploadComponent`** : `PostAnAdComponent`
    (`apps/webapp/src/app/pages/post-an-ad/post-an-ad.component.ts`)
    injecte `UploadService` directement (`private uploadService =
    inject(UploadService)`). Avant ce lot, l'unique enregistrement de
    provider pour ce service était `UploadModule.providers`, et
    `UploadModule` n'était lui-même importé que par
    `PictureUploaderFormFieldComponent` (`picture-uploader.ts`, standalone
    depuis un lot antérieur) — dans ses propres `imports`. Or les
    `imports` d'un composant standalone n'étendent l'injecteur que pour ce
    composant et ses descendants dans l'arbre, jamais pour ses ancêtres ;
    `PostAnAdComponent` est un ancêtre de
    `PictureUploaderFormFieldComponent` (rendu dynamiquement par ngx-formly
    plus bas dans l'arbre, via `AdFormComponent`/`FormComponent`), pas un
    descendant. **`PostAnAdComponent.uploadService` semble donc n'avoir
    aucun provider joignable en production — ni avant ce lot (l'analyse
    tient indépendamment de la conversion standalone elle-même), ni après**
    (la suppression d'`upload.module.ts`, désormais mort, ne change rien à
    cette portée puisqu'elle n'a jamais été atteignable par
    `PostAnAdComponent`). Les tests unitaires ne le détectent pas : le
    `TestBed` fournit `UploadService` directement via `commonTestProviders`
    (`testing-support.ts`), en dehors du graphe de modules réel.
    **Question à trancher, pas tranchée ici** : est-ce un bug réel (auquel
    cas il faut décider où `UploadService` doit vivre — `providedIn:
    'root'`, un provider au niveau route `/post-an-ad`, ou ailleurs — une
    décision d'architecture hors du mandat purement mécanique de cette
    conversion), ou bien `uploadMultiple(adData.images)` n'est en pratique
    jamais atteint pour une raison que cette analyse statique du graphe DI
    n'a pas vue (à vérifier par un humain, par ex. en rejouant réellement
    le parcours `post-an-ad` une fois un compte de test Auth0 disponible —
    voir §7.10) ? Le Tech Lead n'a pas tranché ni "corrigé" cette portée
    silencieusement — un choix arbitraire de nouvelle portée serait lui
    aussi une décision d'architecture non triviale, hors mandat d'un
    sweep de conversion standalone. Documenté en détail dans le commit
    `55f4d5b` (`refactor(webapp): UploadComponent standalone: true`).

    **Résultat empirique du test de caractérisation (2026-09-25, recommandé
    par `senior-dev` en §7 de
    `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT4-CLOTURE-WEBAPP.md`)** :
    l'analyse statique du graphe DI ci-dessus est **confirmée
    empiriquement, pas seulement supposée**. Nouveau spec, purement
    additif (aucun fichier de test existant modifié — `PostAnAdComponent`
    n'avait aucun `.spec.ts` avant ce commit, donc pas de gouvernance
    §5/qa-reviewer applicable) :
    `apps/webapp/src/app/pages/post-an-ad/post-an-ad.component.spec.ts`.
    Méthode : `TestBed` configuré avec `commonTestProviders`
    (`testing-support.ts`) **privé explicitement de `UploadService`**, pour
    isoler la vraie portée d'injecteur que production laisse à
    `PostAnAdComponent` plutôt que de s'appuyer sur le raccourci du
    harnais de test qui masque le problème (voir ci-dessus). Résultat
    exact observé en instanciant le composant
    (`TestBed.createComponent(PostAnAdComponent)`) dans ce contexte : une
    erreur levée immédiatement,
    `NG0201: No provider found for \`UploadService\`. Source:
    Standalone[PostAnAdComponent]` (Angular 22 — le format de message a
    changé de version en version, ce n'est plus le texte
    `NullInjectorError: No provider for X!` des anciennes versions
    d'Angular, mais la classe d'erreur sous-jacente reste bien un défaut
    d'injecteur). Un second test de contrôle confirme que fournir
    `UploadService` explicitement suffit à instancier le composant sans
    erreur — isolant bien le problème à la portée du provider, pas à un
    autre souci de câblage. **Conclusion factuelle, tranchant la lecture
    1 vs. lecture 2 évoquée par `senior-dev` en §4 de sa revue** : dans le
    graphe de modules réel de production (celui que ce test reconstitue,
    sans le raccourci `commonTestProviders`), instancier
    `PostAnAdComponent` échoue immédiatement et bruyamment faute de
    provider pour `UploadService` — ce n'est pas un chemin mort qui
    éviterait discrètement le problème. **Reste ouvert, non tranché par ce
    test** : si ce echec se produit réellement pour un utilisateur en
    production reste conditionné à une vérification humaine au navigateur
    avec un compte Auth0 réel (§7.10, toujours bloqué dans ce sandbox) —
    un test de caractérisation en environnement `TestBed` prouve le
    comportement du graphe DI tel qu'il est câblé, pas qu'aucun mécanisme
    runtime distinct (ex. un module chargé dynamiquement ailleurs que ce
    que le grep a couvert) ne vienne compenser en pratique, bien
    qu'aucune trace d'un tel mécanisme n'ait été trouvée. La décision
    produit/architecture (où faire vivre `UploadService` :
    `providedIn: 'root'`, provider au niveau route, ou ailleurs) reste
    entièrement ouverte et n'est pas tranchée par ce test — seul le
    diagnostic est maintenant empirique plutôt que déduit par lecture de
    code.

    **CORRECTION FACTUELLE (2026-09-25, session tech-lead), STATUT : RÉSOLU
    — plus une question ouverte.** L'analyse ci-dessus (et celle,
    indépendante, de `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT4-CLOTURE-WEBAPP.md`
    §4, qui aboutit à la même conclusion) est **fausse sur l'origine du
    bug**, bien que le symptôme (`NG0201` empirique) soit correct. Erreur
    de méthode identifiée : la vérification s'est appuyée sur `git log -p
    --follow` sur `post-an-ad.component.ts` (qui prouve seulement
    l'ancienneté de l'**appel** `inject(UploadService)`) et sur la
    topologie *après* le début de la Phase 5, jamais sur l'état réel de
    `post-an-ad.module.ts` **avant** toute conversion `standalone`. Ces
    deux points ne prouvent rien sur la disponibilité du **provider**, qui
    est une question de topologie de modules, pas d'ancienneté du
    call-site.

    Preuve directe, en lisant `post-an-ad.module.ts` tel qu'il existait au
    dernier commit avant le début de la Phase 5 (`8f954a9`, juste avant le
    pilote `1fa187c`) :

    ```
    $ git show 8f954a9:apps/webapp/src/app/pages/post-an-ad/post-an-ad.module.ts
    @NgModule({
      declarations: [PostAnAdComponent],
      imports: [
        CommonModule, PostAnAdRoutingModule, TitledPageModule, NgSelectModule,
        ReactiveFormsModule, UploadModule, AdFormModule
      ]
    })
    export class PostAnAdModule {}
    ```

    `UploadModule` (qui portait `providers: [UploadService]`) était importé
    **directement par `PostAnAdModule` lui-même** — le même `@NgModule` qui
    déclarait `PostAnAdComponent`. C'est le cas le plus simple qui soit en
    DI Angular classique : les `providers` d'un module importé sont hissés
    à l'injecteur de tout module qui l'importe, sans aucune notion
    d'« ancêtre »/« descendant » dans l'arbre de composants — cette notion
    ne s'applique qu'aux `providers`/`imports` d'un composant *standalone*,
    pas à l'import d'un `@NgModule` classique par un autre `@NgModule`
    classique. `UploadService` était donc bel et bien résolvable par
    `PostAnAdComponent` avant la Phase 5, par le mécanisme le plus direct
    possible (import du même module). Le raisonnement « ancêtre vs.
    descendant dans l'arbre de composants » tenu ci-dessus et dans la revue
    senior est un raisonnement de portée d'injecteur *standalone*, appliqué
    à tort à une situation qui, avant la Phase 5, était encore un `@NgModule`
    classique.

    **La régression a été introduite par le commit `ea0ee06`**
    (`refactor(webapp): PostAnAdComponent standalone: true`, premier commit
    de la Phase 5 à toucher ce composant), dont le message dit lui-même :
    « dropped three imports the template never used (NgSelectModule,
    ReactiveFormsModule, UploadModule), confirmed dead for this component
    by grepping post-an-ad.component.html ». Ce grep ne regardait que les
    déclarables utilisés dans le **template** — il ne pouvait pas voir que
    `UploadModule` était importé pour son **provider** (`UploadService`,
    utilisé par la **classe** du composant via `inject(UploadService)`, pas
    par son template), et non pour un composant/directive/pipe qu'il
    exporterait. `post-an-ad.module.ts` a perdu l'import d'`UploadModule` à
    ce commit, sans que rien ne le remplace ni dans le nouveau
    `PostAnAdComponent standalone`, ni ailleurs. Le commit `55f4d5b`
    (`UploadComponent standalone: true`), pointé par la revue précédente
    comme le commit « documentant » ce gap, n'a fait que supprimer
    `upload.module.ts`, déjà mort à ce moment-là pour cette portée précise
    — la régression réelle avait déjà eu lieu deux commits plus tôt, à
    `ea0ee06`.

    **Fix appliqué et vérifié empiriquement** : `UploadService`
    (`apps/webapp/src/app/shared/components/upload/upload.service.ts`) est
    désormais `@Injectable({ providedIn: 'root' })` — il ne dépend plus
    d'aucun graphe d'imports de module, ce qui est de toute façon
    l'idiome standard pour un service applicatif dans une architecture à
    base de composants standalone (cohérent avec `DrawerService`/
    `WelcomeService`/etc., déjà migrés au même pattern ailleurs dans cette
    phase — voir « Correction de citation — commits `ab693f6`/`1d0defe` »
    ci-dessus). Vérifié :
    - `commonTestProviders` (`testing-support.ts`) fournit toujours
      `UploadService` explicitement — un provider explicite gagne sur
      `providedIn: 'root'`, donc aucun conflit ; confirmé empiriquement
      (`nx test webapp` vert, aucune régression sur les 89 tests).
    - Seul `PostAnAdComponent` injecte `UploadService` dans toute
      l'application (`grep -rln UploadService apps/webapp/src` re-vérifié
      après le fix) — `UploadComponent` et
      `PictureUploaderFormFieldComponent` ne l'injectent jamais, donc le
      passage à `providedIn: 'root'` n'a aucun effet sur eux.
    - Le test de caractérisation de `post-an-ad.component.spec.ts` a été
      réécrit (commit isolé, documenté comme correction d'un test ajouté
      *dans cette même session* — pas un test historique du repo, donc pas
      soumis à `qa-reviewer`) : il instancie désormais
      `PostAnAdComponent` avec `commonTestProviders` **privé
      explicitement** d'`UploadService`, et prouve que l'instanciation
      réussit quand même (`providedIn: 'root'` suffit) — confirmant
      empiriquement, dans le même harnais qui reproduisait `NG0201`
      auparavant, que le bug est corrigé.
    - `nx build webapp` (production) relancé, vert.

    Reste correctement non tranché (pas une question produit ni
    d'architecture nouvelle, juste une limite d'environnement déjà connue
    — §7 point 10) : vérification humaine au navigateur avec un compte
    Auth0 réel, toujours bloquée dans ce sandbox. Le diagnostic et le fix
    ci-dessus sont vérifiés par test de caractérisation reproduisant la
    topologie d'injecteur réelle de production, pas par navigation
    manuelle.

15. **Ajoutée 2026-09-25, découverte pendant le chiffrage de la sous-vague
    `admin` (Phase 5)** : `SidenavComponent`
    (`apps/admin/src/app/shared/components/sidenav/sidenav.component.ts`)
    n'a aucun consommateur vivant — son unique point d'usage,
    `apps/admin/src/app/app.component.html`, est un sélecteur commenté
    (`<!-- <bella-sidenav></bella-sidenav> -->`), confirmé par grep
    exhaustif sur `apps/admin/src` (aucune autre référence). Ce n'est pas
    introduit par cette session : le commentaire prédate ce chantier de
    modernisation. **Question à trancher, pas tranchée ici** : le
    composant doit-il être (a) supprimé (dead code, `NavbarComponent`
    couvre déjà la navigation), (b) réactivé (le sélecteur commenté
    suggère une fonctionnalité de navigation latérale jamais terminée ou
    désactivée sans documentation), ou (c) laissé tel quel en attendant
    un besoin produit futur ? Aucune des trois n'est du ressort d'une
    conversion mécanique standalone (le mandat de cette phase). Non
    bloquant pour la Phase 5 : le composant a été converti
    `standalone: true` par cohérence avec le reste du sweep (toujours
    compté par `@angular-eslint/prefer-standalone`), sans changer son
    statut d'inertie. Détail complet dans la sous-section "Sous-vague
    `admin`" plus haut (§4 Phase 5).

## 8. Réponse du Tech Lead aux réserves de la revue senior (2026-09-24)

Cette section synthétise ce qui a changé dans ce document suite à la
revue senior indépendante (`CHANTIER-MODERNISATION-REVIEW.md`) et rend
explicite ce qui reste ouvert pour arbitrage par l'utilisateur, comme
demandé par le mandat de révision.

### Réserves bloquantes — toutes acceptées et intégrées

1. **Angle mort e2e** : accepté intégralement. Le constat — `admin-e2e`
   et `webapp-e2e` sont des placeholders Nx non adaptés, zéro filet
   d'intégration réel — est vérifié et non contesté. Nouvelle **Phase
   1bis** ajoutée en §4, positionnée comme prérequis (pas un simple
   bénéfice) des phases 4 et 5, avec une clause de report explicite si sa
   charge s'avère trop importante (question ouverte §7.10). Seule nuance
   ajoutée de mon côté : le libellé "2-3 scénarios" de la revue senior
   sous-estime probablement le coût réel, qui est dans l'outillage
   (comptes de test Auth0, fixtures, Cloudinary en test) plus que dans
   l'écriture des scénarios eux-mêmes — j'ai chiffré la charge en "L, plus
   grosse inconnue du chantier" plutôt qu'en suivant l'implicite "quelques
   heures" de la revue. Ce n'est pas un désaccord sur le fond, juste une
   précision de charge que la revue n'avait pas chiffrée.
2. **Absence de charge/risque/critères d'acceptation/rollback** : accepté
   intégralement, ajouté à chacune des 9 phases (0, 0bis, 1, 1bis, 2, 3, 4,
   5, 6).
3. **Statut conditionnel des sous-points Phase 2** : accepté intégralement.
   Les sous-points `findAllByUserId` (ex-2.2) et `CitiesModule` (ex-2.8)
   sont désormais marqués **[GELÉ]** explicitement dans la liste
   séquentielle de la Phase 2, avec renvoi direct aux questions ouvertes
   §7.3/§7.4 qui les débloquent.

### Désaccord Phase 4 — tranché : j'accepte le downgrade proposé

Le remplacement complet du store admin est reclassé en **nettoyage
obligatoire (4a) + bascule NgRx optionnelle et non déclenchée (4b)**.
J'accepte l'argument du dev senior : le blast radius vérifié (un seul
composant, via deux façades déjà en place) réduit le *coût* d'un
remplacement, mais ne change rien au fait que le seul défaut concret
constaté aujourd'hui est cosmétique (`console.log`, absence de DevTools/
sélecteurs mémoïsés), pas un bug fonctionnel — et le principe 6 (§3) seul,
sans bénéfice fonctionnel démontré, ne justifie pas de prendre un risque,
même réduit, sur un flux utilisateur visible en continu. Le déclencheur
naturel pour revenir sur cette décision sans nouvelle validation est
l'apparition d'un second store dans `admin` ; une raison hors ROI pur
(nommée explicitement par l'utilisateur) est l'autre voie possible — voir
question ouverte §7.9.

### Autres corrections mineures acceptées

- Reformulation de §1.3 point 3 : la vérification inline d'`AdsController`
  est une politique owner-or-permission, pas une simple duplication de
  `PermissionsGuard` — la Phase 2.3 est scindée en 3a (extraction pure,
  bas risque) et 3b (policy à reproduire fidèlement, risque de
  comportement).
- Précision du chemin d'`admin-publication.controller.spec.ts`
  (`api/admin/`, pas la racine de `api/`) en §1.5.
- Correction de l'estimation "30 minutes" du re-bump NestJS 12 en Phase
  0bis — reformulée en spike time-boxé sans engagement de délai
  d'implémentation avant d'avoir la réponse du spike, cohérent avec
  l'aveu déjà présent en §1.4 sur l'échec de la première tentative.

### Points restant ouverts pour arbitrage utilisateur (ni le Tech Lead ni le dev senior ne tranchent ceux-ci)

Les questions ouvertes §7.1 à §7.10 restent, à trancher par l'utilisateur
avant de lancer la moindre phase de refactor (2, 4, 5) — en particulier
#3 (`CitiesModule`), #4 (`findAllByUserId`), #7 (qui fait la revue QA des
tests modifiés), #9 (une raison hors ROI justifie-t-elle la bascule NgRx
complète malgré son report par défaut ?) et #10 (budget accepté pour
l'outillage e2e, ou report explicite assumé des phases 4/5 sans filet
complet ?). *#2 (`APPROVED`) et #3 (`CitiesModule`) sont désormais
répondues — voir §7 pour le détail de chacune.* Il n'y a pas de désaccord
actif restant entre le Tech Lead et le dev senior à ce stade — les trois
réserves bloquantes sont intégrées et le seul désaccord de fond (Phase 4)
est tranché en acceptant l'argument du dev senior.

### Réponse à la revue senior du lot pilote Phase 5 (2026-09-24)

Deuxième revue indépendante, distincte de celle ci-dessus :
`CHANTIER-MODERNISATION-REVIEW-PHASE5-PILOTE.md`, portant sur le chiffrage
réel de la Phase 5, le commit pilote `1fa187c` (`SpinnerComponent`) et la
méthode proposée pour la suite. **Verdict : validé avec réserves — le lot
pilote lui-même validé sans réserve, quatre amendements actionnables
directement par le Tech Lead sur la méthode, aucune question produit
nouvelle.**

Les quatre amendements ont été intégrés dans ce document (détail complet
en §4 Phase 5, sous-section "Amendements actés après la revue senior du
lot pilote") :

1. Cadence `qa-reviewer` : lots de 5-10 composants avec spec plutôt qu'un
   aller-retour par composant, commits de spec toujours isolés
   individuellement — répond et clôt la question ouverte §7.13.
2. Garde-fou `nx build`/`NG8001` : `NO_ERRORS_SCHEMA` neutralise
   effectivement la détection d'un import standalone manquant *dans le
   spec*, mais `strictTemplates: true` (`apps/webapp/tsconfig.json`) rend
   `nx build webapp` indépendant de ce schéma pour ce risque précis — à
   vérifier empiriquement (pas supposé) sur le premier composant "avec
   spec + enfants de template" converti, résultat documenté dans ce
   document au moment où ce composant est traité.
3. Tri par accessibilité à la vérification manuelle (public d'abord,
   Auth0-gated en dernier et gelé jusqu'à vérification humaine réelle),
   en plus du tri sans-spec/avec-spec, pas à sa place.
4. Correction du résidu de rédaction du critère d'acceptation Phase 5
   (renvoi obsolète aux scénarios e2e Phase 1bis, remplacé par un renvoi
   explicite à la checklist manuelle).

Aucun désaccord entre le Tech Lead et cette deuxième revue senior — les
quatre amendements sont acceptés intégralement, sans nuance ajoutée par
le Tech Lead cette fois (contrairement à la première revue, où une
précision de charge avait été ajoutée sur la Phase 1bis). Aucune question
produit nouvelle remontée par cette revue.

---

# Annexe — chantier de version NestJS (document antérieur, conservé tel quel)

> Ce qui suit est le contenu original de ce fichier avant la réécriture
> ci-dessus, conservé intégralement pour ne pas perdre le détail des
> paliers déjà exécutés (9→10, 10→11) et de la tentative 11→12 annulée. Les
> sections « Fait dans cette session », « Essayé et délibérément annulé »,
> et le plan de paliers NestJS y sont documentés avec beaucoup plus de
> détail qu'au §1.4/§1.1 ci-dessus, qui n'en donnent qu'un résumé.

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

**Palier 11→12 : tenté le 2026-09-23, annulé — bloqué sur Jest, pas sur le
risque anticipé.** Deux surprises, dans le sens inverse de ce que la
recherche ci-dessus prévoyait :
- **Le paramètre optionnel de constructeur non hérité ne s'applique à
  aucun code réel ici** : les 5 `libs/api/domain/src/lib/<feature>/
  *.service.ts` ont chacun un seul paramètre de constructeur, obligatoire,
  jamais marqué `?` ni `@Optional()`. Le risque identifié comme "le plus
  risqué de toute l'échelle 9→12" ne concerne en fait aucun fichier de ce
  repo — vérifié fichier par fichier avant de bumper, pas après coup.
- **Le vrai bloquant, lui, était sous-estimé** : `@nestjs/*` 12.x n'est pas
  juste "ESM-first" avec un filet de sécurité CommonJS comme la note de
  release le suggérait — `@nestjs/common@12.1.0`/`core`/`testing`/`config`
  etc. sont **purement ESM** (`"type": "module"`, `exports` sans condition
  `require`, confirmé en lisant `node_modules/@nestjs/common/package.json`
  après le bump). `nx build api` (webpack, gère l'ESM nativement) passe
  toujours, mais **`nx test api` casse intégralement** : les 5 suites
  échouent au chargement avec `Must use import to load ES Module`, Jest
  tournant ici via `ts-jest` en mode CommonJS (`apps/api/jest.config.ts`).
  Essayé et insuffisant : ajouter
  `transformIgnorePatterns: ['node_modules/(?!(@nestjs)/)']` pour laisser
  passer ces fichiers dans le transform — `ts-jest` ne transpile que les
  fichiers de son `tsconfig.spec.json` (`include` limité aux specs), pas
  les `.js` de `node_modules` même autorisés par `transformIgnorePatterns`
  ; l'erreur persiste identique. Le fix réel demanderait `babel-jest` (pas
  présent dans la stack actuelle, qui n'utilise que `ts-jest`) configuré
  spécifiquement pour transpiler `@nestjs/*` en CommonJS au vol, ou une
  migration plus large de la config Jest de `apps/api` vers un mode natif
  ESM (`extensionsToTreatAsEsm`, etc. — non trivial avec `ts-jest`+Nx,
  caveats documentés côté Jest lui-même) — dans les deux cas, un chantier
  d'outillage de test à part entière, pas un simple bump de version.
- **Décision** : palier annulé, package.json/yarn.lock/jest.config.ts
  remis à l'état du commit `8d2eb59` (palier 10→11) — `git checkout --`
  suivi d'un `yarn install` de contrôle, `nx test api` reconfirmé vert
  (5/5, 20/20) avant de committer autre chose. Le repo reste donc au
  palier 10→11 tant que ce point n'est pas traité. **Prochaine étape si
  repris** : décider entre (a) ajouter `babel-jest` avec un preset ESM→CJS
  scopé à `@nestjs/*` dans `apps/api/jest.config.ts`, ou (b) migrer le
  runner Jest de `apps/api` en mode ESM natif — puis seulement retenter le
  bump 11→12 une fois l'un des deux vert.

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
