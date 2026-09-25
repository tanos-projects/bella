# QA — Phase 5, lot 3 (webapp, "avec spec") — 6 composants

Rôle : `qa-reviewer` (mandat défini dans `.claude/agents/qa-reviewer.md`).
Périmètre strict : les modifications des `.spec.ts` **existants** de ce lot.
Aucune modification de code n'a été faite par cette revue ; aucun push ;
travail confiné à `/home/tanos/bella/.worktrees/modernisation`.

## Commits identifiés (retrouvés indépendamment via `git log`)

Composants : `HomeComponent`, `AdsByCategoryComponent`, `MainComponent`,
`AdDetailComponent`, `SettingsComponent`, `AppComponent`.

| Composant | Refactor (standalone) | Spec edit (déclarations → imports) |
|---|---|---|
| HomeComponent | `c06761c` | `538e961` |
| AdsByCategoryComponent | `ea174c9` | `5e129b5` |
| MainComponent | `20c67ea` | `afcee3c` |
| AdDetailComponent | `06a5e23` | `6d0f439` |
| SettingsComponent | `091c045` | `a13bfc9` |
| AppComponent | `3c80c2c` | `d98445c` |

Les 6 commits spec sont bien groupés en paires immédiatement après leur
commit refactor, séquence continue entre `97cb77c` (docs lot 2) et `d98445c`.

## Méthode

Pour chaque commit spec, contenu avant/après récupéré via `git show <sha>`
(diff avec contexte complet — fichiers assez petits pour que le diff affiché
couvre le fichier quasi en entier) et, pour `app.component.spec.ts`, la
version pré-commit intégrale via `git show d98445c^:<path>` en plus, pour
lever tout doute. Contenu **actuel** de chacun des 6 `.spec.ts` également lu
intégralement pour confirmer la nature des tests (smoke vs comportemental).

## Revue fichier par fichier

### `apps/webapp/src/app/pages/home/home.component.spec.ts` (538e961)

Changement : `declarations: [HomeComponent]` + `imports: [...commonTestImports]`
→ `imports: [HomeComponent, ...commonTestImports]`. Rien d'autre.

Le spec ne contient qu'un test `should create` (smoke test), aucune assertion
de comportement à préserver au-delà de l'instanciation. Aucune assertion
supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/ads-by-category/ads-by-category.component.spec.ts` (5e129b5)

Même changement mécanique strict. Spec = smoke test unique (`should create`).
Aucune assertion supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/main/main.component.spec.ts` (afcee3c)

Même changement mécanique strict. Spec = smoke test unique (`should create`).
Aucune assertion supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/ad-detail/ad-detail.component.spec.ts` (6d0f439)

Même changement mécanique strict. Attention particulière demandée par le
tech-lead : vérifié — ce spec ne contient qu'un `should create` (smoke test),
pas de test de comportement métier (pas de test sur les inputs `Ad`, les
photos du carousel, les contacts publiés, etc.). Rien à préserver au-delà de
l'instanciation ; rien n'a été supprimé.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/pages/settings/settings.component.spec.ts` (a13bfc9)

Même changement mécanique strict. Spec = smoke test unique (`should create`).
Aucune assertion supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/webapp/src/app/app.component.spec.ts` (d98445c)

Changement : `declarations: [AppComponent]` + `imports: [...commonTestImports]`
→ `imports: [AppComponent, ...commonTestImports]`, plus suppression d'un
commentaire obsolète référençant un `NxWelcomeComponent` qui n'existe plus
dans la base de code (pur nettoyage de commentaire, aucun code exécutable
touché).

Attention particulière demandée par le tech-lead : ce spec est le seul du
lot avec de vrais tests de comportement (3 `it()` au lieu d'un smoke test
unique) :
- `should create the app`
- `registers French as the only language` (vérifie `translate.getLangs()` et
  `getCurrentLang()`)
- `completes its subscriptions on destroy` (vérifie que `fixture.destroy()`
  ne lève pas)

Comparaison intégrale avant/après (`git show d98445c^:<path>` vs contenu
actuel) : les trois `it()` sont identiques caractère pour caractère avant et
après. Seuls le remplacement mécanique `declarations`→`imports` et la
suppression du commentaire obsolète diffèrent. Aucune assertion supprimée,
affaiblie, ni son comportement changé silencieusement.

**Verdict : APPROUVÉ.**

## Point additionnel : passage de `HomeService` en `providers: [HomeService]` au niveau composant

Vérifié indépendamment (pas pris pour argent comptant) :

- `HomeService` (`apps/webapp/src/app/pages/home/home.service.ts`) est un
  `@Injectable()` simple, **sans** `providedIn: 'root'` et sans `forRoot()`
  nulle part dans le repo (confirmé par recherche du fichier et de son
  historique git — jamais eu de `forRoot()`).
- Seul consommateur en code de production : `HomeComponent` lui-même
  (`inject(HomeService)`), confirmé par `grep -rn "HomeService" apps/webapp/src`.
  Aucun autre composant/service ne l'injecte.
- Aucun `.spec.ts` tiers ne référence `HomeService` (aucun
  `home.service.spec.ts`, aucune autre occurrence dans un fichier de test).
- `testing-support.ts` (`commonTestProviders`, utilisé par **tous** les
  specs du webapp) continue de lister `HomeService` sans changement — ce
  lot n'y a rien touché. Pour `HomeComponent` lui-même, le provider
  component-level (`providers: [HomeService]` sur le composant standalone)
  crée une instance dans l'injecteur du composant, qui masque celle fournie
  au niveau `TestBed` — comportement DI Angular normal, sans conflit ni
  erreur, et sans incidence sur le test `should create` (qui ne vérifie pas
  l'identité de l'instance de service).
- Aucun `home.module.ts` résiduel ne référence plus `HomeService` (module
  supprimé, `main.module.ts` mis à jour en conséquence — déjà visible dans
  le commit refactor `c06761c`, hors périmètre spec mais cohérent).

Conclusion : l'affirmation du tech-lead est vérifiée et confirmée — ce
changement de provision n'affecte aucun spec, ni celui de `HomeComponent`
ni aucun consommateur tiers, parce qu'il n'y a structurellement aucun
consommateur tiers de `HomeService` dans ce repo.

## Exécution de la suite de tests

`yarn install` relancé (déjà à jour — 0 symlink dans `node_modules`, install
réel confirmé, cohérent avec ce que la session tech-lead a documenté dans
`c89ab31`).

```
npx nx test webapp --skip-nx-cache
Test Suites: 38 passed, 38 total
Tests:       87 passed, 87 total
```

Conforme à la référence pré-lot (38/38 suites, 87/87 tests) — aucune
régression de compte de tests, aucun test cassé, aucun test silencieusement
retiré de la suite (le compte de fichiers `.spec.ts` reste identique : ce
lot n'a supprimé ni ajouté de fichier de spec).

## Verdict global

**APPROUVÉ SANS RÉSERVE**, pour les 6 fichiers `.spec.ts` de ce lot.

Tous les changements sont strictement mécaniques
(`declarations: [X]` → `imports: [X, ...commonTestImports]`, plus un
nettoyage de commentaire obsolète sans rapport dans un seul fichier).
Aucune assertion n'a été supprimée, affaiblie, ou n'a vu son comportement
changé silencieusement. Les deux fichiers signalés comme dignes d'attention
particulière (`ad-detail.component.spec.ts`, `home.component.spec.ts`)
s'avèrent être de simples smoke tests — rien à perdre au-delà de
l'instanciation, ce qui a été vérifié et non supposé. Le point additionnel
sur `HomeService` (provider component-level au lieu de module-level) a été
vérifié indépendamment et confirmé sans impact sur aucun spec, faute de tout
consommateur tiers du service. La suite `nx test webapp` est verte et
cohérente avec la référence (38/38 suites, 87/87 tests).

Aucune décision produit sous-jacente non tranchable identifiée dans ce lot
— rien à faire remonter.
