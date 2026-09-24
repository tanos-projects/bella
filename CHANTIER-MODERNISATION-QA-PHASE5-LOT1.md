# QA Phase 5 — Lot 1 (7 specs `declarations` → `imports`)

Revue effectuée par `qa-reviewer` (mandat : `.claude/agents/qa-reviewer.md`),
exclusivement dans `/home/tanos/bella/.worktrees/modernisation`, branche
`chantier/modernisation`. Aucune modification de code n'a été apportée par
cette revue.

## Périmètre identifié indépendamment

Recherche menée via `git log --oneline -40` sur `chantier/modernisation` :
7 commits `test(webapp): *.spec.ts declarations -> imports (Phase 5, spec
edit)`, chacun précédé d'un commit `refactor(webapp): ... standalone: true`
séparé, et clos par `34742cf docs(chantier): record Phase 5 execution`.

| # | Composant | Commit refactor | Commit spec |
|---|---|---|---|
| 1 | `LoadingComponent` | `3325e8b` | `4381dd0` |
| 2 | `HeaderComponent` | `321656a` | `208e98a` |
| 3 | `FooterComponent` | `a26fa75` | `aaaa356` |
| 4 | `FooterToolbarActionComponent` | `a26fa75` | `f83155f` |
| 5 | `AdCardComponent` | `8884598` | `5c34ff8` |
| 6 | `AdPublisherCardComponent` | `8501ea4` | `eb384b3` |
| 7 | `CarouselComponent` | `8501ea4` | `b566d00` |

Les 7 composants et les 7 fichiers `.spec.ts` annoncés dans la consigne sont
bien retrouvés, un commit spec par composant, tous isolés du commit refactor
correspondant. Les 6 commits messages sur 7 portent explicitement la mention
« NOT considered acquired by this commit alone » / « Isolated per the
governance rule » (le 7e, `4381dd0`, la porte aussi in extenso — voir texte
complet du commit). Conforme au pattern attendu par la consigne.

## Méthode

Pour chacun des 7 commits : `git show <sha> -- .` (diff complet avec
contexte), confirmation qu'un seul fichier est touché par commit, lecture du
fichier `.spec.ts` complet post-commit (`Read`), et inspection de
`apps/webapp/src/testing/testing-support.ts` (source de `commonTestImports`
/ `commonTestProviders` / `commonTestSchemas`, inchangé par ces 7 commits)
pour vérifier qu'aucune régression de schéma n'a été introduite. Vérification
que les 7 `*.module.ts` correspondants ont bien disparu de l'arborescence.
Exécution réelle de `npx nx test webapp --skip-nx-cache` (deux fois, y
compris une passe ciblée sur les 7 fichiers) pour confirmer la baseline.

## Constat par fichier

Les 7 diffs sont **rigoureusement identiques dans leur forme** : une seule
ligne remplacée dans `TestBed.configureTestingModule({...})`, dans le
`beforeEach` de configuration :

```diff
-      declarations: [XxxComponent],
-      imports: [...commonTestImports],
+      imports: [XxxComponent, ...commonTestImports],
```

(orthographe strictement identique pour les 7, y compris l'espacement déjà
présent avant/après dans `carousel.component.spec.ts` qui avait
`[ CarouselComponent ]` avec espaces — remplacé proprement). Aucune autre
ligne du fichier n'est touchée : ni `providers`, ni `schemas`, ni aucun
`it(...)`/`describe(...)`, ni aucune assertion.

### 1. `loading.component.spec.ts` (commit `4381dd0`)
Diff : ligne 16 uniquement. Fichier post-commit : un seul test (`should
create`), assertion `expect(component).toBeTruthy()` inchangée. `schemas:
[...commonTestSchemas]` déjà présent avant ce commit (défini dans
`testing-support.ts`, non touché) — pas une régression introduite ici.
**APPROUVÉ**

### 2. `header.component.spec.ts` (commit `208e98a`)
Diff : ligne 16 uniquement. Même structure, même `should create` unique,
inchangé. **APPROUVÉ**

### 3. `footer.component.spec.ts` (commit `aaaa356`)
Diff : ligne 16 uniquement. Même structure. **APPROUVÉ**

### 4. `footer-toolbar-action.component.spec.ts` (commit `f83155f`)
Diff : ligne 16 uniquement. Même structure. **APPROUVÉ**

### 5. `ad-card.component.spec.ts` (commit `5c34ff8`)
Diff : ligne 17 uniquement. Ce fichier est le seul du lot à porter des tests
de comportement réel au-delà du smoke test : `builds a slugged detail URL
from the ad`, `strips diacritics and encodes the slug`, `navigates to the
detail URL` (assertions sur `component.urlPath` et sur l'appel à
`router.navigate`). Les trois `it(...)` sont bytes-identiques avant/après ;
seule la ligne de configuration `TestBed` change. Ces tests exercent un
comportement observable réel (construction d'URL, navigation), pas un mock
qui valide sa propre implémentation. **APPROUVÉ**

### 6. `ad-publisher-card.component.spec.ts` (commit `eb384b3`)
Diff : ligne 16 uniquement. `should create` unique, inchangé. **APPROUVÉ**

### 7. `carousel.component.spec.ts` (commit `b566d00`)
Diff : ligne 16 uniquement. `should create` unique, inchangé. Point de
vigilance documenté mais non problématique : le composant porte désormais
`schemas: [CUSTOM_ELEMENTS_SCHEMA]` dans son propre `@Component` decorator
(`carousel.component.ts`, pour les custom elements Swiper) — ce n'est pas
une modification du fichier de test, le `.spec.ts` continue d'utiliser
uniquement `commonTestSchemas` ([`NO_ERRORS_SCHEMA`]) comme avant. Aucune
régression de couverture dans le `.spec.ts` lui-même. **APPROUVÉ**

## Vérification de la régression de couverture (point 3 du mandat)

- Aucun `NO_ERRORS_SCHEMA` n'a été ajouté par ces 7 commits : `schemas:
  [...commonTestSchemas]` était déjà présent, à l'identique, avant chaque
  commit ; seul `declarations` → `imports` change. `commonTestSchemas` lui
  même (`testing-support.ts`) n'est touché par aucun des 7 commits.
- Aucune assertion, aucun `it(...)`, aucun `describe(...)` supprimé ou
  affaibli dans les 7 fichiers.
- Les 7 `*.module.ts` correspondants (`loading.module.ts`,
  `header.module.ts`, `footer.module.ts`, `footer-toolbar-action.module.ts`,
  `ad-card.module.ts`, `ad-publisher-card.module.ts`, `carousel.module.ts`)
  ont bien disparu de l'arborescence — cohérent avec les commits refactor
  correspondants, aucune dette de nettoyage restante détectée qui affecterait
  ces specs.

## Vérification baseline (point 4 du mandat)

```
npx nx test webapp --skip-nx-cache
Test Suites: 38 passed, 38 total
Tests:       87 passed, 87 total
```

Exécuté deux fois (une fois en full run, une fois avec `--testPathPattern`
ciblant les 7 fichiers — le pattern n'a pas isolé le run côté Nx/Jest mais
le full run confirme que les 38 suites, dont les 7 concernées, passent
toutes). `find apps/webapp/src -name "*.spec.ts" | wc -l` → 38, dont les 7
fichiers du lot listés nommément — aucun test retiré silencieusement de la
suite. Chiffres conformes à ce qu'annoncent les commits refactor et le
commit `34742cf` (« 38/38 suites, 87/87 tests »).

## Verdict global pour le lot des 7

**APPROUVÉ**, sans réserve, pour les 7 fichiers `.spec.ts` :
`loading.component.spec.ts`, `header.component.spec.ts`,
`footer.component.spec.ts`, `footer-toolbar-action.component.spec.ts`,
`ad-card.component.spec.ts`, `ad-publisher-card.component.spec.ts`,
`carousel.component.spec.ts`.

Chaque commit se limite strictement au remplacement mécanique
`declarations: [X]` → `imports: [X, ...commonTestImports]`, requis par la
conversion `standalone: true` du composant correspondant (un composant
standalone ne peut plus être déclaré). Aucune assertion supprimée, affaiblie
ou modifiée dans son comportement vérifié. Les tests continuent de vérifier
un comportement observable réel (instanciation via TestBed pour les 6
smoke tests ; construction d'URL slugifiée et navigation pour
`AdCardComponent`), pas une auto-validation de mock. Pas de régression de
couverture détectée, y compris sur le point de vigilance `NO_ERRORS_SCHEMA`
(préexistant, non introduit par ces commits). La baseline annoncée (38/38
suites, 87/87 tests) est confirmée par exécution réelle.

Ces 7 commits peuvent être considérés **acquis** par ce feu vert QA, au sens
de la règle de gouvernance citée dans leurs messages de commit.

## Points remontés (aucune décision produit tranchée à ma place)

Aucun. Le lot est mécanique de bout en bout et ne soulève pas de question
produit/architecture nécessitant un arbitrage. Le seul point technique
notable (`CUSTOM_ELEMENTS_SCHEMA` déplacé du wrapper module vers le
composant standalone pour `CarouselComponent`) est un détail du commit
refactor `8501ea4`, hors périmètre de ce mandat (qui porte sur les commits
spec), et n'affecte pas le fichier de test revu ici.
