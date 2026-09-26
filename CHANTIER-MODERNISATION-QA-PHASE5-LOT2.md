# QA — Phase 5, deuxième lot "avec spec" (7 composants)

Date : 2026-09-25. Rôle : `qa-reviewer`, mandat exclusif = statuer sur les
**modifications de tests existants** (édition de `.spec.ts` déjà présents),
pas sur le code de production, pas sur l'ajout de nouveaux tests. Voir
`.claude/agents/qa-reviewer.md`.

Portée retrouvée indépendamment dans `git log` (pas fournie par le tech
lead) : les 14 commits entre `7eb84f5` et `0d5bc5b` (7 paires
refactor+spec), plus le commit doc `97cb77c` (non concerné par ce mandat).
Composants : `TitledPageComponent`, `LoginSignupLinkComponent`,
`LoginSignupComponent`, `LogoutButtonComponent`, `SidebarComponent`,
`DrawerComponent`, `WelcomeComponent`.

## Méthode

Pour chacun des 7 `.spec.ts`, contenu avant/après récupéré via
`git show <sha>` (diff complet, pas de résumé) et fichier final relu en
entier (`Read`), pas seulement le diff. Le changement `forRoot()` →
`providedIn: 'root'` sur `DrawerService`, `WelcomeService` et
`WelcomeGuard` a été vérifié pour tout impact sur des specs tierces, par
recherche exhaustive (`grep`) sur `apps/webapp/src` — pas seulement les 7
fichiers annoncés. Suite complète relancée moi-même
(`nx test webapp --skip-nx-cache`).

## Verdicts par fichier

**1. `apps/webapp/src/app/shared/layouts/titled-page/titled-page.component.spec.ts`** (commit `a602852`)
Diff : `declarations: [TitledPageComponent], imports: [...commonTestImports]` → `imports: [TitledPageComponent, ...commonTestImports]`. Aucune assertion touchée, `it('should create', ...)` intact.
**APPROUVÉ.**

**2. `.../login-signup-link/login-signup-link.component.spec.ts`** (commit `e2854ae`)
Même pattern mécanique exact. Aucune assertion touchée.
**APPROUVÉ.**

**3. `.../login-signup/login-signup.component.spec.ts`** (commit `502ebba`)
Même pattern mécanique exact. Aucune assertion touchée.
**APPROUVÉ.**

**4. `.../logout/logout-button.component.spec.ts`** (commit `faf4e4a`)
Même pattern mécanique exact. Aucune assertion touchée.
**APPROUVÉ.**

**5. `.../sidebar/sidebar.component.spec.ts`** (commit `1348b38`)
Même pattern mécanique exact. Aucune assertion touchée. (Le composant importe maintenant `LoginSignupComponent`/`LogoutButtonComponent` directement en standalone au lieu de via `SidebarModule` — sans effet sur le spec, qui ne référence que `SidebarComponent`.)
**APPROUVÉ.**

**6. `.../drawer/drawer.component.spec.ts`** (commit `e01660b`)
Même pattern mécanique exact. Aucune assertion touchée. Impact du passage de `DrawerService` en `providedIn: 'root'` vérifié nul — voir section dédiée ci-dessous.
**APPROUVÉ.**

**7. `apps/webapp/src/app/pages/welcome/welcome.component.spec.ts`** (commit `0d5bc5b`)
Même pattern mécanique exact. Aucune assertion touchée. Impact du passage de `WelcomeService`/`WelcomeGuard` en `providedIn: 'root'` vérifié nul — voir section dédiée ci-dessous.
**APPROUVÉ.**

Les 7 diffs sont byte-for-byte le même remplacement mécanique
`declarations: [X], imports: [...commonTestImports]` →
`imports: [X, ...commonTestImports]` — rien d'autre n'a changé dans aucun
des 7 fichiers (providers, schemas, corps des `it()`, tout est identique
caractère pour caractère). Chaque test reste un smoke test réel :
`TestBed.createComponent` + `fixture.detectChanges()` sur un vrai arbre de
DI (services réels via `commonTestProviders`, seul Auth0 mocké) — pas un
test qui se contente de valider son propre mock.

## Impact du changement `forRoot()` → `providedIn: 'root'` (DrawerService, WelcomeService, WelcomeGuard) sur des specs tierces

Vérifié concrètement, pas en théorie, par recherche exhaustive et lecture
des fichiers pertinents :

- **`apps/webapp/src/testing/testing-support.ts`** (harnais partagé par
  tous les specs webapp) : **non modifié** par ce lot (`git log` sur ce
  fichier ne montre aucun commit du lot). Il continue de lister
  explicitement `DrawerService` et `WelcomeService` dans
  `commonTestProviders`. Un provider explicite dans le `TestBed`
  court-circuite toujours `providedIn: 'root'` pour cet injecteur — chaque
  spec continue donc de recevoir exactement la même instance dédiée à son
  propre `TestBed` qu'avant la conversion. Aucun changement de
  comportement pour aucun des specs existants, y compris les 7 ci-dessus.
- **`apps/webapp/src/app/shared/components/drawer/drawer.service.spec.ts`**
  (spec tiers direct sur `DrawerService`, existe déjà, **non touché** par
  ce lot — dernière modif `998b8e2`, hors périmètre) : relu en entier.
  Fait uniquement `TestBed.inject(DrawerService)` puis
  `expect(service).toBeTruthy()`. Fonctionne identiquement, que
  `DrawerService` soit `providedIn: 'root'` ou fourni explicitement — pas
  de régression, pas de couverture perdue.
- **`apps/webapp/src/app/pages/settings/settings.component.spec.ts`**
  (cité par le tech lead comme "reconfirmed passing, unaffected" —
  **vérifié moi-même, pas pris pour acquis**) : `git show` confirme ce
  fichier **non modifié** par le lot. Lecture de
  `settings.component.ts` confirme `providers: [WelcomeService]` au
  niveau du composant (`standalone: false`, composant non converti dans
  ce lot) — un provider explicite au niveau composant est toujours le
  plus proche dans l'arbre d'injection et gagne sur `providedIn: 'root'`.
  `SettingsComponent` continue donc de recevoir sa propre instance dédiée
  de `WelcomeService`, comportement identique avant/après. Confirmation
  indépendante que l'affirmation du tech lead est exacte.
- **`WelcomeGuard`** : recherche exhaustive (`grep -rn "WelcomeGuard"
  apps/webapp/src`) — aucun `.spec.ts` ne le référence, nulle part. Seul
  `app-routing.module.ts` (code de production) l'utilise en
  `canActivate`/`canLoad`. Le `RouterTestingModule` importé nu (sans
  routes) dans `testing-support.ts` ne charge pas la config de routage
  réelle de l'app — aucun test unitaire n'instancie donc `WelcomeGuard`,
  ni avant ni après ce lot. Zéro impact possible.
- **Modules supprimés** (`TitledPageModule`, `LoginSignupLinkModule`,
  `LoginSignupModule`, `LogoutButtonModule`, `SidebarModule`,
  `DrawerModule`, `WelcomeModule`) : `grep` exhaustif sur
  `apps/webapp/src` (code et specs) — **zéro référence pendante** à l'un
  de ces sept noms de module.
- Aucun `*.module.spec.ts` n'existe dans le projet webapp — pas de spec
  de module orphelin à nettoyer suite aux suppressions.

**Conclusion sur ce point : aucune régression de couverture, subtile ou
non. Le scénario redouté par le mandat (un test qui dépendait
implicitement du comportement singleton via un module donné et se
comporterait différemment avec `providedIn: 'root'`) ne se produit pour
aucun des trois services/guard concernés, pour la raison structurelle
suivante : le harnais de test partagé (`testing-support.ts`) fournit déjà
ses propres providers explicites indépendamment de `providedIn`, donc le
mode de provision de la classe elle-même n'a jamais d'effet observable
dans un test webapp existant.**

## Remarque non bloquante sur la citation de précédent

Les messages des commits `ab693f6` et `1d0defe` citent
`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md §1` comme précédent "déjà
revu et accepté" pour le pattern `forRoot()` → `providedIn: 'root'`. Lu ce
document : son §1 couvre effectivement ce pattern, mais uniquement pour
`ProfileService` et `LoadingService` (lot précédent) — **pas** pour
`DrawerService`, `WelcomeService` ni `WelcomeGuard`, qui sont nouveaux dans
ce lot et n'avaient été vérifiés par personne avant cette session QA. La
citation suggère à tort une couverture déjà actée pour ces trois
classes précises. Ce n'est pas bloquant ici puisque j'ai vérifié
moi-même, concrètement, qu'aucune régression n'en résulte (section
ci-dessus) — mais à signaler pour que les prochaines sessions ne
présument pas qu'une citation de précédent dispense de vérification
indépendante.

## Suite de tests

`nx test webapp --skip-nx-cache` relancé moi-même :

```
Test Suites: 38 passed, 38 total
Tests:       87 passed, 87 total
```

Identique au chiffre de référence (38/38 suites, 87/87 tests) annoncé
avant ce lot. Aucun test ajouté, aucun retiré silencieusement — cohérent
avec le fait que les 7 commits ne touchent que `TestBed.configureTestingModule`,
jamais le nombre ou le corps des `it()`.

## Verdict global

**APPROUVÉ, sans réserve**, pour les 7 modifications de `.spec.ts` de ce
lot. Chaque diff est strictement le remplacement mécanique
`declarations` → `imports` requis par la conversion `standalone: true`,
aucune assertion n'a été supprimée, affaiblie ni changée de comportement,
chaque test continue d'exercer un comportement observable réel (création
du composant via un vrai arbre de DI), le nombre de suites/tests est
inchangé, et le changement `forRoot()` → `providedIn: 'root'` sur
`DrawerService`/`WelcomeService`/`WelcomeGuard` a été vérifié — pas
supposé — sans impact sur aucun spec existant, y compris
`settings.component.spec.ts` et `drawer.service.spec.ts`.

Aucune décision produit sous-jacente à remonter.
