# QA — Phase 5, sous-vague admin, "avec spec" — 4 composants

Rôle : `qa-reviewer` (mandat défini dans `.claude/agents/qa-reviewer.md`).
Périmètre strict : les modifications des `.spec.ts` **existants** de ce lot.
Aucune modification de code n'a été faite par cette revue ; aucun push ;
travail confiné à `/home/tanos/bella/.worktrees/modernisation`.

## Commits identifiés (retrouvés indépendamment via `git log`, pas à partir
d'une liste fournie)

Composants : `NavbarComponent`, `AppComponent`, `AccessDeniedComponent`,
`DashboardComponent`.

| Composant | Refactor (standalone) | Spec edit (declarations → imports) |
|---|---|---|
| NavbarComponent | `0a7f541` | `4335396` — **non purement mécanique** |
| AppComponent | `63af1ab` | `235677c` |
| AccessDeniedComponent | `b353b50` | `d503cc9` |
| DashboardComponent | `1e0b120` | `d11badf` |

8 commits confirmés, groupés en 4 paires immédiatement consécutives, séquence
continue entre `0a7f541` et `d11badf`. Le commit `10c6dff` qui suit est un
commit `docs(chantier)` du tech-lead (documentation Phase 5 + question
§7.15 SidenavComponent), hors périmètre spec — vérifié qu'il ne touche aucun
fichier `.spec.ts`. Précédé dans le log par 4 commits `refactor(admin): ...
standalone: true (Phase 5, admin sub-wave, sans-spec)`
(`ConfirmationDialogComponent`, `SidenavComponent`, `PublicationsListComponent`,
`PublicationsComponent`) — confirmé qu'aucun de ces 4 composants ne possède
de fichier `.spec.ts` (`find` sur leurs noms), donc hors mandat et sans effet
sur le compte de suites/tests.

## Méthode

Pour chacun des 4 `.spec.ts`, contenu avant (`git show <spec-sha>^:<path>`)
et après (fichier courant) lus intégralement et comparés directement, pas
seulement le résumé du commit. `navbar.component.spec.ts` traité avec la
rigueur maximale demandée : vérification indépendante de la chaîne de rendu
(template `navbar.component.html` → `routerLink`/`routerLinkActive` →
`navbar.component.ts` standalone `imports` → ancien `navbar.component.ts`
+ `NavbarModule` séparé → contenu exact de l'ancien
`navbar.component.spec.ts`), pas prise pour argent comptant du message de
commit.

## Revue fichier par fichier

### `apps/admin/src/app/shared/components/navbar/navbar.component.spec.ts` (`4335396`) — attention particulière

C'est le seul commit non purement mécanique du lot, comme signalé par le
tech-lead. Vérification indépendante :

**Contenu avant** (`4335396^`) :
```ts
TestBed.configureTestingModule({
  declarations: [NavbarComponent],
  imports: [
    NoopAnimationsModule, LayoutModule, MatButtonModule,
    MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule,
  ]
}).compileComponents();
```
Aucun `RouterModule`/`RouterTestingModule` présent. Spec = smoke test unique,
`it('should compile', () => expect(component).toBeTruthy())`.

**Contenu après** (actuel) : `declarations` supprimé, `NavbarComponent`
déplacé dans `imports`, et `RouterTestingModule` ajouté à `imports` (avec un
commentaire explicatif inline). Toujours et uniquement le même
`it('should compile', ...)`, avec la même assertion unique, byte-identique.
Aucun changement du bloc `providers`/`schemas` (il n'y en avait pas).

**Vérification de la nécessité réelle de `RouterTestingModule`** (pas
supposée) :
- `navbar.component.html` (inchangé par ce lot) contient
  `routerLink="{{routes.DASHBOARD}}" routerLinkActive="active"` (×3, un par
  lien de navigation) — confirmé en lisant le template intégralement.
- **Avant** ce lot, `NavbarComponent` était `standalone: false`, déclaré par
  un `NavbarModule` séparé (co-localisé dans le même fichier
  `navbar.component.ts`, confirmé en lisant `navbar.component.ts` à l'état
  parent de `0a7f541`) dont les `imports` incluaient `RouterModule`. Mais
  l'ancien spec utilisait `declarations: [NavbarComponent]` directement (pas
  `imports: [NavbarModule]`) — `TestBed` ne récupère alors que ce qui est
  listé explicitement dans ses propres `imports`, jamais les `imports`
  internes d'un module non cité. Le spec avant ce lot ne listait pas
  `RouterModule` ⇒ `RouterLink`/`RouterLinkActive` n'étaient jamais résolus
  comme directives dans ce spec, `routerLink="..."` restait un attribut HTML
  plat inerte. C'est cohérent et vérifiable, pas une simple affirmation du
  commit.
- **Après** conversion en standalone (`navbar.component.ts` actuel,
  `standalone: true, imports: [CommonModule, RouterModule, MatToolbarModule,
  MatSidenavModule, MatListModule, MatIconModule, MatButtonModule]`) : un
  composant standalone porte ses propres `imports` de compilation, appliqués
  systématiquement à chaque instanciation quel que soit le `TestBed` du
  spec — comportement Angular documenté (contrairement à `declarations`,
  jamais contourné par le test). `RouterModule` devient donc réellement actif
  dans la compilation du composant pour ce spec, `RouterLink` devient une
  vraie directive, qui injecte `ActivatedRoute`/`Router` — d'où l'échec
  `NG0201: No provider found for ActivatedRoute` rapporté par le commit
  avant correction, cohérent avec le mécanisme décrit.
- `RouterTestingModule` fournit précisément cette infrastructure de routage
  de test. Le commit affirme que le pattern est « déjà établi dans cette
  app (`app.component.spec.ts`) » : vérifié indépendamment en lisant
  `app.component.spec.ts` **à l'état d'avant tout ce lot** (`0a7f541^`, donc
  avant même le premier commit de la paire NavbarComponent) — il contenait
  déjà `imports: [RouterTestingModule], declarations: [AppComponent]`. Le
  pattern préexiste bien à ce lot, ce n'est pas une justification inventée
  après coup dans la même série de commits.

**Conclusion sur `navbar.component.spec.ts`** : l'ajout de
`RouterTestingModule` est une nécessité technique réelle et vérifiable
(RouterLink devient une directive réellement active pour la première fois
dans ce spec), pas un contournement artificiel. Aucune assertion existante
n'a été affaiblie ni supprimée pour faire passer ce rendu réel — l'unique
assertion du fichier (`expect(component).toBeTruthy()`) est restée
identique. Effet de bord positif non demandé : le test valide désormais, en
plus, que `RouterLink`/`RouterLinkActive` se compilent et s'instancient sans
erreur avec un vrai `Router` — une amélioration de couverture réelle, pas
une dégradation.

**Verdict : APPROUVÉ.**

### `apps/admin/src/app/app.component.spec.ts` (`235677c`)

Changement : `imports: [RouterTestingModule], declarations: [AppComponent]`
→ `imports: [AppComponent, RouterTestingModule]`. `RouterTestingModule`
était déjà présent avant ce lot (confirmé ci-dessus) — ce commit ne fait que
déplacer `AppComponent` de `declarations` vers `imports`, rien de plus.
Fichier lu intégralement : 3 `it`/`xit` (`should create the app`, `` should
have as title 'admin' ``, et le `xit('should render title', ...)` déjà
skippé avant ce lot), tous byte-identiques avant/après. Aucune assertion
supprimée, ajoutée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/admin/src/app/pages/access-denied/access-denied.component.spec.ts` (`d503cc9`)

Changement mécanique strict : `imports: [MatButtonModule], declarations:
[AccessDeniedComponent]` → `imports: [AccessDeniedComponent,
MatButtonModule]`. Le bloc `providers: [{ provide: AuthCustomService,
useValue: { logout: () => undefined } }]` est intouché. Fichier lu
intégralement : spec = smoke test unique (`should create`), byte-identique
avant/après. Aucune assertion supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

### `apps/admin/src/app/pages/dashboard/dashboard.component.spec.ts` (`d11badf`)

Changement mécanique strict : `declarations: [DashboardComponent]` →
`imports: [DashboardComponent]`, une seule ligne touchée. `DashboardComponent`
(vérifié : `standalone: true`, pas d'`imports`, pas de dépendance injectée)
n'a aucune surface qui pourrait rendre ce changement non trivial — cohérent
avec le côté mécanique du commit. Fichier lu intégralement : spec = smoke
test unique (`should create`), byte-identique avant/après. Aucune assertion
supprimée ni affaiblie.

**Verdict : APPROUVÉ.**

## Exécution de la suite de tests

```
npx nx test admin --skip-nx-cache
Test Suites: 7 passed, 7 total
Tests:       1 skipped, 25 passed, 26 total
```

`find apps/admin -name "*.spec.ts"` confirme exactement 7 fichiers de spec
(`app.component.spec.ts`, `auth/permissions.guard.spec.ts`,
`pages/access-denied/access-denied.component.spec.ts`,
`pages/dashboard/dashboard.component.spec.ts`,
`shared/components/navbar/navbar.component.spec.ts`,
`store/publications/publications.effects.spec.ts`,
`store/publications/publications.store.spec.ts`) — les 4 fichiers de ce lot
en font partie, tous verts. Total exact identique à la référence citée par
les commits (7 suites / 26 tests, 25 passés + 1 skip préexistant — le
`xit('should render title', ...)` d'`app.component.spec.ts`, déjà skippé
avant ce lot, pas introduit par lui). Les 4 commits `sans-spec` qui précèdent
ce lot (`ConfirmationDialogComponent`, `SidenavComponent`,
`PublicationsListComponent`, `PublicationsComponent`) n'ont, comme attendu,
pas modifié ce chiffre puisqu'aucun de ces composants n'a de fichier de spec.
Aucune régression, aucun test cassé, aucun test silencieusement retiré
(compte de fichiers `.spec.ts` inchangé — ce lot n'a ni ajouté ni supprimé de
fichier de spec ; le nouveau `post-an-ad.component.spec.ts` mentionné dans le
contexte hors mandat est un fichier webapp entièrement nouveau, sans rapport
avec ce compte admin).

## Verdict global

**APPROUVÉ SANS RÉSERVE**, pour les 4 fichiers `.spec.ts` de ce lot.

3 des 4 commits spec (`app.component.spec.ts`,
`access-denied.component.spec.ts`, `dashboard.component.spec.ts`) sont
strictement mécaniques (`declarations: [X]` → `imports: [X, ...]`, sans
autre changement), avec toutes les assertions comportementales existantes
vérifiées byte-identiques avant/après.

`navbar.component.spec.ts` (`4335396`) est le seul commit non mécanique du
lot, comme signalé, et a reçu le traitement demandé — le même niveau de
rigueur qu'`ad-form.component.spec.ts` dans le lot webapp précédent (lot 4) :
lecture intégrale avant/après, vérification indépendante (pas déduite du
seul message de commit) du mécanisme exact par lequel la conversion
standalone rend `RouterLink` réellement actif dans le spec pour la première
fois (les `imports` d'un composant standalone s'appliquent toujours, contrairement
aux `imports` d'un `NgModule` séparé non cité par l'ancien `TestBed`),
confirmation que `RouterTestingModule` est un pattern déjà établi et
préexistant à ce lot (`app.component.spec.ts`, vérifié à l'état d'avant tout
ce lot), et confirmation que l'unique assertion du fichier n'a été ni
affaiblie ni retirée pour faire passer ce routing désormais réel — au
contraire, le test couvre maintenant, en plus, que `RouterLink`/
`RouterLinkActive` se compilent et s'instancient sans erreur avec un vrai
`Router`.

La suite `nx test admin` est verte et exactement cohérente avec la référence
citée par les commits (7/7 suites, 25/26 tests + 1 skip préexistant) ; ce
lot n'a ajouté ni retiré aucune assertion ni aucun fichier de spec.

Ce lot ferme la conversion `standalone: true` "avec spec" de la sous-vague
admin (4 composants avec spec sur ce lot, plus 4 composants sans spec dans
la même sous-vague, hors mandat de cette revue).

Aucune décision produit sous-jacente non tranchable identifiée par cette
revue de specs — rien à faire remonter au-delà de ce qui est déjà tracké
ailleurs par le tech-lead (§7.15, question code mort potentiel sur
`SidenavComponent` — hors mandat de cette revue, comme précisé dans la
consigne).
