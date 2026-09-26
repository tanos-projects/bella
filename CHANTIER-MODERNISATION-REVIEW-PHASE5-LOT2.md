# Revue senior indépendante — Phase 5, suite (12 "sans spec" + premier lot "avec spec")

Date : 2026-09-25. Portée : les 21 commits produits par la session
tech-lead après la revue du lot pilote (`bd92ebf`..`34742cf`), c'est-à-dire
les 12 composants "sans spec" convertis en `standalone: true` et les 7
premiers composants "avec spec" convertis (code de production
uniquement — la légitimité des 7 éditions de `.spec.ts` associées est le
mandat exclusif de `qa-reviewer`, traité dans un rapport séparé
`CHANTIER-MODERNISATION-QA-PHASE5-LOT1.md`, non lu ni jugé ici). Aucun
fichier n'est resté modifié par cette revue : deux allers-retours de test
empirique (voir §2) ont édité puis restauré `header.component.ts` et
`profile.component.ts`, `git status`/`git diff` vérifiés propres avant
d'écrire ce document.

## Verdict global

**Validé avec réserves mineures — aucun blocage sur le code livré, une
imprécision de rapport à corriger, et une découverte hors-périmètre
(flakiness `api:test`) à signaler avant de considérer `nx run-many
--target={build,lint,test} --all` comme un filet fiable pour la suite de
cette phase.**

Les 12 conversions "sans spec" et les 5 commits de code "avec spec"
échantillonnés (11 des 19 composants au total, avec relecture de diff
complète pour 9 d'entre eux) sont propres : aucun changement de
comportement caché, aucun `NgModule` laissé à déclarer un composant
devenu standalone, aucune référence pendante vers un module supprimé.
Le garde-fou `nx build`/`NG8001` revendiqué par le Tech Lead est
**vérifié empiriquement par moi-même**, deux fois, sur deux composants
différents (un avec spec, un sans spec) — confirmé réel et indépendant de
`NO_ERRORS_SCHEMA`. Le tri par accessibilité est appliqué correctement,
avec une seule zone grise (`LoggedInCallbackComponent`) déjà signalée
honnêtement par le Tech Lead lui-même dans son propre message de commit.

## 1. Vérification des 12 conversions "sans spec"

Échantillon lu en diff intégral (`git show`) : `SearchResultsComponent`
(b8dc471, public), `AdContactsComponent` (cf086c4, public),
`ProfileComponent` (9c623c3, public), `AdsPreviewerComponent` (e9391b7,
public), `SearchFilterComponent`+`SearchFilterButtonComponent` (398e520,
public), `LoggedInCallbackComponent` (df4168b, Auth0-gated),
`CreateProfileComponent` (15ff85b, Auth0-gated), `PostAnAdComponent`
(ea0ee06, Auth0-gated), les 3 champs Formly (ca8f0a6, Auth0-gated) — soit
9 des 9 commits, couvrant les 12 composants annoncés, mélange
public/Auth0-gated comme demandé.

- **Absence de spec confirmée, pas juste affirmée** : pour chacun des 12,
  vérifié qu'aucun `.spec.ts` adjacent n'existe et qu'aucun commit ne
  touche un fichier de test. Cohérent avec le chiffrage déjà vérifié dans
  la revue du pilote.
- **`NgModule` hôte nettoyé, pas seulement "ça build"** : les 9 wrapper
  modules correspondants (`SearchResultsModule`, `ProfileModule`,
  `AdContactsModule`, `AdsPreviewerModule`, `SearchFilterModule`,
  `SearchFilterButtonModule`, `CreateProfileModule`,
  `NgSelectFormFieldModule`, `PictureUploaderFormFieldModule`) sont
  effectivement supprimés (`git log --diff-filter=D`), et
  `grep -rn` sur tout `apps/webapp/src` pour chacun de ces 9 noms ne
  retourne **aucune** référence pendante — pas un seul cas de module
  laissé importé/déclaré "par accident" pendant que le composant devient
  standalone. C'est le point le plus à risque du mandat (item 4) et il
  est net.
- **Pas de changement de comportement caché** — deux cas à nuancer, tous
  deux vérifiés sûrs :
  - `ProfileService` et (dans le lot avec-spec) `LoadingService` passent
    de `@Injectable()` porté par un `Module.forRoot()` unique appelé dans
    `AppModule`, à `@Injectable({ providedIn: 'root' })`. Vérifié
    équivalent : l'ancien `forRoot()` n'était appelé qu'une fois, à la
    racine, donc le singleton résultant est identique — ce n'est pas une
    portée élargie ni rétrécie, juste rendu tree-shakable.
  - `AdsPreviewerComponent` et `CarouselComponent` déplacent
    `CUSTOM_ELEMENTS_SCHEMA` du `NgModule` supprimé vers le composant
    standalone lui-même (nécessaire pour les web components Swiper
    `<swiper-container>`/`<swiper-slide>`) — comportement préservé,
    vérifié par lecture du diff, pas supposé.
- **Un flou honnêtement documenté, pas une erreur cachée** :
  `LoggedInCallbackComponent` est classé "Auth0-gated" alors que la route
  `loggedIn` (`app-routing.module.ts`) ne porte **aucun** guard — vérifié
  moi-même en lisant `app-routing.module.ts` en entier. Le message de
  commit `df4168b` le dit explicitement : *"the route carries no guard,
  but the component is only meaningfully exercised via the real Auth0
  redirect flow"*. Ce n'est donc pas une classification erronée cachée
  (le mandat demandait de vérifier qu'aucun composant n'était mal classé
  sans que ce soit assumé) — c'est une décision défendable et
  transparente : le composant est bien navigable sans être connecté,
  mais son seul comportement testable dépend du flux de redirection
  Auth0 réel. Voir §3 pour plus de détail.

## 2. Garde-fou `nx build`/`NG8001` — reproduit empiriquement moi-même, deux fois

Le rapport du Tech Lead affirme avoir vérifié ce garde-fou sur
`HeaderComponent` uniquement. Le mandat demandait explicitement de ne pas
se contenter de sa parole, et de tester au moins un deuxième cas pour
écarter une coïncidence liée à ce composant précis.

**Test 1 — `HeaderComponent` (avec spec, public), refait moi-même** :
retiré `LogoutButtonModule` du tableau `imports` standalone
(`bella-logout-btn` reste dans le template) ; `nx build webapp
--skip-nx-cache` échoue immédiatement :
```
error NG8001: 'bella-logout-btn' is not a known element:
1. If 'bella-logout-btn' is an Angular component, then verify that it is
included in the '@Component.imports' of this component.
```
pointant `header.component.html:40:11`, la ligne exacte du template.
Import remis, `git diff --stat` confirmé vide, `nx build webapp
--skip-nx-cache` de nouveau vert.

**Test 2 — `ProfileComponent` (sans spec, public), pour écarter la
coïncidence** : retiré `FooterComponent` du tableau `imports`
(`bella-footer` reste dans le template) ; échec immédiat et identique :
```
error NG8001: 'bella-footer' is not a known element: [...]
```
pointant `profile.component.html:21:3`. Import remis, `git diff --stat`
vide, build revérifié vert.

**Conclusion** : l'hypothèse du Tech Lead est confirmée indépendamment,
pas seulement crue sur parole, et sur un deuxième composant qui n'a même
pas de spec — ce qui écarte à la fois "coïncidence liée à
`header.component.ts`" et "artefact du schéma utilisé par son spec"
(`ProfileComponent` n'a pas de spec du tout, donc pas de schéma en jeu
côté test ; l'échec vient uniquement de la compilation du template en
mode `strictTemplates`). `nx build webapp` est un garde-fou réel pour
cette classe de bug (import standalone manquant pour un enfant de
template `bella-*`), confirmé sur deux cas indépendants, pas un seul.

*Note opérationnelle* : le premier essai de ce test a été refusé une fois
par le classificateur d'auto-mode ("Modify Shared Resources"), très
probablement parce qu'un agent `qa-reviewer` travaillait en parallèle
dans ce même worktree au même moment (un fichier
`CHANTIER-MODERNISATION-QA-PHASE5-LOT1.md` non suivi est apparu pendant
cette session). Le fichier source a été immédiatement restauré
(`git diff` vérifié vide) avant de retenter, quelques minutes plus tard,
avec succès. À noter pour l'utilisateur : faire tourner `senior-dev` et
`qa-reviewer` en parallèle sur le même worktree crée un vrai risque de
collision d'édition, pas seulement une gêne de permission — voir la
question ouverte en fin de document.

## 3. Tri par accessibilité — vérifié route par route, pas supposé

Reconstitué indépendamment `app-routing.module.ts` en entier (pas
seulement les routes citées par le Tech Lead) :

| Route | Guards | Composant(s) concerné(s) |
|---|---|---|
| `annonces/:category/:title/:id` | aucun | (`AdDetailComponent`, hors liste des 12) |
| `annonces` (`MainModule`) | `WelcomeGuard` (canActivate, pas login) | `SearchResultsComponent`, `SearchFilterComponent`/`Button` |
| `account` | `WelcomeGuard` + `AuthGuard` | `CreateProfileComponent` (via route enfant `create-profile`, guard du parent vérifié applicable aux enfants) |
| `post-an-ad` | `WelcomeGuard` + `AuthGuard` + `CompleteProfileGuard` | `PostAnAdComponent`, et transitivement les 3 champs Formly (via `AdFormModule` → `FormModule`, usage confirmé exclusif par grep) |
| `profil/:id/:username` | `WelcomeGuard` seul | `ProfileComponent` |
| `loggedIn` | **aucun** | `LoggedInCallbackComponent` — voir §1 |

- **Formly (`NgSelectFormFieldComponent`, `SteppedFormFieldComponent`,
  `PictureUploaderFormFieldComponent`)** : confirmé qu'ils ne sont
  référencés **que** par classe dans `FormlyModule.forChild({ types:
  [...] })` de `form.module.ts`, jamais par sélecteur de template
  (`grep` sur tout `apps/webapp/src/**/*.html` pour les trois sélecteurs
  : zéro résultat). `FormModule` n'est importé que par
  `ad-form.module.ts` (sous `post-an-ad`, gated) et `account.module.ts`
  (sous `account`, gated) — confirmé par grep, pas supposé. Classification
  "Auth0-gated" correcte.
- **`CreateProfileComponent`** : la route `create-profile` elle-même ne
  porte pas de guard propre, mais elle est déclarée comme route **enfant**
  de `account` dans `AccountRoutingModule`, et `account` porte `AuthGuard`
  au niveau parent dans `app-routing.module.ts` — un `canActivate` sur un
  `loadChildren` s'applique à toute navigation qui matche ce segment,
  enfants compris. Classification "Auth0-gated" correcte, vérifiée par la
  mécanique de routage réelle, pas par déduction paresseuse.
- **Aucun composant public traité comme gated, ni l'inverse**, à
  l'exception du flou déjà documenté sur `LoggedInCallbackComponent`
  (§1) — qui est un flou honnête, pas une erreur.

## 4. Cohérence `NgModule` hôte — propagation vérifiée au-delà du seul
   consommateur principal

Point notable trouvé en creusant les commits "avec spec" (hors mandat
strict sur les 12 "sans spec", mais révélateur de la rigueur générale) :
la conversion de `HeaderComponent` (commit `321656a`) touche **cinq**
fichiers consommateurs en une seule fois (`ad-detail.module.ts`,
`main.module.ts`, `my-publications.module.ts`,
`profile.component.ts`, `titled-page.module.ts`), pas seulement le
premier rencontré. Vérifié que `profile.component.ts` (converti
sans-spec trois commits plus tôt, `9c623c3`) a bien été mis à jour à
nouveau ici pour suivre le renommage `HeaderModule` → `HeaderComponent`,
puis une troisième fois par `a26fa75` pour `FooterModule` →
`FooterComponent` — trois commits différents touchant le même fichier
consommateur, chacun cohérent avec l'état du moment. C'est le
comportement correct (propager à *tous* les points d'import, pas
seulement au premier module qui a motivé la conversion), et il est
appliqué de façon répétée, pas une fois par chance.

## 5. `nx run-many --target={build,lint,test} --all` relancé moi-même sur
   les 8 projets (webapp, admin, api, api-domain, api-adapters, dtos,
   webapp-e2e, admin-e2e)

Relancé sans cache (`--skip-nx-cache`) projet par projet là où le premier
passage donnait un résultat ambigu, pour ne pas me fier à un hit de cache
qui pourrait dater d'avant les 21 commits.

| Projet | Résultat | Commentaire |
|---|---|---|
| `webapp` build | vert (frais) | budget bundle dépassé, préexistant |
| `webapp` test | 38/38 suites, 87/87 tests (frais) | identique au baseline annoncé |
| `webapp` lint | 39 problems (5 erreurs/34 warnings) (frais) | identique au baseline annoncé |
| `admin` test | 7/7 suites, 25 passed/1 skipped/26 total | `admin` non touché par ces 21 commits — baseline pré-existante, hors périmètre |
| `admin` lint | 13 problems (3 erreurs/10 warnings) | idem, non lié à `@angular-eslint/prefer-standalone` (qui n'est pas la même mesure que le chiffrage du pilote) |
| `admin` build | échoue en premier passage (**sandbox**, `fonts.googleapis.com` bloqué), **vert** une fois le domaine autorisé et le build relancé sans cache | pas une régression : artefact d'environnement, pas de code |
| `api` build | vert (frais) | non touché |
| `api` lint | 120 warnings, 0 erreur | non touché |
| `api` test | **flaky, confirmé et diagnostiqué (voir ci-dessous)** | non touché par Phase 5, mais réel |
| `api-domain` test/lint | 6/6 suites 41/41 tests ; 3 warnings | non touché |
| `api-adapters` test/lint | 5/5 suites 28/28 tests ; 21 warnings | non touché |
| `dtos` lint | 1 warning inoffensif | non touché |
| `webapp-e2e`/`admin-e2e` lint | échec (`plugin:cypress/recommended` config cassée) | déjà documenté comme pré-existant et indépendant dans la revue du pilote — reconfirmé, pas une régression |

**Découverte hors périmètre Phase 5, mais réelle : `api:test` est
authentiquement flaky, cause identifiée.** Deux suites
(`ads.controller.spec.ts`, `ad-search-query.dto.spec.ts`) échouent de
façon non déterministe selon l'ordre d'exécution des fichiers dans le
worker Jest, avec le message trompeur *"The class-validator package is
missing"*. Diagnostiqué en isolant la cause réelle (fichier de test
temporaire, jamais commité, supprimé aussitôt le diagnostic terminé,
`git status` vérifié propre) : ce n'est **pas** `class-validator` qui
manque (`require('class-validator')` réussit dans tous les contextes
testés séparément) — c'est `TypeError: Reflect.getMetadata is not a
function`, parce que `apps/api/src/app/api/ad-search-query.dto.ts`
utilise les décorateurs `class-transformer`/`class-validator`
(`@Type(() => Number)`) sans qu'aucun fichier de ce projet n'importe
explicitement `reflect-metadata` (`grep` sur tout `apps/api` : zéro
résultat, y compris dans `main.ts`). En production ça "marche" par
accident parce que `@nestjs/core` importe `reflect-metadata` comme effet
de bord avant que ces décorateurs ne s'exécutent ; en test unitaire
isolé, selon l'ordre de chargement des fichiers par le worker Jest,
`ads.controller.ts` (qui instancie un `ValidationPipe` **au chargement du
module**, ligne 54, pas dans un constructeur) peut s'exécuter avant que
quoi que ce soit n'ait polyfillé `Reflect.getMetadata`. `@nestjs/common`
avale l'erreur réelle et affiche un message générique et faux
("package is missing") qui a fait perdre du temps au diagnostic.
Confirmé reproductible de façon répétée (`nx test api --skip-nx-cache`,
en isolation et en suite complète, avec et sans `--runInBand`) — ce
n'est pas un simple hoquet du sandbox.

Ce bug est **antérieur à cette session** (aucun des 21 commits Phase 5 ne
touche `apps/api`) et **hors périmètre** de cette revue Phase 5
(webapp). Mais il invalide, dès aujourd'hui, la prémisse du critère
d'acceptation Phase 5 corrigé (§8 amendement 4, repris en §4 Phase 5) qui
exige `nx run-many --target={build,lint,test} --all` **vert** par
sous-vague : ce n'est déjà pas vrai maintenant, indépendamment de la
Phase 5. Il faut soit corriger ce bug de test avant de clôturer la
sous-vague webapp (ajouter `import 'reflect-metadata';` en tête de
`ads.controller.ts`/`ad-search-query.dto.ts`, ou un `setupFiles` Jest
global — mais c'est un changement de code, hors du mandat de cette
revue), soit documenter explicitement cette exception connue dans le
critère d'acceptation pour ne pas bloquer la Phase 5 dessus par surprise.

## 6. Le chiffre "19 commits de code" du rapport est inexact — recalculé

Recompté precisément les commits entre `bd92ebf` (exclu) et `34742cf`
(exclu) : **21 commits**, pas 19 — 9 commits "sans spec" (12 composants)
+ 5 commits refactor "avec spec" (7 composants) + 7 commits d'édition de
spec isolée (un par composant "avec spec"). Écart de 2, purement
arithmétique, sans conséquence sur le contenu ou la rigueur du travail
(chaque commit individuel vérifié ci-dessus est correct) — mais à
corriger dans la doc de synthèse pour ne pas propager un chiffre faux
dans une future session qui s'y fierait sans recompter.

## Résumé des amendements demandés

1. **Corriger le décompte "19 commits de code"** → 21 (9 sans-spec + 5
   avec-spec-code + 7 avec-spec-spec), dans la synthèse Phase 5 du
   document.
2. **Traiter la flakiness `api:test` avant de considérer le critère
   d'acceptation `nx run-many --all` vert comme acquis** pour la
   sous-vague webapp — soit fixer (`import 'reflect-metadata'` explicite),
   soit documenter l'exception connue explicitement dans le critère
   d'acceptation Phase 5, pour que la prochaine session ne découvre pas
   la surprise en clôture de sous-vague.
3. **Éviter de faire tourner `senior-dev` et `qa-reviewer` en parallèle
   sur le même worktree** pour la suite du chantier — le risque de
   collision d'édition constaté ici (§2, note opérationnelle) est réel,
   pas seulement une friction de permission ponctuelle.

Aucun de ces trois points ne remet en cause le travail livré : les 12
composants "sans spec" et les 5 commits de production "avec spec"
échantillonnés sont corrects, le garde-fou `NG8001` est réel et confirmé
deux fois indépendamment, et le tri par accessibilité est appliqué
fidèlement. Rien ne bloque la poursuite de la Phase 5 (compléter le lot
"avec spec" à 5-10 puis le soumettre à `qa-reviewer`), sous réserve des
amendements 1 et 2 ci-dessus.
