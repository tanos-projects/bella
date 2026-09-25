# Revue senior-dev — reprise spike Node 24 / NestJS 12 (commit `0263cd0`)

**Verdict : VALIDÉ, avec une réserve non bloquante (§7 point 5 périmé) et un
rappel de périmètre (ce spike documente une possibilité technique, pas une
recommandation d'adoption).**

## Méthode

Vérification indépendante par lecture de code **et exécution réelle** — pas
de confiance sur parole envers le rapport du tech-lead, conformément au
mandat `senior-dev.md`. Node `v24.21.0` était disponible dans cet
environnement (`~/.nvm/versions/node/v24.21.0`), donc j'ai reproduit
moi-même l'essentiel du spike plutôt que de me limiter à une revue de
cohérence : bump réel de `package.json` vers NestJS 12.1.0, `yarn install
--ignore-engines` sous Node 24 via `corepack`, exécution de `nx test api`
et `nx test webapp` avec `NODE_OPTIONS=--experimental-vm-modules`, puis
restauration scrupuleuse (`git checkout --`, réinstallation sous Node 22).
`git status` propre confirmé avant et après.

## 1. Le commit ne contient que de la documentation

`git show --stat 0263cd0` : un seul fichier touché,
`CHANTIER-MODERNISATION.md` (206 insertions). `git log --oneline` du
worktree confirme qu'aucun commit de code ne suit celui-ci. `git status`
en tout début de revue : `nothing to commit, working tree clean`. Aucune
trace de `package.json`/`yarn.lock`/`jest.config.ts`/`tsconfig.spec.json`
modifiés sur la branche pour ce spike — conforme à ce que le document
affirme au point 8 de la reprise (§4 Phase 0bis) et point 6 de §1.4.

## 2. Reproduction empirique du résultat central

Bump réel des versions exactement comme listées au point 3 de la reprise
(`@nestjs/axios ~12.0.1`, `common`/`core`/`platform-express`/`testing`
`~12.1.0`, `config ~12.0.1`, `mongoose(-wrapper) ~12.0.0`, `passport
~12.0.0`, `swagger ~12.0.2`, `terminus ~12.1.0`, `schematics ~12.0.5`).
`yarn install --ignore-engines` sous `nvm use v24.21.0` (yarn obtenu via
`corepack`, comme documenté) : install propre, aucun conflit de peer
bloquant. Versions installées vérifiées une à une par `require(...).version`
— toutes exactement celles annoncées, y compris `express@5.2.1` niché sous
`node_modules/@nestjs/platform-express/node_modules/express` avec
`express@4.22.3` conservé à la racine (confirmé, correspond au point 7 de
la reprise).

**Point technique le plus précis du document, vérifié à la main avant de
lancer les tests** :

```
$ node -e "console.log(typeof require('vm').SourceTextModule)"
undefined
$ NODE_OPTIONS=--experimental-vm-modules node -e "console.log(typeof require('vm').SourceTextModule)"
function
```

Ceci confirme exactement l'affirmation du point 2 de la reprise (§4) :
Node ≥24.9 seul ne suffit pas, `vm.SourceTextModule` reste derrière le flag
expérimental même sous Node 24.21 — ce n'est pas une reformulation vague du
message d'erreur Jest, c'est vérifiable directement au niveau du runtime
Node, et le document a raison sur ce point fin.

**Résultat central reproduit à l'identique** :

```
$ NODE_OPTIONS=--experimental-vm-modules npx nx test api --skip-nx-cache
Test Suites: 21 passed, 21 total
Tests:       130 passed, 130 total
```

21 suites / 130 tests, tous verts, sous NestJS 12.1.0 + Node 24.21.0 —
identique au chiffre annoncé et à la baseline NestJS 11.x. `git status
--short apps/api/jest.config.ts apps/api/tsconfig.spec.json jest.preset.js`
vide pendant toute la manipulation : aucun de ces fichiers n'a été touché,
confirmant l'affirmation "sans aucune modification de jest.config.ts ni
tsconfig.spec.json".

## 3. Le caveat `run-many`/`NODE_OPTIONS` est réel, pas une hypothèse

Reproduit indépendamment plutôt qu'accepté sur la foi du document :

```
$ NODE_OPTIONS=--experimental-vm-modules npx nx test webapp --skip-nx-cache
Test Suites: 39 failed, 39 total
```

39 suites en échec (`jest-preset-angular`/`zone` cassé par le mode ESM
expérimental hérité via l'environnement), confirmant que le flag global
casse bien `webapp` comme documenté au point 6 de la reprise (et au point 3
de §1.4). Le document ne survend pas ce caveat — il est aussi grave que
décrit, et la piste de contournement qu'il propose (`options.env` scopé au
target `api`) est correctement marquée comme non explorée plutôt que
présentée comme résolue.

## 4. Nettoyage — restauration vérifiée, pas seulement affirmée

`git checkout -- package.json yarn.lock` puis `yarn install` sous Node 22
(sans `--ignore-engines`, conforme à `engines`). Revérifié après coup :
`@nestjs/common` revenu à `11.2.6`, `express` racine revenu à `4.22.3`,
`git status --short` vide. `npx nx run-many --target=test --all
--skip-nx-cache` sous Node 22 relancé en entier par moi-même (pas repris du
rapport) : 6 projets verts, `api` toujours 21 suites/130 tests. Aucune
trace résiduelle du spike n'a été laissée dans le worktree par ma propre
manipulation ni par celle du tech-lead.

## 5. Cohérence du diagnostic technique

Le diagnostic (Jest délègue le chargement ESM au `require(esm)` natif de
Node quand `vm.SourceTextModule.prototype.hasAsyncGraph` existe, lequel
n'existe qu'avec Node ≥24.9 **et** le flag expérimental) est cohérent avec
ce que j'ai observé en isolant le test du flag ci-dessus, et la distinction
que fait le document entre ce mécanisme et le mode ESM natif "ancien style"
qui avait échoué au spike du 24 (linking `export * from`) est correcte —
ce sont deux chemins de code différents dans `jest-runtime`, pas la même
tentative rejouée avec plus de patience.

## 6. Limites reconnues par le tech-lead — évaluées, pas seulement listées

- **Express 5.2.1 non qualifié au runtime** : confirmé toujours non testé
  (pas de `.env`/MongoDB dans mon environnement non plus). C'est
  correctement isolé comme sous-point à part entière ("pas traité dans
  cette session") plutôt que noyé dans la conclusion positive du point 4 —
  le document ne conclut nulle part que la migration Express est sans
  risque, seulement qu'elle reste non qualifiée. J'estime ce point
  correctement dimensionné : le risque documenté (changements de
  comportement runtime sur le routage/query-parsing) est réel et mérite
  bien des tests de caractérisation dédiés avant adoption, pas un simple
  `nx build` vert.
- **Caveat `run-many`** : voir §3 ci-dessus, vérifié réel et correctement
  décrit comme point ouvert plutôt que contourné en douce.
- **Décision runtime hors mandat** : le document dit explicitement au
  point 9 de la reprise que faire de Node 24 le runtime par défaut du
  poste de dev/CI/PM2-EC2 est "hors mandat de ce spike, à remonter
  séparément à l'utilisateur" — conforme au mandat `senior-dev.md`
  lui-même, qui me demande de juger la fiabilité de la documentation, pas
  de trancher cette décision produit. Je ne la tranche donc pas ici.

## 7. Réserve — §7 point 5 n'a pas été mis à jour, contrairement aux points 2/3/4

Les questions ouvertes §7.2, §7.3 et §7.4 portent toutes la mention
"RÉPONDUE" avec une date, une fois tranchées. **§7 point 5 ("NestJS 12 —
le bénéfice justifie-t-il le temps d'investiguer/implémenter la solution
Babel-ESM ?") n'a pas été touché par ce commit** — il pose toujours la
question dans les termes du 2026-09-24 (Babel-ESM), alors que §1.4 et §4
documentent depuis le 2026-09-25 que **ni Babel-ESM ni le mode ESM natif
"ancien style" n'ont été nécessaires** : la voie qui fonctionne est un
changement de runtime Node, pas une configuration Jest. La question posée
en §7.5 est donc partiellement obsolète dans sa formulation — elle continue
de cadrer la décision autour d'un coût d'investigation Jest qui n'est plus
le bon calcul depuis la reprise du spike. Le vrai arbitrage qui reste
ouvert pour l'utilisateur ("le bénéfice de fermer cet écart justifie-t-il
de faire de Node 24 le runtime par défaut du poste de dev/CI/PM2-EC2,
sachant le caveat `run-many` et Express 5 non qualifié ?") est correctement
formulé en toutes lettres au point 9 de la reprise (§4), mais **cette
reformulation n'a pas été reportée dans la liste consolidée des questions
ouvertes §7**, ce qui est l'endroit où un utilisateur pressé irait chercher
l'état des décisions en attente. Ce n'est pas une inexactitude factuelle —
tout ce qui est écrit en §1.4/§4 est vérifié exact — c'est un défaut de
maintenance croisée entre deux sections du même document, qui pourrait
faire relire §7.5 comme "toujours en attente d'un spike Babel-ESM" à
quelqu'un qui ne relit pas aussi §4 en entier.

**Recommandation concrète** : reformuler §7 point 5 pour refléter l'état
réel post-reprise (verrou technique levé, arbitrage restant = adoption
runtime Node 24, pas investigation Jest), en reprenant le point 9 de §4.
Non bloquant pour le verdict de cette revue — la documentation elle-même
(§1.4, §4) est fidèle et complète — mais à corriger avant qu'une session
future ne s'appuie sur §7 seul pour l'état des lieux.

## 8. Bilan

Le rapport du tech-lead est fidèle à ce qu'il prétend avoir vérifié : les
chiffres (21/130), les versions installées, le mécanisme technique fin
(`vm.SourceTextModule` derrière flag même sous Node 24), et les deux
limites reconnues (Express 5, caveat `run-many`) sont tous vérifiés exacts
par exécution réelle de ma part, pas seulement plausibles sur relecture.
Le nettoyage est complet et vérifié des deux côtés (avant ma manipulation
et après). La seule faiblesse trouvée est documentaire et mineure (§7.5
non resynchronisé avec §1.4/§4), sans impact sur la fiabilité du contenu
technique lui-même.

La décision d'adopter Node 24 comme runtime par défaut reste, comme le
document le dit lui-même, hors mandat de ce spike et hors mandat de cette
revue — à remonter à l'utilisateur, avec en tête que deux sous-points
(Express 5, caveat `run-many`) restent à qualifier avant une adoption en
confiance.
