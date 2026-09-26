# Revue senior indépendante — Phase 3 (couverture `webapp/shared/services`)

Date : 2026-09-24. Portée : commits `49eb9c0`, `e53b039`, `ca1209c` sur
`chantier/modernisation`, scope exact `apps/webapp/src/app/shared/services/*.spec.ts`
(8 fichiers, aucun fichier de production modifié). Aucun fichier de code
source touché pour produire cette revue.

## Question centrale : substituer le "vrai mode d'échec" à l'"erreur HTTP" du critère d'acceptation — légitime ou contournement ?

Le critère d'acceptation de la Phase 3 dit littéralement : « chaque fichier
... a au moins un `.spec.ts` couvrant le cas de succès et **un cas d'erreur
HTTP** ». Vérifié le code réel des 5 services concernés avant de trancher :

- `ContactService.getContactData()` — dérivation pure synchrone, zéro
  appel HTTP, zéro dépendance injectée.
- `MyDeviceService` — délègue en synchrone à `DeviceDetectorService`
  (`ngx-device-detector`), zéro HTTP.
- `QualitiesService.getAll()` — retourne `of([...])`, une liste statique en
  dur, zéro HTTP.
- `SearchService` — orchestre `AdsService`/`CountriesService`/
  `CategoriesService`/`QualitiesService`, mais ne fait **lui-même** aucun
  appel HTTP direct (délégué entièrement à `AdsService.search`).
- `UserSettingsService` — `BehaviorSubject` + `window.localStorage`, zéro
  HTTP.

**Le critère d'acceptation a donc été écrit sous une hypothèse fausse** —
il présuppose (cohérent avec la description de la Phase 3 : « les services
qui centralisent tous les appels HTTP vers l'API ») que les 8 services font
tous du HTTP, ce qui est faux pour 5 d'entre eux. Une lecture littérale et
rigide forcerait soit à ne pas pouvoir clore ces 5 sous-points (aucun appel
HTTP n'existe à faire échouer), soit — pire — à fabriquer un mock HTTP
sans rapport avec le code réel juste pour cocher la case, ce qui serait
*exactement* le remplissage cosmétique que ce rôle existe pour détecter.

**Verdict : la substitution est la bonne interprétation, pas un
contournement — vérifié service par service, pas supposé.** Pour chacun
des 5, le test alternatif choisi correspond au vrai branchement
conditionnel ou au vrai risque de régression du code réel :
- `ContactService` : le test "contactSettings manquant" exerce la même
  garde optionnelle (`ad?.contactSettings?.phone === true`) qui protégerait
  contre un DTO partiel — un vrai raccourcissement de code (ex. retirer un
  `?.`) ferait échouer ce test.
- `MyDeviceService` : le test "desktop" bascule les trois booléens en même
  temps que `mobile` — un vrai bug de délégation croisée (ex. `isMobile()`
  qui appellerait `isDesktop()` par erreur de copier-coller) serait détecté.
- `QualitiesService` : le test "pas d'état mutable partagé" est un vrai
  test de contrat RxJS (`not.toBe` sur deux appels), pas une trivialité —
  détecterait une régression si `getAll()` passait à un `Observable` qui
  cache/partage la même référence de tableau entre appelants.
- `SearchService` : le test "propage l'erreur d'`AdsService.search` sans
  toucher `searchResults$`" exerce le vrai risque RxJS de ce service (un
  `tap()` placé après un opérateur qui peut throw, contaminant l'état
  partagé) — pas un mock artificiel.
- `UserSettingsService` : le test "efface l'entrée persistée sur valeur
  falsy" exerce la vraie branche `if (value) {...} else {
  localStorage.removeItem(...) }` du constructeur.

Ce ne sont pas des tests qui "auraient pu passer avec n'importe quelle
implémentation" — chacun exercerait une régression plausible et réelle du
service concerné. **Recommandation de forme, pas de fond** : le critère
d'acceptation lui-même (§4, Phase 3) devrait être corrigé dans un futur
commit doc pour refléter "cas de succès + cas d'échec le plus pertinent
pour ce service (HTTP ou non)" plutôt que rester figé sur "erreur HTTP" —
sinon une session future qui relit ce critère au pied de la lettre sans
relire cette revue pourrait croire à tort que 5/8 fichiers sont non
conformes.

## Le fix TS2345 (`Omit<CreateAdDTO, 'country'>`) — bonne réparation ou pansement sur un problème de modélisation ?

Vérifié indépendamment `libs/dtos` et le modèle dupliqué du webapp
(`apps/webapp/src/app/shared/models/ads.model.ts`) : dans les deux,
`AdDTO.country?: string` (code pays) et `CreateAdDTO.country?: CountryDTO`
(objet pays complet) — confirmé, ce n'est pas une coquille mais une
différence de représentation volontaire (le formulaire de création
collecte l'objet pays complet ; l'entité persistée n'en garde que le code,
voir aussi `AdMapper.createDTOToModel` côté API qui extrait `country.iso2`
du DTO de création — cohérent avec ce que la revue Phase 2 avait déjà
observé côté API).

Vérifié aussi le point le plus important : dans le test `create` corrigé,
le literal `payload: CreateAdDTO` **ne renseigne jamais `country`** (les
seules clés sont `category`/`description`/`price`/`title`/`quality`). Le
cast `payload as Omit<CreateAdDTO, 'country'>` retire donc, au niveau du
type uniquement, un champ qui n'existe même pas dans l'objet réel à
l'exécution — ce n'est pas une évasion de typage qui masquerait une valeur
`country` mal formée passée en douce dans le fixture, c'est un cast
strictement scopé au champ incompatible, sans toucher au typage
d'`AdDTO`, de `buildAd`, ni élargir la portée au-delà de ce point de spread
précis.

**Verdict : bonne réparation, pas un pansement.** Elle ne masque aucun
problème réel (il n'y a rien à masquer : le payload de test ne contient
jamais de `country`), et elle ne touche pas au vrai problème de
modélisation (`// TODO find a way to factorize DTO`, dette déjà connue et
documentée, non traitée ici) — ce qui est le bon choix : Phase 3 est
explicitement additive/test-only (aucun fichier de production modifié,
confirmé par `git status`/les diffs), et factoriser les DTOs `webapp` vs
`libs/dtos` est un chantier structurel à part entière, pas un fix ponctuel
à glisser dans un commit de couverture de tests.

## Découverte annexe pendant la revue : le test de `reset()` sous-caractérise un vrai quirk de `UserSettingsService`

En lisant `UserSettingsService.reset()` (`window.localStorage.removeItem(COUNTRY_ENTRY_KEY)`,
une seule ligne) contre son nouveau test (`'reset() removes the persisted
country entry directly'`), j'ai remarqué que le test ne vérifie **que**
`localStorage.getItem(...)` après l'appel — jamais `service.getCountry()`
ni `service.hasCountrySet()`. En le vérifiant contre le code réel :
`reset()` ne touche jamais `this._country$` (pas de `.next(...)`), donc
après un `reset()`, **`getCountry()`/`hasCountrySet()` continuent de
renvoyer l'ancienne valeur en mémoire**, malgré le `localStorage` vidé — le
country persisté n'est relu que dans le constructeur, au démarrage de
l'application.

Ce n'est pas un détail théorique : `WelcomeService.reset()` (appelé depuis
un vrai bouton, `apps/webapp/src/app/pages/settings/settings.component.ts:28`)
appelle exactement ce `userSettings.reset()` puis navigue vers `/` sans
recharger la page — donc, dans la session SPA en cours,
`WelcomeGuard.isAlreadyKnownOrAuthenticatedUser()` (qui lit
`hasCountrySet()`) continuera de considérer l'utilisateur "déjà connu" et
**ne relancera pas l'écran de bienvenue/onboarding** tant que la page n'est
pas rechargée en dur — ce qui semble contraire à l'intention évidente d'un
bouton "reset" dans les réglages.

**Ce n'est pas un problème de la Phase 3 elle-même** (test-only, aucun
fichier de production modifié, donc pas un bug introduit par ces commits)
et je ne demande pas de le corriger dans ce lot. Mais c'est un vrai angle
mort de caractérisation à signaler : le test actuel de `reset()` ne verrouille
que la moitié du comportement observable (le côté `localStorage`), pas
l'autre (l'état en mémoire qui reste périmé). Recommandation concrète, à
coût quasi nul : ajouter deux assertions à ce test précis
(`expect(service.getCountry()).toBe(...)` / `hasCountrySet()`) pour que le
comportement actuel — bug ou choix assumé, à trancher séparément — soit au
moins explicitement figé et visible plutôt qu'implicite.

## Vérifications complémentaires effectuées moi-même

- `categories.service.spec.ts`/`countries.service.spec.ts` : vérifiés
  contre le vrai code (`CategoriesService.getAll()` utilise bien
  `shareReplay(1)` avec un champ `cachedCategories$` non réinitialisé entre
  tests — le test "cache la réponse, pas de second appel HTTP" exerce
  réellement ce comportement, `httpMock.expectNone(...)` le confirmerait en
  cas de régression).
- `NODE_PATH=... npx nx run-many --target=test --all --skip-nx-cache` :
  `webapp` passe de 37 suites vertes/1 échouée (71 tests) à **38 suites
  vertes, 87 tests** — exactement le chiffre annoncé. `api` 130,
  `api-domain` 41, `api-adapters` 28, `admin` 26 (25+1 skip), `dtos` 0 —
  tous identiques à la baseline post-Phase 4a, aucune régression
  cross-projet.
- `nx lint webapp` : 39 problèmes (5 erreurs, 34 warnings) contre 37 (5
  erreurs, 32 warnings) relevés lors de la revue Phase 2 — **+2 warnings**,
  localisés dans les deux nouveaux fichiers de spec
  (`ads.service.spec.ts:220`, `search.service.spec.ts:106`, tous deux
  `@typescript-eslint/no-explicit-any`). Les 5 erreurs restent identiques
  et dans des fichiers non touchés par cette phase. Écart mineur, cohérent
  avec le style `any` déjà répandu dans les specs existantes du repo — pas
  une régression de qualité notable, mais à signaler pour rester honnête
  sur le chiffre exact.
- `git status` propre, `git diff` confirme qu'aucun fichier hors
  `shared/services/*.spec.ts` (+ le doc) n'a été touché — phase strictement
  additive comme annoncé.

## Verdict global

**Validé, sans réserve bloquante.** La substitution du "vrai mode
d'échec" à l'"erreur HTTP" pour les 5 services sans appel HTTP est une
interprétation légitime et vérifiée service par service — pas un
contournement — d'un critère d'acceptation écrit sous une hypothèse
fausse. Le fix TS2345 est correct, minimal et ne masque rien. La couverture
ajoutée teste du comportement réel et aurait détecté des régressions
plausibles pour chacun des 8 services.

Deux points non bloquants, pour le dossier :
1. **Recommandation de forme** : corriger le libellé du critère
   d'acceptation de la Phase 3 dans un futur commit doc, pour ne pas
   induire en erreur une session future qui le relirait au pied de la
   lettre sans cette revue.
2. **Découverte annexe** (pas un défaut de cette phase) : le test de
   `UserSettingsService.reset()` ne caractérise que la moitié du
   comportement réel — `getCountry()`/`hasCountrySet()` restent périmés en
   mémoire après un `reset()`, ce qui semble contredire l'usage réel du
   bouton "reset" des réglages (`WelcomeService.reset()`). Ni un blocage de
   cette phase, ni une correction demandée ici — signalé pour qu'une
   session future décide s'il s'agit d'un bug produit à corriger ou d'un
   choix à documenter, et pour que le test correspondant soit complété en
   conséquence.
