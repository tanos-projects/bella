# Revue senior indépendante — qualification Express 5 et caveat NODE_OPTIONS/run-many

Date : 2026-09-25. Portée : trois commits chronologiques —
`cb1dbf1` (test additif `ad-search-query.dto.spec.ts`), `5021cb1`
(`apps/api/.env.test` + exception `.gitignore`), `2dd3da1` (mise à jour
doc §4/§7.5 de `CHANTIER-MODERNISATION.md`). Ces trois commits qualifient
les deux sous-points laissés ouverts par la revue `senior-dev` du spike
Node 24 (`CHANTIER-MODERNISATION-REVIEW-SPIKE-NODE24.md`, VALIDÉ avec
réserve non bloquante).

**Verdict global : VALIDÉ.** Les trois commits sont fidèles à ce qu'ils
prétendent avoir vérifié. J'ai reproduit indépendamment l'intégralité des
affirmations empiriques (pas seulement relu le rapport), y compris
l'overlay réel NestJS 12/Express 5.2.1/Node 24.21.0, et je n'ai trouvé
aucun écart entre ce qui est documenté et ce que le code/les tests font
réellement.

## Méthode

Node `v24.21.0` était disponible (`~/.nvm/versions/node/v24.21.0`), donc
j'ai reproduit moi-même l'overlay plutôt que de me limiter à une lecture
de cohérence, conformément au mandat `senior-dev.md` (pas de confiance sur
parole). `git status` propre avant et après toute manipulation ;
`package.json`/`yarn.lock` restaurés par `git checkout --` puis
réinstallés sous Node 22 en fin de session, `node_modules` reconfirmé
identique à l'état NestJS 11.x.

## 1. Qualification Express 5 (`cb1dbf1`)

**Grep exhaustif indépendant, refait moi-même sur `apps/api/src`** (pas
recopié depuis le rapport) :

- Tous les `@Query(...)` hors specs (`grep -rn "@Query(" apps/api/src`) :
  `AdsController.getAll`/`getMyPublications` (le DTO `AdSearchQueryDTO` via
  `adSearchQueryValidationPipe`), `AdsController.getMostRecentAds`
  (`category`/`country`/`limit`, `@Query('x')` individuels),
  `CategoriesController.getAll` (`selectable`),
  `AdminPublicationController` (`page`/`pageSize` × 3 endpoints). Aucun
  autre `@Query()` ailleurs dans `apps/api/src`. Confirmé : tous scalaires,
  aucun tableau ni objet imbriqué déclaré.
- `AdSearchQueryDTO` lu en entier (`apps/api/src/app/api/ad-search-query.dto.ts`) :
  7 champs, tous `@IsString()`/`@IsNumberString()`/`@Type(() => Number)
  @IsInt()`, aucun `@IsArray()` ni type imbriqué. Confirme le « 100 %
  scalaire » du rapport, pas une approximation.
- `.param(` : aucune occurrence hors specs. `@Res(`/`@Req(` : aucune
  occurrence. `res.status`/`res.json`/`res.send`/`res.redirect` : aucune
  occurrence — tous les contrôleurs délèguent à Nest via des
  `HttpException`. Mutation de `req.query` : aucune occurrence. Routes de
  tous les contrôleurs grep-ées pour `*`/`?`/regex dans les chaînes de
  route (`@Get('...')` etc.) : uniquement des segments littéraux et des
  `:param` simples — aucun wildcard, aucune route optionnelle/regex.
- `adSearchQueryValidationPipe` (défini dans `ads.controller.ts`, ligne 54)
  est bien l'instance réellement branchée sur `@Query(adSearchQueryValidationPipe)`
  des deux endpoints en production (`whitelist: true,
  forbidNonWhitelisted: true, transform: true`) — les tests de
  caractérisation exercent donc le pipe de production, pas une
  reconstruction isolée qui pourrait diverger.

Les 7 points de breaking changes Express 4→5 cités par le rapport
correspondent à ceux du guide de migration officiel connu (parseur query
qs→querystring, suppression `req.param()`, `res.status()` strict, routes
wildcard/regex, `req.query` non réassignable, forwarding async, signatures
`res.json/send/redirect`) — pas une liste tronquée ou orientée.

**Les 4 nouveaux tests ne sont pas des tests de complaisance.** Lus en
entier (`git show cb1dbf1`) : ils appellent
`adSearchQueryValidationPipe.transform(...)` — le pipe réel de production,
pas un mock — avec (1) la forme objet imbriqué que produirait `qs` sous
Express 4 pour `?keyword[$ne]=1`, (2) la même forme sur `minPrice`, (3) la
forme clé-littérale-à-crochets que produirait `querystring` sous Express 5
pour la même requête, (4) un tableau sur un champ scalaire. Chacun
vérifie un rejet `BadRequestException`. Ce n'est pas un test qui vérifie
que 1+1=2 : c'est la seule ligne de défense pertinente ici (le pipe doit
rejeter les deux formes, quel que soit le parseur qui les a produites),
et le rapport reconnaît lui-même la limite (pas de serveur HTTP réel, pas
de `supertest` dans ce repo — comme le reste de la suite `apps/api`) sans
la maquiller.

**Reproduction empirique intégrale, dans l'ordre du rapport :**

1. Baseline Node 22.23.2, `@nestjs/common@11.2.6`, `express@4.22.3` :
   `nx test api --skip-nx-cache` → **21 suites / 134 tests verts**,
   confirmé identique au chiffre annoncé.
2. `nx run-many --target=test --all --skip-nx-cache` sous cette baseline,
   `NODE_OPTIONS` non positionné dans le shell : les 6 projets verts —
   `api-domain` 6/41, `admin` 7/26 (1 skip), `api-adapters` 5/28, `webapp`
   39/89, `api` 21/134, `dtos` sans test. Comptes identiques à ceux
   annoncés.
3. Bump réel de `package.json` : `@nestjs/{axios,common,config,core,jwt,
   mongoose,passport,platform-express,swagger,terminus,schematics,
   testing}` vers leurs versions `~12.x` disponibles sur le registre npm
   (vérifiées une à une via `npm view <pkg> versions`, en utilisant
   `--cache $TMPDIR/npm-cache` pour contourner le cache `~/.npm`
   en lecture seule du sandbox) : `common`/`core`/`platform-express`/
   `testing`/`terminus` → `12.1.0`, `swagger` → `12.0.2` (pas de `12.1.0`
   publié pour ce paquet), `schematics` → `12.0.5`.
4. `nvm use 24.21.0` puis `corepack yarn install --ignore-engines` :
   install propre, aucun conflit bloquant. `require(...).version` confirmé
   pour chaque paquet installé : `@nestjs/common@12.1.0`,
   `express@5.2.1` niché sous
   `node_modules/@nestjs/platform-express/node_modules/express`,
   `express@4.22.3` conservé à la racine (identique au constat du rapport
   et de la revue précédente du spike Node 24).
5. `NODE_OPTIONS=--experimental-vm-modules nx test api --skip-nx-cache`
   sous cet overlay réel : **21 suites / 134 tests verts, y compris les 4
   nouveaux** — identique au chiffre annoncé, aucune divergence.
6. `nx run-many --target=test --all --skip-nx-cache` sous ce même overlay,
   `NODE_OPTIONS` non positionné dans le shell (`unset NODE_OPTIONS`
   confirmé) : **les 6 projets verts en une seule commande**, mêmes
   comptes qu'en baseline, avec le warning `ExperimentalWarning: VM
   Modules...` visible uniquement dans la sortie de la tâche `api:test` —
   preuve directe que le flag n'a atteint que cette tâche.
7. Restauration : `git checkout -- package.json yarn.lock`, `yarn
   install` sous Node 22 (sans `--ignore-engines`), `@nestjs/common`
   reconfirmé `11.2.6`, `express` racine reconfirmé `4.22.3`, `git status`
   propre. `nx run-many --target=test --all --skip-nx-cache` relancé une
   dernière fois sous cette stack restaurée : les 6 projets verts, mêmes
   comptes exacts qu'à l'étape 2.

Aucun écart entre ce que j'ai observé et ce que le rapport annonce, à
aucune étape.

## 2. Mécanisme `NODE_OPTIONS`/`run-many` (`5021cb1`)

- `apps/api/.env.test` existe, contient exactement
  `NODE_OPTIONS=--experimental-vm-modules` précédé d'un commentaire qui
  explique le mécanisme — conforme à la description du commit.
- Schéma de l'executor `@nx/jest:jest`
  (`node_modules/@nx/jest/src/executors/jest/schema.json`) : aucune
  propriété `env` — confirmé par grep, `options.env` n'existe
  effectivement pas sur cet executor.
- Mécanisme dotenv par projet+target : lu directement dans
  `node_modules/nx/dist/src/tasks-runner/task-env.js` et
  `task-env-paths.js` (`nx@22.7.12`, version confirmée dans
  `package.json`). `getEnvPathsForTask` construit bien des chemins
  `<project-root>/.env.<target>` (et variantes `.local`) et les charge via
  `loadDotEnvFilesForTask`, appelé depuis `getTaskSpecificEnv`. **Point
  vérifié plus finement que le rapport ne le détaille** : ce chargement
  n'est actif que si `process.env.NX_LOAD_DOT_ENV_FILES === 'true'` — une
  lecture isolée de `task-env.js` seul aurait pu laisser croire que c'est
  conditionné à une variable positionnée manuellement. En remontant à
  `run-many.js`, `run-one.js` et `affected.js`
  (`node_modules/nx/dist/src/command-line/.../*.js`), ces trois points
  d'entrée positionnent eux-mêmes
  `loadDotEnvFiles: process.env.NX_LOAD_DOT_ENV_FILES !== 'false'` par
  défaut, puis `run-command.js` traduit ce booléen en
  `process.env.NX_LOAD_DOT_ENV_FILES = 'true'` avant que `task-env.js` ne
  soit atteint. Donc l'affirmation du rapport (« actif par défaut pour
  `run-many`/`run-one`/`affected`, sans configuration supplémentaire ») est
  exacte de bout en bout, vérifiée à travers la chaîne complète des trois
  fichiers, pas seulement au niveau où le rapport cite le code.
- Vérifié empiriquement (voir §1, étapes 2, 6, 7 ci-dessus) : `nx run-many
  --target=test --all --skip-nx-cache`, `NODE_OPTIONS` non positionné
  dans le shell, fait passer les 6 projets ensemble aussi bien sous la
  stack actuelle (neutre) que sous l'overlay Node 24/NestJS 12/Express 5
  (résolutif) — reproduit dans les deux sens, pas supposé.

## 3. Cohérence documentaire (`2dd3da1`)

Comparaison ligne à ligne entre §4 (section "Qualification des deux
sous-points restés ouverts") et §7 point 5 d'une part, et le contenu réel
des deux commits de code d'autre part : fidèle, ni survente ni
sous-représentation. Les chiffres cités (21 suites/134 tests, versions
`12.1.0`/`5.2.1`/`24.21.0`) correspondent à ceux que j'ai moi-même
reproduits. Le document reconnaît explicitement la limite de la
qualification Express 5 (pas de serveur HTTP réel testé, uniquement la
couche de validation applicative) plutôt que de la passer sous silence —
cohérent avec ce que montre la lecture du fichier de test. §7 point 5
reformule correctement la question restante comme purement produit/infra
(adopter Node ≥24.9 par défaut), hors mandat tech-lead/senior-dev, sans
prétendre trancher ce point — cohérent avec la portée du mandat donné à
cette tâche de revue.

Seule note mineure, non bloquante : le commentaire dans
`apps/api/.env.test` référence "§7 point 5" pour le mécanisme
`NODE_OPTIONS`, ce qui est correct au moment de l'écriture, mais un futur
renumérotage de §7 (déjà arrivé une fois dans l'historique de ce document)
rendrait cette référence caduque sans qu'un grep du commentaire lui-même
le signale. Cosmétique, sans impact sur la fiabilité du contenu.

## 4. Bilan

**VALIDÉ.** Les affirmations empiriques du tech-lead — comptes de tests,
versions installées, comportement du mécanisme dotenv Nx, neutralité sous
la stack actuelle, résolution du caveat `run-many` sous l'overlay Node 24
— ont toutes été reproduites indépendamment par exécution réelle de ma
part, avec les mêmes résultats à l'unité près, y compris l'overlay complet
Node 24.21.0/NestJS 12.1.0/Express 5.2.1 (disponible dans cet
environnement, donc reproduit plutôt que supposé). Le grep exhaustif sur
les `@Query()` et les routes est confirmé correct et réellement exhaustif,
pas partiel. Les 4 tests de caractérisation ajoutés exercent le pipe de
validation réel de production sur des formes adversariales pertinentes —
ce ne sont pas des tests de complaisance. Le nettoyage post-manipulation
(`package.json`/`yarn.lock` restaurés, `node_modules` réinstallé sous
Node 22, `git status` propre) est vérifié des deux côtés.

Cette revue ne tranche pas, et ne doit pas être lue comme tranchant, la
décision produit/infra restée hors mandat : adopter Node ≥24.9 comme
runtime par défaut du poste de dev / CI / déploiement PM2-EC2. Les deux
sous-points techniques qui empêchaient de considérer le palier NestJS
11→12 "acquis en confiance" sont maintenant qualifiés et vérifiés de
façon indépendante — la décision d'adoption elle-même reste entièrement à
arbitrer par l'utilisateur.
