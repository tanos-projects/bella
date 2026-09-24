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
- Seul le TODO `publish()` **« Should be APPROVED before PUBLISHED »**
  reste d'actualité : `AdStatus.APPROVED` est toujours déclaré mais jamais
  assigné, `publish()` saute directement `SUBMITTED → PUBLISHED`. C'est un
  choix de modélisation métier à trancher (voir §6, hypothèse ouverte), pas
  un bug de state machine.
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
n'ont qu'un seul paramètre obligatoire). Deux voies non encore tranchées :
(a) `babel-jest` avec un preset ESM→CJS scopé à `@nestjs/*`, ou (b) migrer
le runner Jest de `apps/api` en mode ESM natif. Aucune des deux n'a été
tentée jusqu'au bout — c'est un prérequis d'outillage, pas un refactor de
code métier, donc un bon candidat pour une phase 0 isolée du reste (voir
§4).

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
  de transition est en place, seul le TODO APPROVED reste ouvert).
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
  4. Typer les filtres de requête (`AdSearchQueryDTO` + `class-validator`)
     sur `getAll`/`getMyPublications` — **ce point change un comportement
     observable** (rejet de query params invalides) et doit donc être un
     commit séparé, signalé comme tel (principe 7).
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

  **Sous-points gelés — dépendent d'une question ouverte non tranchée
  (§7), ne pas les traiter comme acquis dans l'ordre séquentiel :**
  - **[GELÉ — dépend de §7.4]** Retirer `findAllByUserId` de
    `AdsRepository` (ISP) — grep exhaustif déjà fait (aucun appelant trouvé
    ni côté front ni côté back), mais **confirmation explicite de
    l'utilisateur requise** avant suppression, et un grep de re-vérification
    à refaire juste avant ce commit précis puisque le code aura bougé
    entre-temps.
  - **[GELÉ — dépend de §7.3]** Clarifier/retirer `CitiesModule` si aucun
    contrôleur n'est prévu (§1.3 point 8) — ne démarre qu'après réponse
    explicite de l'utilisateur sur la question ouverte.
- **Fichiers touchés** : `apps/api/src/app/infrastructure/persistence/repositories/ads-repository-nest.ts`, `apps/api/src/app/api/ads.controller.ts`, `apps/api/src/app/api/admin/admin-publication.controller.ts`, `libs/api/domain/src/lib/ads/ads.repository.ts`, `libs/api/adapters/src/lib/ad.mapper.ts`, `libs/api/domain/src/lib/cities/cities.service.ts`.
- **Principes appliqués** : OCP, ISP, SRP (détaillés ci-dessus).
- **Tests** : la suite de la phase 1 (+ celle déjà existante) doit rester
  verte à l'identique pour tout sous-point qui ne change pas le
  comportement (1, 3a, 6, 7) ; le sous-point 3b ajoute un test de
  caractérisation avant déplacement ; les sous-points 4 (typage strict des
  requêtes) et 5 (sortie de `NotFoundException`/`BadRequestException` des
  mappers — reclassifié après revue senior, voir §1.3bis) ajoutent chacun
  de nouveaux tests pour leur propre changement de comportement observable
  (rejet des query params invalides pour 4, rejet explicite du cas
  introuvable côté appelant pour 5), en plus de garder les cas valides
  existants verts.
- **Charge estimée** : M-L pour l'ensemble des sous-points exécutables
  (7 commits indépendants) ; les 2 sous-points gelés n'ont pas de charge
  engagée tant que §7.3/§7.4 ne sont pas répondues.
- **Risque** : faible pour 1, 3a, 6, 7 (renommage/extraction sans
  changement de comportement) ; moyen pour 3b (policy à reproduire
  fidèlement), 4 et 5 (chacun un nouveau comportement observable côté
  API — 5 reclassifié après revue senior, voir §1.3bis).
- **Critère d'acceptation** : `nx run-many --target={build,lint,test}
  --all` vert après chaque commit ; pour 1/3a/6/7, zéro différence dans
  les résultats de tests hérités de la phase 1 ; pour 3b, le test de
  caractérisation écrit avant déplacement reste vert après déplacement ;
  pour 4 et 5, les cas valides existants restent verts et de nouveaux
  tests couvrent explicitement le nouveau comportement de rejet (query
  params invalides pour 4, cas introuvable/mal formé pour 5).
- **Rollback** : chaque sous-point est un commit isolé (principe 7, §3) —
  revert du commit précis concerné en cas de régression, jamais un
  rollback groupé, les sous-points étant indépendants entre eux.

### Phase 3 — Combler la couverture front (webapp)

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
- **Charge estimée** : L (potentiellement les deux apps en totalité,
  propagation NgModule → standalone) — à re-chiffrer par sous-vague une
  fois la Phase 1bis terminée et le nombre réel de composants/modules
  affectés mesuré (réactiver `@angular-eslint/prefer-standalone` pour
  compter, comme fait pour les 4 règles a11y en annexe).
- **Risque** : élevé sur le câblage inter-modules, faible sur la logique
  interne des composants (déjà couverte par les specs unitaires
  existantes) — la nature du risque est spécifiquement celle qu'un e2e
  détecte et qu'un test unitaire ne détecte pas.
- **Critère d'acceptation** : par sous-vague (webapp, puis admin) —
  `nx run-many --target={build,lint,test} --all` vert, **et** les
  scénarios e2e de la Phase 1bis passent toujours de façon stable après la
  sous-vague, pas seulement avant.
- **Rollback** : par lot vérifié (comme déjà pratiqué pour `@if`/`@for` et
  `inject()`) — revert du lot précis en cas de régression détectée au
  build/lint/test ou par les scénarios e2e, jamais un rollback de toute la
  phase.
- **Dépendances** : **doit** suivre la Phase 1bis (e2e) sauf report
  explicitement acté par l'utilisateur (voir Phase 1bis) ; bénéficie
  également des phases 1 et 3 pour un filet de sécurité unitaire plus
  large.

### Phase 6 (optionnelle, à valider) — Trancher `APPROVED` dans `AdStatus`

- **Objectif** : décider si `publish()` doit réellement transiter par
  `APPROVED` avant `PUBLISHED` (le TODO existant), ou si `APPROVED` doit
  être retiré de l'enum s'il n'a jamais été et ne sera jamais utilisé.
- **C'est une décision produit, pas seulement technique** — voir §7,
  question ouverte. Ne pas l'entreprendre sans réponse explicite de
  l'utilisateur, car ça change un contrat d'API (valeurs possibles de
  `status` dans `AdDTO`) consommé par les deux front-ends.
- **Charge estimée** : ne peut être chiffrée avant la décision produit —
  si "oui, l'implémenter" : M-L (nouvelle transition d'état + impact
  `libs/dtos` + les deux front-ends, voir §6) ; si "non, retirer la
  valeur" : S (changement d'enum + vérification qu'aucun code mort n'y
  fait référence).
- **Risque** : élevé si "oui" — seule phase de ce plan qui toucherait
  `libs/dtos`, donc l'API et les deux front-ends simultanément (voir §6).
  Nul si "non" tant que la valeur n'est jamais émise.
- **Critère d'acceptation** : réponse actée par écrit à la question
  ouverte §7.2 avant tout commit ; si "oui", tests de caractérisation sur
  la nouvelle transition `SUBMITTED → APPROVED → PUBLISHED` avant
  modification, et vérification explicite des deux front-ends (pas
  seulement l'API) puisque `AdDTO.status` est un contrat partagé.
- **Rollback** : si "oui", traiter comme un changement cross-app à part
  entière — rollback coordonné API + les deux fronts, jamais un revert
  isolé côté API seul si le nouveau statut a déjà pu être émis en
  production.

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
  (ex. Phase 2.4 si elle finit par exposer un nouveau DTO de requête, ou
  Phase 6 si `APPROVED` devient une valeur de `status` réellement émise)
  impacte l'API **et** les deux front-ends simultanément. Aucune phase de
  ce plan ne touche `libs/dtos` de façon actuellement identifiée, mais la
  Phase 6 (si elle est lancée) devra être traitée comme un changement
  cross-app à part entière, jamais comme un simple ajustement API.
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
2. **`AdStatus.APPROVED` (Phase 6)** : faut-il l'implémenter réellement (un
   modérateur "approuve" avant qu'un système ou un second modérateur
   "publie"), ou retirer cette valeur de l'enum si elle ne correspond à
   aucun besoin produit actuel ou prévu ? Décision produit, pas technique.
3. **`CitiesModule` sans `CitiesController` (§1.3 point 8)** : fonctionnalité
   inachevée à terminer, ou couche interne jamais destinée à être exposée
   publiquement (auquel cas la documentation devrait le dire explicitement)
   ? **Bloque le sous-point Phase 2 correspondant, gelé explicitement en
   §4 tant que cette réponse n'est pas actée.**
4. **`findAllByUserId` (§1.3 point 2)** : confirmer qu'aucun consommateur
   front (webapp/admin) ni aucun plan produit à court terme n'en dépend
   avant de le retirer de l'interface `AdsRepository`. **Bloque le
   sous-point Phase 2 correspondant, gelé explicitement en §4 tant que
   cette réponse n'est pas actée.**
5. **NestJS 12 (Phase 0bis)** : le bénéfice de fermer cet écart d'un
   majeur justifie-t-il le temps d'investiguer/implémenter la solution
   Babel-ESM, ou est-ce acceptable de rester sur NestJS 11.x pour une
   durée indéterminée tant que rien ne l'exige (pas de faille de sécurité
   connue, pas de dépendance qui l'exige) ?
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
10. **Ajoutée après revue senior — charge de la Phase 1bis (e2e)** :
    acceptez-vous d'investir potentiellement un chantier d'outillage e2e
    substantiel (compte de test Auth0 fonctionnel, données de seed
    dédiées, gestion de Cloudinary en environnement de test) avant de
    lancer les phases 4/5, ou préférez-vous, si la charge s'avère trop
    importante, accepter par écrit le risque documenté de lancer 4/5 sans
    filet d'intégration complet ? Voir §4 Phase 1bis pour la clause de
    report explicite déjà prévue.

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

Les questions ouvertes §7.1 à §7.10 restent, dans leur totalité, à
trancher par l'utilisateur avant de lancer la moindre phase de refactor
(2, 4, 5) — en particulier #2 (`APPROVED`), #3 (`CitiesModule`), #4
(`findAllByUserId`), #7 (qui fait la revue QA des tests modifiés), #9 (une
raison hors ROI justifie-t-elle la bascule NgRx complète malgré son
report par défaut ?) et #10 (budget accepté pour l'outillage e2e, ou
report explicite assumé des phases 4/5 sans filet complet ?). Il n'y a
pas de désaccord actif restant entre le Tech Lead et le dev senior à ce
stade — les trois réserves bloquantes sont intégrées et le seul désaccord
de fond (Phase 4) est tranché en acceptant l'argument du dev senior.

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
