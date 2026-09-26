# QA — Phase 5, lot 4 (webapp, "avec spec") — 8 composants (dernier lot webapp)

Rôle : `qa-reviewer` (mandat défini dans `.claude/agents/qa-reviewer.md`).
Périmètre strict : les modifications des `.spec.ts` **existants** de ce lot.
Aucune modification de code n'a été faite par cette revue ; aucun push ;
travail confiné à `/home/tanos/bella/.worktrees/modernisation`.

## Commits identifiés (retrouvés indépendamment via `git log`, pas à partir
d'une liste fournie)

Composants : `FieldErrorComponent`, `UploadComponent`, `FormComponent`,
`AdFormComponent`, `ProfileFormComponent`, `AccountComponent`,
`BookmarksComponent`, `MyPublicationsComponent`.

| Composant | Refactor (standalone) | Spec edit (déclarations → imports) |
|---|---|---|
| FieldErrorComponent | `397ef09` | `f42defc` |
| UploadComponent | `55f4d5b` | `aa696a8` |
| FormComponent | `865c020` | `252fc0c` |
| AdFormComponent | `8577a96` | `96202c9` |
| ProfileFormComponent | `67e5c57` | `e429cd1` |
| AccountComponent | `f22c0a1` | `ed64b1a` |
| BookmarksComponent | `c8a7830` | `f82d7d1` |
| MyPublicationsComponent | `7ab1e9e` | `6697154` |

16 commits confirmés, groupés en 8 paires immédiatement consécutives, séquence
continue entre `c89ab31` (docs lot 3, exclu) et `6697154` (inclus). Le commit
`d8e7e40` qui suit est un commit `docs(chantier)` du tech-lead (hors
périmètre spec) ; vérifié qu'il ne touche aucun fichier de test.

## Méthode

Pour chacun des 8 `.spec.ts`, contenu avant (`git show <spec-sha>^:<path>` ou
diff avec contexte complet) et après (contenu actuel du fichier, lu
intégralement) comparés directement, pas seulement le résumé du commit.
`ad-form.component.spec.ts` traité avec la rigueur maximale demandée : lecture
intégrale avant/après, plus vérification indépendante de la chaîne de rendu
(`ad-form.component.html` → `form.component.ts`/`.html` → `formly-form`), du
contenu de `formly-field-types.module.ts`, de `app.module.ts` (production) et
de `package.json` (dépendance `@ngx-formly/bootstrap`).

## Revue fichier par fichier

### `apps/webapp/src/app/shared/form/field-error/field-error.component.spec.ts` (`f42defc`)

Changement : `declarations: [FieldErrorComponent]` → `imports: [FieldErrorComponent]`.
Un seul caractère de diff au-delà de ce remplacement. Le fichier contient 5
`it()` comportementaux réels (rendu conditionnel du message d'erreur selon
`control`/`touched`/`valid`, message "required" libellé, message "email"),
tous lus intégralement dans le fichier courant : aucun n'a été touché, ajouté
ou retiré par ce commit.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/shared/components/upload/upload.component.spec.ts` (`aa696a8`)

Changement : `declarations: [UploadComponent]` + `imports: [...commonTestImports]`
→ `imports: [UploadComponent, ...commonTestImports]`. Spec = smoke test
unique (`should create`). Aucune assertion supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/shared/form/form.component.spec.ts` (`252fc0c`)

Même changement mécanique strict. Fichier lu intégralement : 2 `it()`
(`should create`, `emits the form value on submit` — vérifie que
`submitData` émet bien `{ title: 'Une annonce' }` après `onSubmit()`),
byte-identiques avant/après, seule la ligne `TestBed.configureTestingModule`
change. Aucune assertion supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/post-an-ad/ad-form/ad-form.component.spec.ts` (`96202c9`) — attention particulière

C'est le seul commit non purement mécanique du lot, comme signalé par le
tech-lead. Vérification indépendante, pas prise pour argent comptant :

**Contenu avant** (`96202c9^`) :
```ts
declarations: [ AdFormComponent ],
imports: [...commonTestImports],
```
Spec = smoke test unique, une seule assertion : `expect(component).toBeTruthy()`.

**Contenu après** (actuel) :
```ts
imports: [AdFormComponent, FormlyBootstrapModule, ...commonTestImports],
```
plus un commentaire explicatif. `providers` et `schemas` (dont
`NO_ERRORS_SCHEMA`, toujours présent via `commonTestSchemas`) **inchangés**.
Toujours et uniquement le même `it('should create', ...)` avec la même
assertion unique. Aucune assertion ajoutée, retirée, ni affaiblie — vérifié
caractère pour caractère sur le fichier complet, pas seulement le diff.

**Vérification de la nécessité réelle de `FormlyBootstrapModule`** (pas
supposée) :
- `ad-form.component.ts` (standalone, `imports: [FormComponent]`) a un
  template réduit à `<bella-form [fields]="fields" ... ></bella-form>`.
  Avant ce lot, `FormComponent` n'était déclaré/importé nulle part que le
  `TestBed` du spec pouvait voir ⇒ sous `NO_ERRORS_SCHEMA`, `<bella-form>`
  était un élément inerte, jamais résolu. Depuis le lot précédent de ce
  même lot (`865c020`, `FormComponent standalone: true`), l'élément est
  résolu pour de vrai dans ce spec pour la première fois.
- `form.component.html` contient `<formly-form [model]="model" [fields]="fields" ...>`.
  `ngOnInit()` d'`AdFormComponent` construit un `fields` Formly réel avec des
  types `stepper`, `input`, `select`, `picture-uploader`, `textarea`,
  `ng-select`, `multicheckbox` — confirmé en lisant le fichier
  `ad-form.component.ts` intégralement.
- `form.component.ts` importe `FormlyModule` (bare, fournit le sélecteur
  `<formly-form>`) et `FormlyFieldTypesModule` (nouveau fichier, voir
  ci-dessous), qui enregistre via `FormlyModule.forChild(...)` uniquement les
  types `stepper`, `picture-uploader`, `ng-select` — **pas** `input`,
  `select`, `textarea`, `multicheckbox`.
- Ces quatre derniers types sont les types "de base" fournis par
  `@ngx-formly/bootstrap`. En production, `app.module.ts` (racine, eager)
  importe `FormlyModule.forRoot(...)` + `FormlyBootstrapModule` — confirmé en
  lisant le fichier. Le spec, lui, n'avait et n'a toujours aucun équivalent à
  `FormlyModule.forRoot(...)` ; sans `FormlyBootstrapModule` dans ses propres
  `imports`, le rendu réel de `<formly-form>` avec des champs `input`/
  `select`/`textarea`/`multicheckbox` échouerait à runtime, cohérent avec ce
  que rapporte le tech-lead.
- `@ngx-formly/bootstrap` est une dépendance de production **existante**
  (`package.json` ligne 40 : `"@ngx-formly/bootstrap": "^6.0.0-rc"`), pas une
  dépendance ajoutée pour ce lot. Confirmé, pas supposé.

**Conclusion sur `ad-form.component.spec.ts`** : l'ajout de
`FormlyBootstrapModule` est une nécessité technique réelle et vérifiable
(rendu Formly désormais authentique, base types manquants sinon), pas un
contournement. Aucune assertion existante n'a été affaiblie ou supprimée pour
faire passer ce rendu réel — la seule assertion du fichier
(`expect(component).toBeTruthy()`) est restée identique. Le test, qui
validait auparavant une instanciation à côté d'un élément inerte, valide
maintenant en plus, comme effet de bord positif et non demandé
explicitement, que la configuration Formly complète (7 types de champs,
across 4 étapes du stepper) se construit et se rend sans lever d'erreur — une
amélioration de la couverture réelle, pas une dégradation.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/account/profile/form/profile-form.component.spec.ts` (`e429cd1`)

Changement mécanique : `declarations`+`imports` séparés → `imports:
[ProfileFormComponent, ...commonTestImports]`. Fichier lu intégralement : 4
`it()` comportementaux (pas de smoke test seul) — création sans utilisateur
lié, patch du formulaire depuis un utilisateur lié, formatage de la date de
naissance en `YYYY-MM-DD`, validité des champs requis. Tous byte-identiques
avant/après. `component.ngOnInit()` est appelé directement (pas de
`fixture.detectChanges()` avant les assertions, confirmé en lisant le
fichier), donc le template — et `FieldErrorComponent`, lui aussi devenu
standalone dans ce lot — n'est jamais réellement rendu par ce spec :
contrairement à `AdFormComponent`, aucun problème de profondeur de rendu en
cascade ici. Aucune assertion supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/account/account.component.spec.ts` (`ed64b1a`)

Changement mécanique strict. Spec = smoke test unique. `fixture.detectChanges()`
exécute le vrai template, mais le mock `AuthService` (`isAuthenticated$: of(false)`)
prend la branche `@else` (`<bella-auth-login-signup>`, déjà standalone depuis
un lot antérieur) — vérifié en lisant le fichier de test (le mock est défini
dans `testing-support.ts`, partagé, non modifié par ce lot) — donc
`ProfileFormComponent` n'est pas exercé par ce rendu. Aucune assertion
supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/bookmarks/bookmarks.component.spec.ts` (`f82d7d1`)

Même changement mécanique strict. Spec = smoke test unique. Aucune assertion
supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/my-publications/my-publications.component.spec.ts` (`6697154`)

Même changement mécanique strict. Spec = smoke test unique. Aucune assertion
supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

## Point additionnel : `formly-field-types.module.ts` (nouveau fichier,
hors périmètre "test", vérifié pour usage détourné)

Vérifié indépendamment, pas pris pour argent comptant :

- Introduit dans le commit refactor `865c020` (`FormComponent standalone:
  true`), en renommant `form.module.ts` (qui ne servait plus qu'à ça — sa
  seule autre fonction, déclarer `FormComponent`, devient caduque une fois
  `FormComponent` standalone).
- Contient exclusivement `FormlyModule.forChild({...})`, enregistrant les 3
  types custom `stepper`/`picture-uploader`/`ng-select` et un message de
  validation par défaut — aucune logique de test, aucun mock.
- Seul importateur dans toute la base (`grep -rn "FormlyFieldTypesModule"
  apps/webapp/src`) : `form.component.ts`, en production. **Aucun `.spec.ts`
  ne l'importe directement** — `ad-form.component.spec.ts` importe
  seulement `FormlyBootstrapModule`, pas `FormlyFieldTypesModule` ; ce
  dernier arrive transitivement via `FormComponent` lui-même.
- Raison d'être confirmée indépendamment : `FormlyModule.forChild(...)`
  retourne un `ModuleWithProviders`, qu'Angular refuse tel quel dans le
  tableau `imports` d'un composant standalone (diagnostic NG2012) — un fait
  vérifiable sur toute base Angular ≥14 avec des composants standalone,
  cohérent avec la doc de migration Angular. L'enrobage dans un `@NgModule`
  dédié est le contournement documenté officiellement pour ce cas précis.

Conclusion : ce fichier est une nécessité de production réelle (portage du
`FormModule` existant vers un composant standalone), pas un artifice créé
pour faire passer un test. Il n'est d'ailleurs référencé par aucun spec.

## Exécution de la suite de tests

```
npx nx test webapp --skip-nx-cache
Test Suites: 38 passed, 38 total
Tests:       87 passed, 87 total
```

Total exact identique à la référence pré-lot (38/38 suites, 87/87 tests).
Malgré le rendu Formly désormais réellement exercé dans
`ad-form.component.spec.ts`, aucune assertion n'a été ajoutée par ce lot (le
fichier reste à un seul `it()`) ; le compte de tests ne bouge donc pas.
Aucune régression, aucun test cassé, aucun test silencieusement retiré
(compte de fichiers `.spec.ts` inchangé — ce lot n'a ni ajouté ni supprimé de
fichier de spec).

## Verdict global

**APPROUVÉ SANS RÉSERVE**, pour les 8 fichiers `.spec.ts` de ce lot.

7 des 8 commits spec sont strictement mécaniques
(`declarations: [X]` → `imports: [X, ...commonTestImports]`, sans autre
changement), avec toutes les assertions comportementales existantes
(FieldErrorComponent : 5, FormComponent : 2, ProfileFormComponent : 4,
les autres : smoke test unique) vérifiées byte-identiques avant/après.

`ad-form.component.spec.ts` (`96202c9`) est le seul commit non mécanique du
lot, comme signalé, et a reçu le traitement demandé : lecture intégrale
avant/après, vérification indépendante (pas déduite du seul message de
commit) de la chaîne de rendu réelle qui rend `FormlyBootstrapModule`
nécessaire, confirmation que la dépendance est déjà en production
(`package.json`), et confirmation que l'unique assertion du fichier n'a été
ni affaiblie ni retirée pour faire passer le nouveau rendu réel — au
contraire, le test couvre maintenant, en plus, la construction et le rendu
sans erreur de la configuration Formly complète.

Le nouveau fichier `formly-field-types.module.ts` a été vérifié : usage de
production exclusif (seul importateur = `form.component.ts`), aucun spec ne
le référence directement, nécessité technique réelle (NG2012) confirmée
indépendamment — pas un contournement de test.

La suite `nx test webapp` est verte et exactement cohérente avec la référence
(38/38 suites, 87/87 tests) ; ce lot n'a ajouté aucune assertion malgré le
changement de nature du rendu dans `ad-form.component.spec.ts`.

Ce lot ferme la conversion `standalone: true` "avec spec" de la sous-vague
webapp (32 composants "avec spec" au total sur les 4 lots, lots 1–3 déjà
approuvés sans réserve, lot 4 ci-dessus également approuvé sans réserve).

Aucune décision produit sous-jacente non tranchable identifiée par cette
revue de specs — rien à faire remonter au-delà de ce qui est déjà tracké
ailleurs (§7.10 vérification navigateur Auth0 réelle en attente, §7.14 gap
DI `UploadService` — tous deux hors du périmètre de cette revue de tests et
déjà signalés par le tech-lead).
