# QA Review — Phase 2 (modifications de tests existants)

Revue effectuée par le QA dédié du chantier de modernisation, conformément à
`.claude/agents/qa-reviewer.md`. Deux commits modifiant des tests
**existants** (créés en Phase 1) sont examinés séparément ci-dessous. Aucun
fichier de code ou de test n'a été modifié de façon permanente par cette
revue (un test HTTP temporaire a été écrit puis supprimé — voir §1.4).

---

## 1. `1bf8197` — fix(api): make CategoriesController.getAll actually filter on selectable

### 1.1 Diff de production

`apps/api/src/app/api/categories.controller.ts` :

```diff
- getAll(@Query() selectable: boolean): Observable<CategoryDTO[]> {
+ getAll(@Query('selectable') selectable?: string): Observable<CategoryDTO[]> {
     return this.categoryService
-      .findAll({ selectable: Boolean(selectable) })
+      .findAll({ selectable: selectable === 'true' })
```

Le bug était réel et bien caractérisé : `@Query()` sans clé liait tout
l'objet query params (toujours truthy) à `selectable`, donc `Boolean(...)`
valait toujours `true`. Le fix extrait la valeur de chaîne réelle et la
compare explicitement à `'true'`. C'est un fix minimal, correct, sans effet
de bord sur `getTop()` (non touché).

### 1.2 Diff de test — assertion par assertion

Fichier : `apps/api/src/app/api/categories.controller.spec.ts`.

| Avant (Phase 1) | Après | Verdict |
|---|---|---|
| L15-29 (ancien) : `getAll({} as any)` → attend `selectable: true` (documentait le bug) | L21-30 : `getAll(undefined)` → attend `selectable: false` | Cohérent avec le nouveau code : `undefined === 'true'` → `false`. Le test précédent documentait explicitement le bug (« always filters selectable:true ») ; il ne peut logiquement pas survivre à un fix qui corrige ce bug. **Pas de perte de couverture** : le nouveau test vérifie le comportement correct pour ce même cas d'entrée. |
| L31-42 (ancien) : `getAll({ selectable: 'false' } as any)` → attend `selectable: true` (documentait le bug) | L32-41 : `getAll('false')` → attend `selectable: false` | Idem : le signal d'entrée change de forme (`{selectable:'false'}` → `'false'`) parce que la signature du contrôleur change (`@Query('selectable')` extrait directement la string). L'assertion passe de « prouve le bug » à « prouve le fix ». Correct. |
| (absent) | L43-52 : `getAll('true')` → attend `selectable: true` | Nouveau test (n'entre pas dans le mandat qa-reviewer, mais renforce la couverture). |
| (absent) | L54-68 : deux appels successifs `'false'` puis `'true'` → `toHaveBeenNthCalledWith` prouve des filtres différents | Nouveau test, couvre exactement le risque de non-régression (le bug revenu silencieusement produirait `true` deux fois). |
| L44-50 (ancien) : `getAll({} as any)` dans le test « maps the result... » | `getAll(undefined)` | Changement de signature d'appel uniquement, aucune assertion de comportement métier affectée (le test vérifie le mapping DTO, pas le filtre). Sans impact. |

Aucune assertion supprimée n'est un cas encore couvert nulle part : les deux
tests modifiés testaient explicitement le comportement bogué et ne
pouvaient pas être conservés tels quels après un fix fonctionnel — ce n'est
pas un affaiblissement de couverture, c'est la correction attendue d'un test
de caractérisation d'un bug une fois ce bug corrigé. La couverture nette
augmente (4 tests contre 2 avant, plus un test différentiel explicite).

### 1.3 Le test vérifie-t-il un comportement observable réel ?

Oui : les tests appellent `controller.getAll(...)` avec les valeurs de
paramètre que Nest fournirait réellement une fois `@Query('selectable')`
appliqué (`string | undefined`), et vérifient l'appel à
`categoryService.findAll` avec l'objet de filtre attendu — un contrat
métier, pas un détail d'implémentation interne.

### 1.4 Vérification par requête HTTP réelle

J'ai écrit un test temporaire (`categories.controller.qa-tmp.spec.ts`,
supprimé après vérification, ne figure plus dans le repo) qui démarre une
vraie application Nest (`Test.createTestingModule` + `app.listen(0)`) avec
`CategoriesController` et un mock de `CategoriesService`, puis effectue de
vraies requêtes HTTP (`http.get`) :

- `GET /categories?selectable=false` → `findAll` appelé avec `{selectable: false}`
- `GET /categories?selectable=true` → `findAll` appelé avec `{selectable: true}`
- `GET /categories` (sans query param) → `findAll` appelé avec `{selectable: false}`

Résultat : **test passé**, confirmant que le binding réel de
`@Query('selectable')` par le framework Nest (pas seulement l'appel direct
de méthode dans les specs unitaires) produit bien des filtres différents
pour `?selectable=false` et `?selectable=true`. Le fichier a été supprimé
immédiatement après (`git status` confirmé propre).

### Verdict — 1bf8197

**APPROUVÉ.** Le fix est correct, les deux tests de caractérisation modifiés
documentaient explicitement un bug et ne pouvaient être conservés après sa
correction ; le nouveau comportement est vérifié à la fois en test unitaire
et par une requête HTTP réelle (vérification temporaire, non committée). Pas
de perte de couverture silencieuse.

---

## 2. `5ae1f0a` — refactor(api): move NotFoundException/BadRequestException out of AdMapper/UserMapper

### 2.1 Diff de production — résumé

- `libs/api/adapters/src/lib/ad.mapper.ts` : `modelToDTO` ne lève plus
  `NotFoundException` sur `model === null` ; l'accès `model.id` etc. sur
  `null` lève désormais un `TypeError` natif. `owner` : au lieu de
  `UserMapper.modelToDTO(model.owner)` inconditionnel (qui cascadait dans le
  `NotFoundException` de `UserMapper` si `owner` était `null`), devient
  `model.owner ? UserMapper.modelToDTO(model.owner) : null` — un owner
  manquant dégrade maintenant vers `owner: null` dans le DTO au lieu de
  faire échouer tout le mapping.
- `libs/api/adapters/src/lib/user.mapper.ts` : `modelToDTO`,
  `modelToProfileDTO`, `dtoToModel` ne lèvent plus
  `NotFoundException`/`BadRequestException` sur entrée `null`.
- `apps/api/src/app/utils/throw-if-nullish.operator.ts` (nouveau) : opérateur
  RxJS générique qui transforme une valeur `null`/`undefined` dans un flux en
  erreur explicite.
- `apps/api/src/app/api/ads.controller.ts` : `findOne`/`findPublishedOne`
  ajoutent `throwIfNullish(() => new NotFoundException('Ad not found'))`
  avant le `map(AdMapper.modelToDTO)`.
- `apps/api/src/app/api/users.controller.ts` : `getProfile`, `findOne`,
  `createProfile`, `updateProfile` ajoutent le même garde ;
  `updateProfile` rejette en plus un payload `null` avec
  `BadRequestException('Profile payload is required')` **avant** d'appeler
  `UserMapper.dtoToModel` (ligne ~72-76).

### 2.2 Diff de test — assertion par assertion

#### `ad.mapper.spec.ts`

| Avant | Après | Verdict |
|---|---|---|
| `modelToDTO(null)` → `toThrow(NotFoundException)` + `toThrow('Ad not found')` | → `toThrow(TypeError)` | Cohérent avec le nouveau contrat du mapper (précondition, pas un cas géré). L'assertion de message est abandonnée à raison : le message d'un `TypeError` natif (`Cannot read properties of null...`) n'est pas un contrat stable à figer. **Pas de perte réelle** : le comportement observable au niveau HTTP (toujours un 404 « Ad not found ») est maintenant testé côté contrôleur (`ads.controller.spec.ts`, nouveaux tests §2.3), donc **couverture déplacée, pas supprimée**. |
| `'cascades into UserMapper.modelToDTO\'s own NotFoundException when owner is null'` → `toThrow('User not found')` | `'degrades a null/undefined owner to a null owner in the DTO...'` → `expect(dto.owner).toBeNull()` | Changement de comportement intentionnel et documenté (voir commentaire en tête de fichier + commit message), pas un simple test cassé qu'on repeint : avant, un `owner` manquant faisait échouer **tout** le mapping d'une annonce avec un message trompeur (« User not found » pour une requête sur une annonce) ; après, l'annonce se dégrade proprement avec `owner: null`, cohérent avec le traitement de tous les autres champs optionnels de ce mapper (`|| null`). C'est une amélioration défendable, pas une perte de couverture — l'ancien comportement n'était d'ailleurs déjà pas documenté ailleurs que dans ce test (« Not documented anywhere », dixit l'ancien commentaire). |
| `modelToDTOList` : `'propagates the NotFoundException if any item...'` | `'propagates the TypeError...'` | Cohérent, même remarque que ci-dessus sur le type d'erreur. |

#### `user.mapper.spec.ts`

Même schéma pour `modelToDTO`, `modelToProfileDTO`, `dtoToModel`,
`modelToDTOList` : `NotFoundException`/`BadRequestException` → `TypeError`.
Un point mérite d'être noté positivement : l'ancien test sur `dtoToModel`
documentait un message d'erreur incohérent (« User not found » sur un
`BadRequestException` de 400, sur un mapping de payload entrant, pas un
lookup) — sa suppression est saine, ce n'était pas un contrat à préserver
mais un bug de message que le commit corrige en même temps (le nouveau
message, `'Profile payload is required'`, est correct et testé côté
contrôleur, cf. `users.controller.spec.ts` L~178-183).

**Aucune assertion supprimée dans ces deux fichiers ne correspond à un
comportement qui disparaît sans couverture de remplacement.** Chaque
changement de type d'exception est mécaniquement lié au changement de
production, et chaque changement de comportement (owner dégradé, message
BadRequestException) est documenté et retesté ailleurs.

### 2.3 Vérification des appelants réels (mission point 3)

J'ai listé tous les appels à `AdMapper.*`/`UserMapper.*` dans `apps/api/src`
(hors specs) :

- **`ads.controller.ts`** :
  - `findOne` (L132-135) et `findPublishedOne` (L140-143) : **gardés** par
    `throwIfNullish(() => new NotFoundException('Ad not found'))`. Testé par
    les nouveaux `describe('AdsController.findOne')` /
    `describe('AdsController.findPublishedOne')` (`ads.controller.spec.ts`,
    ajoutés par ce commit) — `findOne('missing-ad')` avec service mocké
    `of(null)` rejette bien avec `NotFoundException`.
  - `getAll`/`getMostRecentAds`/`getMyPublications` (L77, L94, L125) :
    `AdMapper.modelToDTOList` sur le résultat de `findAllPublished`/
    `findAllByOwner` — **non gardé**, mais ces méthodes viennent de
    `Model.find().exec()` (Mongoose), qui retourne un tableau de documents
    réels, jamais d'éléments `null` en pratique. Risque théorique
    non nouveau (déjà vrai avant ce commit) et non testé avant non plus.
  - `createAd` (L161) : `AdMapper.modelToDTO` sur le résultat de
    `adsService.create(...)` → `adsRepository.createNew(...).save()` :
    un document Mongoose fraîchement sauvegardé n'est pas `null` en usage
    normal. Non gardé, mais pas un cas réaliste.
  - `publishAd` (L177) : passe par
    `PublishAuthorizationPolicy.publishIfAuthorized` →
    `AdsService.publish()` → `transitionTo()`, qui **valide déjà
    explicitement** que l'ad existe (`if (!ad) throwError(() => new
    AdNotInExpectedStateError(...))`, `ads.service.ts` L163-168) avant
    d'appeler `updateOne`. Cette erreur est convertie en `NotFoundException`
    HTTP par `mapAdTransitionError()` (`ad-transition-error.operator.ts`),
    appliqué **avant** `map(AdMapper.modelToDTO)` dans le pipe. Le null-guard
    du mapper n'était donc déjà plus la seule protection sur ce chemin avant
    ce commit — pas de régression.
- **`admin-publication.controller.ts`** (non modifié par ce commit) : les
  endpoints `reject`/`archive`/`publish` (L127, L142, L157) suivent le même
  schéma `mapAdTransitionError()` + `transitionTo()` que `publishAd` —
  protection déjà en place, indépendante du mapper. Les listes (L70, L89,
  L112) sont dans le même cas que `getAll` ci-dessus (tableaux Mongoose).
- **`users.controller.ts`** : `getProfile`, `createProfile`,
  `updateProfile`, `findOne` sont tous **gardés** par `throwIfNullish`.
  `updateProfile` rejette en plus un payload `null` par un contrôle
  explicite (L72-76) avant `UserMapper.dtoToModel`. Chacun de ces quatre
  cas a un test dédié ajouté par ce commit
  (`users.controller.spec.ts`, `rejects with a NotFoundException...` /
  `rejects a null payload with a BadRequestException...`), vérifié à
  l'exécution (voir §2.4).
- `AdMapper.modelToDTO`'s propre appel interne à `UserMapper.modelToDTO`
  (pour `owner`) : traité en §2.2 — dégradation intentionnelle vers
  `owner: null`, plus de cascade d'exception possible.

**Conclusion sur ce point** : les deux lookups directs par id
(`AdsController.findOne`/`findPublishedOne`) et les quatre endpoints
`UsersController` cités explicitement dans le message de commit sont tous
correctement gardés et testés — pas de régression 404→500 sur ces chemins.
Les endpoints de liste et les endpoints de transition (`publishAd`, et par
extension `reject`/`archive`/`publish` dans l'admin) ne sont pas gardés par
`throwIfNullish`, mais soit ne reçoivent jamais `null` en pratique
(tableaux Mongoose), soit sont déjà protégés en amont par le garde de
`transitionTo()` dans `AdsService` — ce n'est pas un trou introduit par ce
commit, c'est un état préexistant inchangé.

**Réserve mineure (non bloquante)** : `AdsRepositoryNest.updateOne` utilise
`findOneAndUpdate`, qui peut en théorie retourner `null` si le document est
supprimé entre le `findOneUnpublished`/`findOne` de garde et l'`updateOne`
(fenêtre de course très étroite). Avant ce commit, ce cas aurait
accidentellement produit un `NotFoundException` (via l'ancien
`AdMapper.modelToDTO`) ; après, il produira un `TypeError` non intercepté,
que le filtre d'exception global de Nest transforme en 500 générique au
lieu d'un 404. Aucun test, avant ou après, ne couvrait ce cas — ce n'est
donc pas une perte de couverture au sens du mandat qa-reviewer (rien n'était
« vérifié avant et ne l'est plus »), mais une dégradation de qualité de
réponse HTTP sur une fenêtre de course déjà extrêmement improbable. Je le
signale pour la trace, sans le considérer bloquant pour ce commit.

### 2.4 Exécution des tests

```
NODE_PATH=<worktree>/node_modules npx nx run-many --target=test --all
```

Nécessaire car ce worktree résout ses dépendances par remontée vers le
`node_modules` partagé du dépôt principal, sauf pour l'overlay local
(`class-validator`/`class-transformer`) documenté au sous-point 4 du
chantier (`CHANTIER-MODERNISATION.md` L549-604) — sans `NODE_PATH`,
`ValidationPipe` (ajouté par un commit **postérieur**, `3bc8dfd`, hors
scope de cette revue) échoue à charger `class-validator` en interne et fait
planter deux suites (`ads.controller.spec.ts`,
`ad-search-query.dto.spec.ts`) avec un crash de worker Jest — confirmé non
lié aux deux commits revus ici (le blocage est documenté, et disparaît
entièrement une fois `NODE_PATH` positionné comme requis).

Résultat, `NODE_PATH` positionné :

| Projet | Suites | Tests |
|---|---|---|
| dtos | — | aucun test |
| api-domain | 6 passed | 41 passed |
| webapp | 30 passed | 43 passed |
| admin | 5 passed | 9 passed, 1 skipped |
| api-adapters | 5 passed | 28 passed |
| api | 21 passed | 125 passed |

**Tout est vert sur l'ensemble du monorepo.** Aucune régression détectée
ailleurs suite aux deux commits.

### Verdict — 5ae1f0a

**APPROUVÉ.** Le refactor déplace correctement la responsabilité HTTP vers
les appelants identifiés par le commit (`AdsController.findOne`/
`findPublishedOne`, `UsersController.getProfile`/`findOne`/`createProfile`/
`updateProfile`), chacun re-testé explicitement pour le cas `null`/
`undefined`. Aucune assertion de test existante n'a été affaiblie sans
couverture de remplacement — les changements de type d'exception
(`NotFoundException`/`BadRequestException` → `TypeError`) reflètent
mécaniquement le nouveau contrat du mapper, et le seul changement de
comportement métier réel (owner dégradé vers `null` au lieu de cascader une
exception) est intentionnel, documenté, et couvert par un nouveau test
explicite. Réserve mineure et non bloquante notée en §2.3 sur une fenêtre
de course pré-existante et non testée (`updateOne`/`findOneAndUpdate`
retournant `null`), à garder à l'esprit pour une future itération mais qui
ne remet pas en cause ce commit.

---

## Verdicts (une ligne chacun)

- `1bf8197` (CategoriesController.getAll selectable filter) : **APPROUVÉ**
- `5ae1f0a` (AdMapper/UserMapper — sortie des exceptions HTTP) : **APPROUVÉ**
