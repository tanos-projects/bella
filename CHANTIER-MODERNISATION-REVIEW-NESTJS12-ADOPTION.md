# Revue senior indépendante — adoption réelle NestJS 11→12 (Phase 0bis, §7.5)

Date : 2026-09-25. Portée : trois commits chronologiques —
`2acff86` (bump réel `package.json`/`yarn.lock`), `bc7b7f1` (`engines`
`>=24.9 <25` + `.nvmrc` `24.21.0`), `30c4946` (clôture doc §4/§7.5 +
correctifs `CLAUDE.md`). Contrairement aux deux spikes précédents de
cette phase (Node 24 le 2026-09-24, Express 5/`NODE_OPTIONS` le
2026-09-25 — tous deux qualifiés puis **restaurés** sans laisser de
changement de dépendances de production), ce palier-ci est resté
committé : c'est un changement réel de `package.json`/`yarn.lock`/
`engines`/`.nvmrc`, pas un overlay temporaire documenté puis annulé.
Vérification indépendante complète, conformément au mandat
`senior-dev.md` — pas de confiance sur parole.

**Verdict global : VALIDÉ.** Les trois commits sont fidèles à ce qu'ils
prétendent, la suite verte re-vérifiée par moi-même sous Node 24.21.0
correspond exactement aux chiffres annoncés, les versions bumpées
correspondent trait pour trait à ce qui avait été qualifié par les deux
spikes précédents (aucune version non qualifiée introduite), et aucune
survente ne figure dans la documentation mise à jour.

## 1. `git show --stat` sur les trois commits

- `2acff86` : `package.json` (+11/-11 versions `@nestjs/*`) et
  `yarn.lock` (248 lignes, ré-résolution transitive) — rien d'autre
  touché, pas de `jest.config.ts`/`tsconfig.spec.json`/`jest.preset.js`.
- `bc7b7f1` : `.nvmrc` (nouveau fichier, `24.21.0`) et `package.json`
  (`engines.node` `>=22 <23` → `>=24.9 <25`) — deux lignes changées
  au total, rien d'autre.
- `30c4946` : `CHANTIER-MODERNISATION.md` (+100/-3, clôture Phase 0bis
  et §7.5) et `CLAUDE.md` (+6/-3, "NestJS 11"→"NestJS 12" + deux
  paragraphes Commands/Deployment) — pas de code touché, conforme à un
  commit `docs`.

Contenu exact conforme à ce que les messages de commit annoncent, sur
les trois.

## 2. Vérification indépendante sous Node 24.21.0

`nvm use 24.21.0`, `NODE_OPTIONS` jamais positionné dans le shell
(`unset NODE_OPTIONS` confirmé, `echo $NODE_OPTIONS` vide avant chaque
commande) :

- **`nx run-many --target=test --all --skip-nx-cache`** → les 6 projets
  verts en une seule commande : `api-domain` 6 suites/41 tests,
  `api-adapters` 5/28, `admin` 7/26 (1 skip), `webapp` 39/89, `dtos`
  aucun test, `api` 21 suites/**134** tests. **Chiffres identiques à
  l'unité près à ceux annoncés par le tech-lead.**
  `ExperimentalWarning: VM Modules...` observé uniquement dans la
  sortie de la tâche `api:test` (6 workers), confirmant que
  `apps/api/.env.test` isole bien `--experimental-vm-modules` à cette
  seule tâche et ne fuit pas vers `webapp`/`admin`.
- **`nx run-many --target=build --all --skip-nx-cache`** → 3 apps
  (`api`, `webapp`, `admin`) vertes. Premier essai en échec sur
  `admin:build:production` pour un refus réseau du sandbox vers
  `fonts.googleapis.com` — sans rapport avec le bump, cause identique à
  celle déjà documentée dans le spike du 24 ; ré-exécuté en autorisant
  ce host, vert ensuite.
- **`nx run-many --target=lint --all --skip-nx-cache`** → échoue
  uniquement sur `admin`, `webapp`, `webapp-e2e`, `admin-e2e`, avec
  exactement les erreurs déjà documentées comme préexistantes et
  indépendantes de ce bump : constructeurs/`ngOnInit` vides
  (`@typescript-eslint/no-empty-function` /
  `@angular-eslint/no-empty-lifecycle-method`) dans
  `apps/admin/src/app/pages/dashboard/dashboard.component.ts`,
  `apps/webapp/src/app/shared/components/carousel/carousel.component.ts`
  et `apps/webapp/src/app/pages/my-publications/my-publications.component.ts` ;
  config `plugin:cypress/recommended` invalide sur les deux projets
  e2e. `api`/`api-domain`/`api-adapters`/`dtos` : 0 erreur (uniquement
  des warnings `no-explicit-any` préexistants). **Aucune nouvelle
  erreur de lint introduite par le bump.**

Reproduction complète, indépendante, sans écart avec les affirmations
du commit `2acff86`.

## 3. Cohérence des versions bumpées avec les deux spikes précédents

Comparaison directe entre le diff `package.json` de `2acff86` et les
versions citées dans les deux revues précédentes
(`CHANTIER-MODERNISATION-REVIEW-SPIKE-NODE24.md` l.33-35 et
`CHANTIER-MODERNISATION-REVIEW-EXPRESS5-NODEOPTIONS.md` l.89-96) :
`@nestjs/axios ~12.0.1`, `common ~12.1.0`, `config ~12.0.1`,
`core ~12.1.0`, `mongoose ~12.0.0`, `passport ~12.0.0`,
`platform-express ~12.1.0`, `swagger ~12.0.2`, `terminus ~12.1.0`,
`schematics ~12.0.5`, `testing ~12.1.0` — **identiques trait pour
trait** à ce qui avait été qualifié deux fois auparavant (`@nestjs/jwt`
déjà à `~12.0.2` sur la branche, non touché ici, cohérent). Aucune
version différente ou non qualifiée introduite dans ce commit.

`git show 2acff86 -- yarn.lock` fait aussi apparaître un certain nombre
de bumps transitifs mineurs (`dotenv`, `swagger-ui-dist`, `file-type`,
`js-yaml`, `token-types`/`strtok3`, `@microsoft/tsdoc`, etc.) — attendus
comme conséquence normale d'un `yarn install` réel sur un `package.json`
changé (dépendances de `@nestjs/config`/`@nestjs/swagger`/`@nestjs/terminus`),
non individuellement cités dans le message de commit mais sans incidence
observée : `build`/`lint`/`test` verts sur les 6 projets couvre déjà leur
effet de bord. Pas un défaut de ce commit.

## 4. `express@5.2.1` toujours nesté, pas promu à la racine

Vérifié directement dans `node_modules` et dans `yarn.lock` :

- `node_modules/@nestjs/platform-express/node_modules/express/package.json`
  → `"version": "5.2.1"`.
- `node_modules/express/package.json` (racine) → `"version": "4.22.3"`.
- `yarn.lock` : une seule entrée `express@5.2.1, express@^5.2.1` (le
  peer exact de `@nestjs/platform-express@12.1.0`, `"express": "5.2.1"`
  dans son `package.json`) et une entrée séparée
  `express@^4.21.2, express@^4.22.1` résolue en 4.x — cohérente avec
  `swagger-ui-express` (`"express": "^4.18.2"` en devDependency,
  `">=4.0.0 || >=5.0.0-beta"` en peer, donc compatible avec les deux
  mais épinglé à 4.x par Yarn 1 côté racine). **Aucune promotion
  d'Express 5 à la racine** — le risque documenté (casser
  `swagger-ui-express`) reste écarté.

## 5. `.nvmrc` / `engines`

`.nvmrc` → `24.21.0` exact. `package.json` `engines.node` →
`>=24.9 <25`. Cohérents entre eux (`24.21.0` satisfait la plage) et
avec ce qui tourne réellement : toute la vérification du point 2 a été
exécutée sous `24.21.0` via `nvm use`, verte de bout en bout. La borne
basse (`24.9`) correspond bien au seuil technique réel (support natif
`require(esm)` de Jest, cause directe du verrou documenté en §1.4/§4) —
pas une borne arbitraire.

## 6. `~/.nvm/alias/default`

Lu directement (`cat ~/.nvm/alias/default`) : contenu `22`. **Non
touché**, conforme à l'affirmation du tech-lead. `nvm ls` confirme par
ailleurs que l'alias `default`/`node`/`stable` pointe vers `24.21.0`
dans cette installation nvm globale — mais ce mapping `stable`/`node`
préexistait indépendamment de ce chantier (probablement réglé par
l'utilisateur ou un autre outil hors de cette session) ; le fichier
`default` que ce chantier avait le mandat explicite de ne pas toucher
contient bien `22`, inchangé.

## 7. `CLAUDE.md` (diff de `30c4946`)

- `"NestJS 11"` → `"NestJS 12"` (ligne 11) : exact, `node_modules/@nestjs/core`
  confirmé en `12.1.0`.
- Ajout §Commands (exigence `Node >=24.9 <25`, `.nvmrc`, mécanisme
  `apps/api/.env.test`) : fidèle au comportement vérifié au point 2
  ci-dessus (le flag `--experimental-vm-modules` n'atteint bien que la
  tâche `api:test`).
- Ajout §Deployment (`ecosystem.config.js` ne pingle pas de version
  Node) : `ecosystem.config.js` lu en entier par moi-même — aucun champ
  `interpreter`, seulement `script: 'dist/apps/api/main.js'` et des
  blocs `env`/`deploy`. Confirmé : PM2 utilisera le `node` trouvé sur
  le `PATH` de l'host EC2, sans pin explicite dans ce fichier. L'ajout
  documentaire est fidèle à l'état réel du fichier, pas une supposition.

## 8. `CHANTIER-MODERNISATION.md` — clôture Phase 0bis / §7.5

Relu en entier (§4 section "Phase 0bis — ADOPTION RÉELLE" et §7 point
5 reformulé). Points vérifiés :

- Distingue correctement cette adoption des deux spikes précédents
  (explicite : "les deux spikes ci-dessus... ont chacun **restauré**...
  zéro commit de code de production n'en avait résulté... Cette fois,
  le bump est resté").
- Chiffres de tests, versions, et séquence de commits cités
  correspondent à ce que j'ai vérifié indépendamment aux points 1-6
  ci-dessus.
- **Pas de survente sur la production EC2** : le texte dit explicitement
  que la mise à niveau de l'host EC2 réel "reste hors mandat, aucun
  accès à cette infrastructure, rien exécuté dessus" et que ce point
  "reste ouvert" — cohérent avec le fait, vérifié par moi au point 7,
  qu'`ecosystem.config.js` ne référence aucune version Node et n'a pas
  été modifié. Aucune affirmation trompeuse laissant croire que la
  prod tourne déjà sous NestJS 12/Node 24.
- Mention "aucune configuration CI n'existe dans ce dépôt" vérifiée
  moi-même (`find` sur `.github/workflows`, `.gitlab-ci.yml` — rien
  trouvé) : exacte.
- `~/.nvm/alias/default` "non touché" : cohérent avec le point 6
  ci-dessus.

Aucun écart trouvé entre la documentation et l'état réel du code.

## 9. Verdict

**VALIDÉ.**

Ce palier constitue un changement de risque plus élevé que les deux
spikes précédents de cette phase — dépendances de production
réellement modifiées, `engines`/`.nvmrc` changés pour de vrai — et il a
été traité avec la rigueur que ce niveau de risque exige : versions
bumpées identiques à ce qui avait été qualifié deux fois auparavant
(aucune dérive non qualifiée), suite `build`/`lint`/`test` re-vérifiée
sous Node 24.21.0 avant chaque commit et re-confirmée indépendamment
par moi ici avec des chiffres identiques à l'unité près, nesting
`express@5.2.1` toujours correct (pas de promotion à la racine),
`.nvmrc`/`engines` cohérents entre eux et avec l'environnement réel,
`~/.nvm/alias/default` confirmé intact, et documentation (`CLAUDE.md` +
`CHANTIER-MODERNISATION.md`) fidèle à l'état réel du code sans survente
sur ce qui reste hors mandat (l'upgrade de l'host EC2 de production).

Cette revue ne tranche pas, et ne doit pas être lue comme tranchant, la
décision produit/infra restée explicitement hors mandat : la mise à
niveau réelle de l'host EC2 (Node ≥24.9 sur ce host, `pm2 reload`) et,
si souhaité, `~/.nvm/alias/default`. Ces deux points restent
entièrement à arbitrer par l'utilisateur, en dehors du périmètre
tech-lead/senior-dev.
