# Revue senior indépendante — Phase 2 (nettoyage SOLID API + 2 bugs fonctionnels)

Date : 2026-09-24. Portée : les 10 commits `e007fcc`..`3bc8dfd` listés dans le
mandat. Ce document ne revalide **pas** `1bf8197` (fix `CategoriesController`)
ni `5ae1f0a` (sortie des exceptions des mappers) — les deux sont notés comme
en cours de QA séparée, conformément à la consigne reçue. Aucun fichier de
code source n'a été modifié pour produire cette revue ; les seuls artefacts
créés sont des scripts jetables dans `$TMPDIR`, jamais dans l'arbre du repo.

## 1. Les 4 refactors SOLID — vérification indépendante

Méthode : diff `git show <commit>` ligne à ligne entre l'état avant/après,
plus lecture directe du fichier final sur disque.

### 1.1 `AdsMongoFilterBuilder` (`5361eaa`) — validé, extraction pure

`manageKeyword`/`managePrice` sont transplantées mot pour mot dans
`ads-mongo-filter-builder.ts` (comparé `git show 5361eaa~1:.../ads-repository-nest.ts`
vs le fichier actuel). Seule différence cosmétique : une ligne `// score: null`
commentée et un `// TODO : extract into builder class` supprimés — aucun
changement de branche logique, aucun changement d'ordre d'application
(`manageKeyword` puis `managePrice`, identique). `ads-repository-nest.spec.ts`
n'a pas été touché et continue de passer. **Verdict : conforme, aucun risque.**

### 1.2 `MostRecentAdsShuffler` (`3af7948`) — validé, extraction pure

`shuffle()`/`fakeMostRecentAds()` déplacées à l'identique, y compris le
"quirk" documenté (le call site passe toujours `fakeMostRecentAds(undefined)`,
donc `?limit=` sur `/publications/most-recent` ne tronque jamais réellement le
résultat) — le commit le caractérise explicitement dans un test avant de le
figer, plutôt que de le "corriger en douce" pendant l'extraction. **Verdict :
conforme.**

### 1.3 `PublishAuthorizationPolicy` (`d7f5e51`) — validé, y compris l'exigence de process la plus stricte

C'est le point le plus sensible du lot (policy de sécurité, pas un simple
déplacement). Vérifié deux choses séparément :

- **Le test de caractérisation existait bien avant le déplacement.**
  `git log --oneline -- apps/api/src/app/api/ads.controller.spec.ts` montre
  que le describe `AdsController.publishAd` (owner publie / non-owner sans
  permission rejeté / permission bypasse l'ownership / ad sans owner rejeté)
  a été ajouté par `f022fce` (« Close issue #49 »), un commit antérieur à
  toute la Phase 2. Le commit `d7f5e51` ne touche pas
  `ads.controller.spec.ts` — ces tests passent donc bien **sans modification**
  contre le nouveau code, exactement comme l'affirme le message de commit.
- **La policy reproduit fidèlement la logique.** Diff ligne à ligne entre
  l'ancien bloc inline de `publishAd()` et
  `PublishAuthorizationPolicy.publishIfAuthorized()` : même ordre de
  vérification (permission d'abord, sans lookup ; puis résolution de
  l'appelant, lookup de l'ad, comparaison `ad.owner.id !== caller.id`), même
  message d'exception (`'Only the ad owner can publish it'`), même structure
  d'observables (`switchMap` imbriqués). Rien n'a été "nettoyé" au passage.

**Verdict : conforme à l'exigence du chantier (test de caractérisation écrit
avant le déplacement, logique reproduite verbatim). Pas de réserve.**

### 1.4 Helper de pagination (`ed7cd52`) — validé, extraction pure

`parsePagination`/le shape `forkJoin([items$, count$]) → {items, total, page,
pageSize}` sont repris à l'identique dans
`apps/api/src/app/utils/paginated-result.helper.ts`, y compris le
commentaire qui documente le fix `849d043` (pageSize non-positif/non-numérique
retombe sur 20, pas 1). `admin-publication.controller.spec.ts` n'a pas
changé et passe toujours. **Verdict : conforme.**

Le correctif de typage `RequestWithUser.headers` (`IncomingHttpHeaders`)
embarqué dans ce même commit est vérifié séparément en §4.

## 2. `AdSearchQueryDTO` (`3bc8dfd`) — un vrai bug trouvé

### 2.1 Ce qui marche

- Grep de tous les appelants front (`apps/webapp/src/app/shared/services/ads.service.ts`,
  `apps/webapp/src/app/shared/models/search-filter.model.ts`) : `getAll()`
  envoie `category`+`country` ; `search()` envoie le contenu de
  `SearchFilter` (`category`/`city`/`country`/`maxPrice`/`minPrice`/`keyword`/`quality`)
  — exactement les 7 champs déclarés dans `AdSearchQueryDTO`. Aucun front
  n'envoie aujourd'hui un paramètre hors whitelist vers `getAll`/`getMyPublications`.
  `admin` n'appelle jamais ces deux endpoints (seulement
  `/publications/unpublished|:id/reject|:id/archive`). **Aucune casse
  observable des usages front existants.**
- Les cas valides et invalides sont correctement couverts par
  `ad-search-query.dto.spec.ts` (vide, tous les champs, `$where` rejeté,
  `minPrice`/`maxPrice`/`category` mal typés rejetés).

### 2.2 Ce qui ne marche pas : le paramètre `limit` cassera dès qu'il sera utilisé

`getAll`/`getMyPublications` déclarent **deux** décorateurs `@Query` sur le
même handler :

```ts
getAll(
  @Query(adSearchQueryValidationPipe) filter: AdSearchQueryDTO,
  @Query('limit') limit: number
)
```

`@Query()` sans clé (celui qui porte le pipe) reçoit **l'objet `req.query`
entier**, pas un sous-ensemble — vérifié directement dans le code source de
Nest livré dans ce monorepo
(`node_modules/@nestjs/core/router/route-params-factory.js`, méthode
`exchangeKeyForValue`, case `QUERY` : `return data ? req.query[data] : req.query;`).
Concrètement, un appel réel `GET /publications?category=cars&limit=10`
présente `{category: 'cars', limit: '10'}` tout entier au pipe lié à
`filter: AdSearchQueryDTO`. Comme `limit` n'est déclaré nulle part sur ce DTO
et que `forbidNonWhitelisted: true` est actif, la requête est rejetée en 400
(`"property limit should not exist"`).

Reproduit empiriquement (script Node autonome hors arbre du repo, appelant
directement l'instance `ValidationPipe` exportée avec la même config
`{transform:true, whitelist:true, forbidNonWhitelisted:true}`) :

```
REJECTED (category+limit): {"message":["property limit should not exist"],"error":"Bad Request","statusCode":400}
ACCEPTED (category+country, no limit): AdSearchQueryDTO { category: 'cars', country: 'CI' }
```

`ad-search-query.dto.spec.ts` ne peut pas détecter ce bug : il exerce le pipe
en isolation sur des objets construits à la main, sans jamais inclure `limit`
dans l'objet transformé — donc jamais dans une configuration qui reflète
réellement ce que Nest présente au pipe sur cette route précise.

**Impact réel aujourd'hui : nul**, parce qu'aucun appelant front actuel
n'envoie `?limit=` à `/publications` (`getAll`) ni à
`/publications/my-publications/:status` (`getMyPublications`) —
`getMostRecentAdsByCategory`, qui envoie bien `limit`, cible une route
différente (`/publications/most-recent`) non concernée par ce DTO.

**Mais c'est un vrai défaut de conception, pas une hypothèse théorique** :
`limit` est un paramètre de requête **documenté et fonctionnel** sur ces deux
mêmes endpoints (present dans la signature du handler précisément pour ça).
Le jour où le front (ou Swagger, ou un futur appelant) l'utilisera sur
`getAll`/`getMyPublications`, il cassera silencieusement avec un 400 au lieu
d'être honoré. **À corriger avant de considérer ce sous-point clos** — ajouter
`limit` (optionnel, `@IsNumberString`) à `AdSearchQueryDTO`, ou restructurer
la validation pour ne porter que sur les clés réellement filtrées.

**Verdict sur 3bc8dfd : fonctionnellement correct pour tous les usages actuels,
mais porte un bug de contrat non testé sur un paramètre existant du même
endpoint. Pas bloquant pour la production telle qu'elle est utilisée
aujourd'hui, mais doit être corrigé avant de clore le sous-point.**

## 3. Sous-point 8 (guard `GET /users/:id`) — décision de suspendre confirmée, et une découverte plus grave ailleurs

### 3.1 Le raisonnement du Tech Lead tient

Vérifié indépendamment, chaque affaire :

- `apps/webapp/src/app/pages/user/profile/profile.service.ts:13` appelle
  `GET /users/${id}` via un `HttpClient` nu, sans intercepteur Auth0 attaché
  (l'URL n'est pas dans `AuthModule.forRoot(...).httpInterceptor.allowedList`
  de `app.module.ts`).
- La route `profil/:id/:username` (`app-routing.module.ts:52`) ne porte que
  `canLoad: [WelcomeGuard]` — pas `AuthGuard`. C'est bien une page consultable
  sans connexion aujourd'hui, pas une supposition.
- `UsersController.findOne` (`GET /users/:id`) mappe via
  `UserMapper.modelToProfileDTO`, qui ne renvoie que
  `id`/`username`/`country`/`picture` — vérifié dans
  `libs/api/adapters/src/lib/user.mapper.ts` et son spec
  (`only exposes id/username/country/picture, dropping every other field`,
  `expect(dto.email).toBeUndefined()`). **Pas d'email, pas de téléphone, pas
  d'idpId, pas de date de naissance.**

L'existence même d'un DTO dédié et distinct (`UserProfileDTO`, séparé de
`UserDTO`) suggère un choix de conception délibéré pour exposer un profil
public restreint — pas un oubli accidentel de guard qui aurait laissé fuiter
le DTO complet. Poser le guard sans traiter la conséquence front casserait
une fonctionnalité qui fonctionne aujourd'hui comme un profil public. **La
décision de suspendre l'exécution et de remonter une question produit (§7.11)
plutôt que de trancher seul est la bonne décision de gouvernance** — le
sous-point 8 n'est pas un simple oubli de guard comme le sous-point 9
(categories) l'était, c'est une tension produit réelle entre deux
affirmations valides.

### 3.2 Découverte annexe, plus sérieuse : `GET /publications/:id` fuit déjà l'email/téléphone du propriétaire — hors scope du chantier, mais change l'éclairage

En creusant "quels champs sensibles sont exposés publiquement aujourd'hui"
(mandat point 3), j'ai vérifié la chaîne complète pour l'endpoint public
`AdsController.findOne` (`GET /publications/:id`, **aucun guard**) :

- `AdsRepositoryNest.findOne(id)` appelle
  `.setOptions({ populate: 'owner' })` — l'`owner` est un document Mongo
  complet, pas une simple référence.
- `AdMapper.modelToDTO` mappe cet owner via
  `UserMapper.modelToDTO(model.owner)` — **pas** `modelToProfileDTO` — donc
  avec `email`/`mobilePhone`/`lastname`/`firstname`/`birthdate` inclus.
  Vérifié dans `libs/api/adapters/src/lib/ad.mapper.ts:26` et son historique
  (`git log -p --follow`) : cette ligne existe depuis avant ce chantier,
  **aucun des 10 commits Phase 2 ne l'a introduite ni modifiée** — ce n'est
  pas une régression de ce chantier.
- Grep exhaustif de `apps/webapp/src` et `apps/admin/src` : **aucun appel
  front n'utilise `GET /publications/:id`** — le front passe systématiquement
  par `/publications/published/:id` ou `/publications/unpublished/:id`, qui
  eux **ne** peuplent **pas** `owner` (pas de `.setOptions({populate: 'owner'})`
  dans `findOnePublished`/`findOneUnpublished`). L'endpoint qui fuit semble
  orphelin côté usage produit connu, mais reste exposé publiquement (pas de
  `@UseGuards`) à quiconque appelle l'API directement (Swagger, `curl`, un
  futur client mobile, un scraper).

**Ce n'est pas un bug introduit par ce chantier et ce n'est pas dans son
périmètre déclaré** (aucun sous-point Phase 2 ne touche `AdsController.findOne`
ni cette ligne d'`AdMapper`) — je ne demande donc pas de le corriger dans le
cadre de cette revue. Mais je le signale parce qu'il change matériellement la
lecture de la question §7.11 : le système contient déjà, aujourd'hui,
une fuite de données personnelles (email + téléphone du vendeur) plus grave
que tout ce que `GET /users/:id` pourrait exposer (qui, lui, est
délibérément restreint) — juste sur un endpoint différent, non identifié par
le plan. À faire remonter à l'utilisateur comme un constat distinct, pas
comme faisant partie de la décision Phase 2.8.

## 4. Artefact d'environnement (overlay `node_modules` + `NODE_PATH`)

Vérifié directement :

- `node_modules/` de ce worktree est bien couvert par `.gitignore`
  (`git check-ignore -v node_modules` → `.gitignore:9:node_modules`) — rien
  ne peut fuiter dans un commit.
- L'overlay est un mélange cohérent avec ce qui est documenté : la plupart
  des paquets (`@nestjs`, `accepts`, `acorn`, ...) sont des **symlinks** vers
  l'arbre partagé `/home/tanos/bella/node_modules`, alors que
  `class-validator`/`class-transformer` sont des **dossiers réels locaux**
  (pas des symlinks) — donc l'installation de ces deux paquets n'a bien rien
  écrit dans l'arbre partagé. Confirmé : `/home/tanos/bella/node_modules/class-validator`
  **n'existe pas** — l'arbre principal est intact.
- Reproduit la nécessité de `NODE_PATH` moi-même :
  - `nx build api` **réussit sans `NODE_PATH`** (webpack résout
    statiquement, contrairement à l'affirmation implicite qu'il en aurait
    besoin — en réalité seul `nx test` en a besoin, ce que le texte du
    chantier dit bien si on le lit précisément : le problème concerne le
    `require()` paresseux de `ValidationPipe`, qui n'est déclenché qu'à
    l'exécution/aux tests).
  - `nx test api` **échoue sans `NODE_PATH`** : exactement les deux fichiers
    qui touchent `class-validator`
    (`ad-search-query.dto.spec.ts`, `ads.controller.spec.ts`) plantent
    (« Jest worker encountered 4 child process exceptions »), 19/21 suites
    passent quand même.
  - `NODE_PATH=<worktree>/node_modules npx nx test api` → **21/21 suites,
    125/125 tests, vert.**

**Verdict : contournement raisonnable, correctement isolé, et sa nécessité
précise (build OK sans, test KO sans) est vérifiée empiriquement, pas
seulement crue sur parole.** La limite documentée (non commité, une session
future qui oublie `NODE_PATH` retombe dans l'échec) est réelle et déjà
écrite noir sur blanc dans `CHANTIER-MODERNISATION.md` — c'est la bonne
posture (dette technique documentée, pas cachée), mais **c'est une dette
qui va mordre la prochaine session** : recommandation forte d'exécuter un
vrai `yarn install` scopé à ce worktree (ou d'ajouter un rappel visible,
genre script `predev`/`pretest` qui vérifie `NODE_PATH` et échoue avec un
message clair sinon) avant de considérer ce sous-point définitivement clos.

### 4.1 Note opérationnelle sans rapport avec le contenu du chantier

Pendant cette revue, `git status`/`git diff --cached` sur ce worktree ont
montré, à deux instants rapprochés, un état incohérent (des fichiers du
commit `3bc8dfd` marqués modifiés dans l'index puis, quelques secondes plus
tard, un statut totalement propre) sans qu'aucune commande de ma part n'ait
touché l'index. C'est cohérent avec une activité **concurrente d'un autre
agent** (`modernisation-tech-lead` et/ou `modernisation-qa-reviewer`,
mentionnés comme actifs dans cette même session) opérant sur ce même
répertoire de travail partagé en parallèle de cette revue. Aucune
conséquence sur les constats ci-dessus (tous fondés sur `git show <sha>`,
qui lit l'objet commit immuable, pas l'état mouvant de l'index/working
tree), mais c'est un risque opérationnel à signaler : plusieurs agents
git-actifs sur le même worktree, sans coordination de verrou, peuvent se
marcher dessus (un `git add`/`git reset` de l'un pendant un `git commit` de
l'autre). Recommandation : un seul agent à la fois ne devrait faire des
opérations d'écriture git sur ce worktree.

## 5. Le fix `RequestWithUser.headers` préexistait-il sur `main` ?

Confirmé directement :

```
git show b0912af:apps/api/src/app/api/admin/admin-publication.controller.ts
```

montre, sur `main`, avant tout travail de ce chantier :

```ts
interface RequestWithUser extends ExpressRequest {
  user: AuthUser;
}
```

— identique à la version « cassée » décrite, sans le typage explicite
`headers: IncomingHttpHeaders` ajouté par `ed7cd52`. **Confirmé
indépendamment : ce n'est pas un problème introduit par ce chantier**, et le
fix (typer `headers` via `IncomingHttpHeaders` plutôt que de compter sur les
types d'Express, documentés comme intermittents dans cet environnement) est
une correction locale au fichier, sans effet de bord constaté ailleurs (`nx
build`/`test api` verts, voir §6).

## 6. `nx run-many --target={build,lint,test} --all`

Exécuté moi-même, avec `NODE_PATH` positionné (nécessaire pour `api`, voir §4) :

- **build** : `api`, `api-domain`, `api-adapters`, `dtos`, `webapp` OK.
  `admin:build:production` a d'abord échoué dans mon bac à sable à cause d'un
  refus réseau (`fonts.googleapis.com`, propre à l'environnement sandbox de
  cette session, sans rapport avec le chantier) — relancé avec ce domaine
  autorisé, **succès** (seul un warning de budget de bundle préexistant,
  588 kB au-dessus du budget 500 kB, sans rapport avec ce chantier).
- **test** : 6/6 projets verts —
  `dtos` (cache), `api-domain` 6/6 suites, `api-adapters` 5/5 suites (28
  tests), `webapp` 30/30 suites (43 tests), `admin` 5/5 suites (9 tests + 1
  skip), **`api` 21/21 suites (125 tests)**. Nx signale `api:test` comme
  "flaky" — ce flag Nx apparaît systématiquement dès qu'une target échoue une
  fois puis réussit dans le même historique de cache local (ce qui est
  arrivé ici : premier essai sans `NODE_PATH`, volontairement, pour vérifier
  la nécessité documentée) ; ce n'est pas un signe d'instabilité du code.
- **lint** : `api` 115 warnings/0 erreur (aucune erreur nouvelle, uniquement
  du `@typescript-eslint/no-explicit-any` déjà présent dans le style du
  fichier d'origine, y compris dans les nouveaux fichiers extraits qui
  reprennent le typage `any` préexistant). `webapp` 37 problèmes (5 erreurs,
  32 warnings) et `admin` 13 problèmes (3 erreurs, 10 warnings) — cohérent
  avec la baseline documentée dans le plan (« lint webapp 39/5, admin 15/3 »),
  petite dérive dans la marge attendue, **hors périmètre de ce chantier**
  comme spécifié dans le mandat de cette revue. `webapp-e2e`/`admin-e2e`
  lint plantent sur une erreur de config ESLint flat-config
  (`FlatCompat.config`), un problème d'outillage des placeholders e2e déjà
  documenté comme non fonctionnels dans le plan, sans rapport avec Phase 2.

**Verdict global build/lint/test : vert sur tout le périmètre de ce
chantier (api + libs), aucune régression détectée sur webapp/admin, les
échecs front (lint erreurs preexistantes, e2e config cassée) sont bien
préexistants et hors scope.**

## Verdict global

**Validé avec réserves.**

Réserves, par ordre de priorité :

1. **(À corriger avant de clore 3bc8dfd)** `AdSearchQueryDTO` rejette
   aujourd'hui `?limit=` sur `getAll`/`getMyPublications` avec un 400,
   alors que `limit` est un paramètre documenté et fonctionnel de ces mêmes
   endpoints — bug de conception vérifié empiriquement (§2.2), sans impact
   sur l'usage front actuel mais qui cassera le premier appelant qui l'utilise.
2. **(Dette déjà documentée, mais mérite un filet)** l'overlay
   `node_modules`/`NODE_PATH` fonctionne et est correctement isolé, mais rien
   n'empêche une session future d'oublier `NODE_PATH` et de retomber dans
   l'échec — un script de garde ou, mieux, un vrai `yarn install` scopé au
   worktree fermerait ce risque pour de bon.
3. **(Risque opérationnel, pas de contenu)** activité git concurrente
   d'autres agents observée sur ce même worktree pendant la revue — sans
   conséquence sur les constats ici, mais à surveiller.

Aucune de ces réserves n'invalide le travail des 4 refactors SOLID
(`AdsMongoFilterBuilder`, `MostRecentAdsShuffler`, `PublishAuthorizationPolicy`,
pagination helper), tous vérifiés comme des extractions fidèles, ni la
décision de suspendre le sous-point 8 en attente d'arbitrage utilisateur, qui
est la bonne décision de gouvernance sur les faits vérifiés.

## Avis explicite sur l'urgence réelle de §7.11

**Pas urgent pour `GET /users/:id` lui-même.** Le DTO qu'il renvoie
(`UserProfileDTO` : `id`/`username`/`country`/`picture`) est déjà minimal et
délibérément conçu comme tel — vérifié par lecture du mapper et de son test,
pas supposé. Il n'y a pas de fuite d'email/téléphone/idpId via cet endpoint
aujourd'hui. La décision du Tech Lead de ne pas poser le guard sans réponse
produit est la bonne, et §7.11 peut attendre l'arbitrage de l'utilisateur au
rythme normal du chantier, sans urgence de sécurité.

**En revanche, je remonte une urgence différente, découverte pendant cette
revue et hors scope du plan actuel** : `GET /publications/:id` (public, sans
guard, endpoint distinct) expose aujourd'hui l'email et le téléphone complets
du propriétaire d'une annonce via l'owner peuplé et mappé par
`UserMapper.modelToDTO` au lieu de `modelToProfileDTO`. Ce n'est pas
introduit par ce chantier et aucun front connu ne l'appelle, mais c'est un
vrai endpoint public exposé, pas une hypothèse — n'importe qui connaissant un
ID d'annonce (ou scannant Swagger) peut y accéder sans authentification.
Je recommande de le signaler à l'utilisateur comme un constat séparé à
trancher indépendamment de §7.11 (probablement : soit guard l'endpoint, soit
faire mapper l'owner via `modelToProfileDTO` comme partout ailleurs côté
public) — ni bloquant pour la Phase 2 telle que scopée, ni à confondre avec
la question posée sur `/users/:id`.
