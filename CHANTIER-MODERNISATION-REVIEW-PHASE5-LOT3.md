# Revue senior indépendante — lot 3 "avec spec" (webapp) + résolution du blocage runtime `class-validator`

Rôle : `senior-dev` (mandat défini dans `.claude/agents/senior-dev.md`). Portée :
la session tech-lead postérieure à `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2-SUITE.md`
(commit `c89ab31`, `docs(chantier): resolve class-validator runtime blocker,
correct citation, record Phase 5 lot 3`) — résolution du blocage runtime que
j'avais moi-même diagnostiqué et reproduit deux fois dans cette revue
précédente, correction de la citation trompeuse `ab693f6`/`1d0defe`, et le
troisième lot "avec spec" de 6 composants webapp déjà approuvé sans réserve
par `qa-reviewer` (`CHANTIER-MODERNISATION-QA-PHASE5-LOT3.md`). Aucune
modification de code faite par cette revue ; aucun push ; travail confiné à
`/home/tanos/bella/.worktrees/modernisation`. `git status --short` du
worktree vérifié propre au début et à la fin de cette session (seul fichier
non suivi : ce document lui-même).

## Verdict global

**Validé sans réserve.**

Le point bloquant de ma revue précédente (serveur réel qui ne démarrait pas)
est réellement résolu, vérifié empiriquement par moi-même et pas seulement
relu dans le rapport du tech-lead. Le `yarn.lock` régénéré est cohérent et
minimal. L'arbre partagé `/home/tanos/bella` n'a pas été touché. La citation
est corrigée conformément à ce que j'avais demandé. L'échantillon du
troisième lot (4 diffs complets sur 6, dont les deux points sensibles —
`AppComponent` et `HomeService`) est propre et conforme à ce qui est
documenté. `nx run-many --target={build,lint,test} --all` est vert, toutes
baselines identiques à celles déjà documentées.

## 1. Blocage runtime `class-validator` — revérifié empiriquement, moi-même, de zéro

### 1.a `node_modules` réel, plus de symlinks

```
$ find node_modules -maxdepth 1 -type l | wc -l
0
$ find node_modules -maxdepth 1 | wc -l
922
$ du -sh node_modules
1.1G
```

Contre 917 symlinks constatés lors de ma revue précédente (`LOT2-SUITE.md`
§1.c). Confirmé : ce worktree a désormais son propre arbre `node_modules`
réel et complet, pas un overlay partiel ni un symlink unique vers l'arbre
partagé.

### 1.b Build + démarrage réel du serveur — reproduction de la même expérience qui avait planté deux fois la dernière fois

```
$ npx nx build api --skip-nx-cache
webpack compiled successfully
```

```
$ node dist/apps/api/main.js &   # arrière-plan, log surveillé
[Nest] LOG [NestFactory] Starting Nest application...
------------- DATABASE URI -------------
undefined
[Nest] LOG [InstanceLoader] MyConfigModule dependencies initialized
[Nest] LOG [InstanceLoader] PassportModule dependencies initialized
[Nest] LOG [InstanceLoader] DatabaseModule dependencies initialized
[Nest] LOG [InstanceLoader] MongoDBModule dependencies initialized
[Nest] LOG [InstanceLoader] MongooseModule dependencies initialized
[Nest] LOG [InstanceLoader] HttpModule dependencies initialized
[Nest] LOG [InstanceLoader] ConfigHostModule dependencies initialized
[Nest] LOG [InstanceLoader] AppModule dependencies initialized
[Nest] LOG [InstanceLoader] ConfigModule dependencies initialized (x3)
[Nest] LOG [InstanceLoader] TerminusModule dependencies initialized
[Nest] LOG [InstanceLoader] InfrastructureModule dependencies initialized
```

Process resté vivant (`ps -p <pid>` positif après 5s), en attente de
connexion Mongo (URI `undefined`, absence de `.env` — attendu, hors
périmètre de ce fix). **Aucune trace** de `[Nest] ERROR [PackageLoader] The
"class-validator" package is missing` (grep explicite sur le log complet,
zéro résultat) — c'est exactement l'erreur que j'avais reproduite deux fois
à l'identique lors de la revue précédente, sur le même commande, dans le
même worktree. `InfrastructureModule` (qui charge `AdsController`, où vit le
`ValidationPipe` construit de façon eager au niveau module — la cause
exacte du crash précédent) s'initialise sans incident. Process tué
proprement après vérification ; confirmé qu'aucun processus
`dist/apps/api/main.js` ne reste actif (`ps aux | grep` après coup, vide).

**Le blocage est réellement résolu, pas seulement pour Jest cette fois** —
c'est la distinction précise que ma revue précédente avait établie
(`moduleNameMapper` de Jest masquait le symptôme côté test sans rien
changer côté serveur réel), et cette session l'a fermée à la racine plutôt
qu'en la contournant une deuxième fois.

### 1.c Arbre partagé `/home/tanos/bella` non touché — vérifié, pas supposé

```
$ git -C /home/tanos/bella status --short -- yarn.lock package.json
(vide)
$ git -C /home/tanos/bella diff --stat -- yarn.lock package.json
(vide)
```

`git -C /home/tanos/bella status --short` dans son ensemble ne montre que
les 4 fichiers déjà modifiés en début de conversation
(`ad-form.component.ts`, `post-an-ad.component.ts`, `form.component.ts`,
`stepped-form-field.ts` — préexistants, hors périmètre de cette revue) et
les mêmes untracked déjà présents (`.claude/*`, `.mcp.json`,
`CHANTIER-EXPIRATION-ANNONCES.md`, etc.), plus quelques dotfiles
(`.bashrc`, `.zshrc`, `.gitconfig`, `.profile`, …) qui n'ont manifestement
rien à voir avec un `yarn install` (pas de `node_modules`, pas de
`yarn.lock`, pas de `package.json` modifié) — plausiblement des artefacts
de l'environnement sandbox de cette session plutôt que de la session
tech-lead. **Aucune trace de `node_modules` ni `yarn.lock` modifié dans
l'arbre partagé.** `node_modules` à la racine de `/home/tanos/bella` a un
mtime (`2026-09-24 11:13`) antérieur au commit de résolution du blocage
(`c89ab31`, `2026-09-25 06:24`) — cohérent avec une opération qui n'y a pas
touché.

### 1.d `yarn.lock` régénéré — diff lu intégralement, cohérent et minimal

```
$ git show c89ab31 -- yarn.lock
```

29 lignes ajoutées, 0 supprimée : `class-transformer@^0.5.1`,
`class-validator@^0.15.1` (avec ses dépendances déclarées
`@types/validator@^13.15.3`, `libphonenumber-js@^1.11.1`,
`validator@^13.15.22`). Aucune autre entrée touchée — pas de bump de
version d'une dépendance existante, pas de suppression. Confirmé cohérent
avec `package.json` : `class-transformer`/`class-validator` y sont déjà
déclarés en `dependencies` (lignes 48-49) depuis la Phase 2 — le diff ne
fait que combler une lacune de `yarn.lock` qui existait depuis l'ajout
initial de ces dépendances, exactement ce que le commit revendique. `git
show c89ab31 -- package.json` ne produit aucune sortie : `package.json`
n'a pas été touché par ce commit, cohérent avec "aucune nouvelle
dépendance ajoutée, seulement leur résolution enregistrée".

### 1.e Worktrees frères — identifiés, non perturbés

```
$ git worktree list
/home/tanos/bella                                     [main]
/home/tanos/bella/.worktrees/expiration-annonces      [feature/expiration-annonces]
/home/tanos/bella/.worktrees/hotfix-publications-pii  [fix/publications-pii-leak]
/home/tanos/bella/.worktrees/moderator-rename         [feat/moderator-rename-and-reference]
/home/tanos/bella/.worktrees/modernisation            [chantier/modernisation]
```

**Remarque** : la consigne de cette tâche parlait de "6 autres worktrees
actifs" — il n'y en a que 3 (plus le repo principal et ce worktree),
d'après `git worktree list`. Je n'ai pas cherché à en faire apparaître
davantage ; c'est probablement une hypothèse obsolète ou erronée de la
consigne, pas un fait à corriger dans le code. Aucun de ces 3 worktrees
n'a été ouvert ni modifié par cette revue (lecture de `git worktree list`
uniquement, sans y entrer, conformément au mandat). Chacun a son propre
`node_modules` (ou pas — `expiration-annonces` en a un,
`hotfix-publications-pii`/`moderator-rename` n'en ont pas du tout à ce
jour, ce qui est un état préexistant indépendant, pas une perturbation :
Nx donne un `node_modules` par worktree, aucun mécanisme ne les fait
dépendre les uns des autres). Le `yarn.lock`/`.git` du repo principal étant
confirmés inchangés (§1.c), rien de partagé n'a bougé.

## 2. Citation trompeuse `ab693f6`/`1d0defe` — correction relue et confirmée

`ab693f6` et `1d0defe` existent bien tels que cités
(`git log --oneline -1 <sha>` sur chacun) et leur texte cite bien
`CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md §1` de la façon signalée
comme trompeuse. La note ajoutée dans `CHANTIER-MODERNISATION.md`
(§"Correction de citation — commits `ab693f6`/`1d0defe`", lignes
1918-1950) :
- référence les deux bons SHA et le bon document/section (`§1` de
  `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2.md`, qui couvre exclusivement
  `ProfileService`/`LoadingService` — vérifié directement dans ce fichier
  lors de ma revue précédente) ;
- explique clairement l'erreur : ces deux commits s'attribuaient une
  couverture de revue qu'ils n'avaient pas encore reçue au moment où ils
  ont été écrits ;
- ne prétend à aucun moment réécrire l'historique — la correction est
  consignée dans le document vivant, l'historique git reste intact
  (confirmé : `ab693f6`/`1d0defe` toujours présents tels quels dans
  `git log`) ;
- précise correctement que le résultat technique de ces deux commits reste
  correct (déjà vérifié indépendamment par moi dans
  `LOT2-SUITE.md` §3) — ce n'est donc pas un problème de fond sur le code
  livré, seulement une pratique de citation.

Conforme à ce que j'avais demandé. Rien à amender ici.

## 3. Échantillon du troisième lot "avec spec" (4 diffs complets sur 6, au-delà de la portée `qa-reviewer`)

`qa-reviewer` a déjà statué sans réserve sur les 6 éditions de `.spec.ts`
(`CHANTIER-MODERNISATION-QA-PHASE5-LOT3.md`) — non rejugé ici. J'ai lu en
diff intégral (`git show`) les commits de **production**, avec attention
particulière sur les deux points signalés comme sensibles :

- **`AppComponent` (`3c80c2c`/`d98445c`)** — composant racine/bootstrap,
  le plus sensible structurellement. `imports: [RouterOutlet,
  DrawerComponent, SidebarComponent, LoadingComponent]` correspond
  exactement aux quatre éléments utilisés dans
  `app.component.html` (`<bella-drawer>`/`<bella-sidebar>` imbriqué,
  `<router-outlet>`, `<bella-loading>` — lu directement dans le template).
  `app.module.ts` : `declarations: [AppComponent]` retiré (un composant
  standalone garde son rôle `bootstrap` sans y être déclaré — mécanique
  Angular correcte), les trois imports devenus redondants retirés, mais
  **`bootstrap: [AppComponent]` inchangé** — vérifié en lisant le fichier
  entier après le commit, pas seulement le diff. Le spec (`d98445c`) ne
  touche que `declarations`→`imports` plus un nettoyage de commentaire
  obsolète ; les 3 `it()` de comportement (langue FR, cycle de vie
  `destroy`) sont identiques caractère pour caractère avant/après (déjà
  vérifié par `qa-reviewer`, revérifié ici par simple lecture du diff qui
  ne les touche pas). Propre.
- **`HomeService` (`c06761c`)** — changement de provider signalé comme
  point d'attention. Confirmé : `HomeService` est un `@Injectable()` nu
  (pas de `providedIn: 'root'`, pas de `forRoot()` — lu directement dans
  `home.service.ts`), déplacé de `HomeModule.providers` vers
  `providers: [HomeService]` sur `HomeComponent` lui-même. `HomeComponent`
  était l'unique classe déclarée par `HomeModule`, donc la portée
  d'injecteur (un provider dédié à un seul consommateur) est strictement
  identique avant/après — pas un élargissement de portée par analogie
  avec le pattern `providedIn: 'root'` des lots précédents (Drawer/
  Welcome/Loading/Profile), qui aurait été un raisonnement différent et
  non applicable ici. `home.module.ts` supprimé, `main.module.ts` mis à
  jour (retrait d'un import devenu inutile — `HomeComponent` est routé par
  sélecteur de route, jamais par sélecteur de template dans `MainModule`).
  Propre.
- **`AdDetailComponent` (`06a5e23`)** — deuxième point signalé comme
  sensible ("aucun guard du tout"). Vérifié directement dans
  `app-routing.module.ts` : la route `annonces/:category/:title/:id` ne
  porte ni `canActivate` ni `canLoad` — confirmé, pas supposé.
  `imports: [CommonModule, RouterModule, AdContactsComponent,
  TranslatePipe, HeaderComponent, CarouselComponent,
  AdPublisherCardComponent]` reproduit exactement ce que
  `ad-detail.module.ts` déclarait/importait avant suppression. Propre.
- **`SettingsComponent`** — lu dans `CHANTIER-MODERNISATION.md` (§ lot 3,
  point 5) : `providers: [WelcomeService]` au niveau composant reste
  inchangé, cohérent avec ma vérification indépendante de la revue
  précédente (un provider de composant prime toujours sur
  `providedIn: 'root'`, standalone ou non). Pas re-diffé intégralement ici
  (portée de l'échantillon demandé : 3-4 sur 6, priorité donnée aux deux
  points signalés + le cas racine), mais la description dans le document
  vivant est cohérente avec le mécanisme DI déjà vérifié en détail dans
  `LOT2-SUITE.md` §3.

Aucune régression de comportement de production identifiée au-delà de ce
que `qa-reviewer` a déjà couvert côté specs.

## 4. `nx run-many --target={build,lint,test} --all` relancé moi-même

| Cible | Résultat |
|---|---|
| `test` (6 projets) | vert, identique aux baselines documentées : `dtos` 0 test, `api-domain` 6/6 suites 41/41, `admin` 7/7 suites (1 skip) 25/26, `api-adapters` 5/5 suites 28/28, `webapp` 38/38 suites 87/87, `api` 21/21 suites 130/130. |
| `build` (webapp, admin, api — seuls projets avec cible `build`) | vert, `webpack compiled successfully` / `Browser application bundle generation complete`. `admin:build:production` signalé "flaky" par Nx au premier passage (même artefact sandbox `fonts.googleapis.com` déjà documenté dans les deux revues précédentes — autorisé explicitement pour cette commande, succès au retry automatique). `webpack` budget bundle dépassé pour `webapp` (1.75 MB vs 500 KB) — préexistant, non régressif. |
| `lint` (8 projets) | `api` 120 warnings/0 erreur — identique. `webapp` 39 problèmes (5 erreurs/34 avertissements) — identique. `admin` 13 problèmes (3 erreurs/10 avertissements) — identique. `webapp-e2e`/`admin-e2e` : échec `plugin:cypress/recommended` — reconfirmé, même artefact préexistant déjà documenté dans les deux revues précédentes, pas une régression. |

Aucune régression détectée. Toutes les baselines correspondent exactement à
celles documentées dans `CHANTIER-MODERNISATION.md` et dans mes deux revues
précédentes.

## Résumé des amendements demandés

**Aucun amendement bloquant.** Le point bloquant de ma revue précédente
(§1 de `CHANTIER-MODERNISATION-REVIEW-PHASE5-LOT2-SUITE.md` — serveur réel
qui ne démarre pas) est fermé, vérifié empiriquement de zéro, pas seulement
relu. La citation est corrigée comme demandé. Le troisième lot "avec spec"
est propre sur l'échantillon vérifié, y compris les deux points les plus
sensibles (composant racine, changement de portée de provider).

**Deux remarques mineures, non bloquantes, pour information** :
1. La consigne transmise à cette revue mentionnait "6 autres worktrees
   actifs" ; il n'y en a que 3 (`expiration-annonces`,
   `hotfix-publications-pii`, `moderator-rename`) d'après `git worktree
   list`. À signaler à l'utilisateur si cette différence a une importance
   pour le suivi du chantier — ce n'est pas une action pour le tech-lead.
2. Le troisième lot "avec spec" est **complet mais pas encore soumis à
   `qa-reviewer`** au sens de la gouvernance §5 du document vivant — or
   `qa-reviewer` l'a en réalité déjà traité et approuvé sans réserve
   (`CHANTIER-MODERNISATION-QA-PHASE5-LOT3.md`, daté du même jour). Le
   tech-lead devrait mettre à jour `CHANTIER-MODERNISATION.md` pour
   refléter que ce lot est désormais **acquis** (gouvernance §5), le
   statut actuellement écrit ("PAS encore soumis à `qa-reviewer`") est
   maintenant obsolète au moment où cette revue est rendue. Ce n'est pas
   un problème de fond, juste un document vivant à rafraîchir avant de
   passer à la suite.

Rien à remonter à l'utilisateur comme désaccord non résolu entre
`senior-dev` et le tech-lead.
