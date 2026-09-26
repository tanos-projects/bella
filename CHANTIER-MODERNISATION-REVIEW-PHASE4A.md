# Revue senior indépendante — Phase 4a (nettoyage store admin)

Date : 2026-09-24. Portée : commits `b15fecb`..`f3cf47a` sur
`chantier/modernisation`, scope exact `apps/admin/src/app/store/publications/*`
(+ `store/utils.ts`). Aucun fichier de code source touché pour produire
cette revue.

## (a) Le test de caractérisation (`b15fecb`) verrouille-t-il vraiment `handleActionResult` ?

Lu `publications.effects.ts` et le nouveau `publications.effects.spec.ts`
ligne à ligne, sans partir du commentaire du code comme preuve suffisante :

- `handleActionResult` : sur succès, `approve` ne dispatch que
  `loadUnpublished` (1 appel) ; `reject` dispatch `loadUnpublished` **et**
  `loadArchived` (2 appels, jamais `loadPublished`) ; `archive` dispatch les
  trois (3 appels) ; sur échec (`result.success === false`), aucun dispatch,
  seulement `store.publishActionResult(result)`. Les 4 tests du describe
  `handleActionResult (characterization)` vérifient exactement ces 4 cas,
  avec un vrai store factice (`FakeStore`, Subject réel pour `actions$`) et
  des assertions sur `store.dispatch.mock.calls` (types d'action, nombre
  d'appels) — pas des mocks qui rendraient le test vrai par construction.
- **Un vrai bug aurait été détecté** : j'ai vérifié mentalement qu'inverser
  la condition `archive`/`reject` dans le code ferait échouer le test
  correspondant (`toHaveBeenCalledTimes` et `arrayContaining`/`not.toContain`
  sont assez précis pour ça).

**Lacune mineure, non bloquante** : seul le cas d'échec d'`approve` est
testé pour la branche « rien n'est rechargé » ; `reject`/`archive` en échec
ne le sont pas explicitement. Le code partage la même garde
`if (result.success)` pour les trois actions, donc le risque de régression
non couvert est faible — mais un test à trois exécutions (`it.each`) aurait
fermé complètement l'angle mort à coût nul. Suggestion, pas une exigence
pour valider ce sous-point.

**Autre lacune mineure** : les tests vérifient le *type* d'action dispatché
(`LOAD_UNPUBLISHED`, etc.) mais pas le *payload* (`page`/`pageSize` repris
de `store.currentUnpublished`/`currentArchived`/`currentPublished`). Un
futur commit qui recharge accidentellement toujours la page 1 au lieu de la
page courante ne serait pas détecté par ce test précis — mais ce n'est pas
le comportement que ce sous-point de caractérisation visait à figer (il
vise le *sélectif*, pas le *pagination-preserving*), donc hors scope
raisonnable de ce commit précis.

**Verdict sur (a) : le test verrouille correctement la sémantique réelle,
vérifiée indépendamment contre le code, pas seulement contre le commentaire
qui l'accompagne. Les deux angles morts identifiés sont mineurs et
n'invalident pas la caractérisation.**

## (b) Le retrait des 3 `console.log` a-t-il un effet de bord ?

Diff `c0bcf21` lu intégralement : exactement 3 lignes supprimées
(`PublicationsStoreModule.forRoot()`, `PublicationsEffects.start()`,
`PublicationsStore.dispatch()`), toutes des instructions bareword sans
valeur de retour utilisée ni effet de bord au-delà de l'écriture console —
aucune n'était imbriquée dans une expression dont le résultat serait
consommé ailleurs. Le `console.error` de `loadPage()` (erreur réelle) est
intact, confirmé par grep. `grep -rn "console.log" apps/admin/src/app/store/publications/`
ne trouve plus aucun appel réel (un seul résultat, un commentaire de spec
qui *mentionne* "console.log cleanup" en texte). **Verdict : aucun effet de
bord, retrait strictement cosmétique — confirmé, pas supposé.**

## (c) Les nouvelles specs testent-elles du comportement ou de l'implémentation ?

- `publications.store.spec.ts` (nouveau) : teste le comportement observable
  au travers de l'API publique du store (`dispatch()` pousse bien sur
  `actions$`, `unpublishedLoaded()`/`publishedLoaded()`/`archivedLoaded()`
  mettent à jour à la fois le getter `current*` et l'observable, l'état
  initial est bien vide). Un test en particulier est un vrai test de
  comportement RxJS, pas une reformulation de l'implémentation : "a late
  subscriber gets the last value immediately" appelle `unpublishedLoaded()`
  **avant** de s'abonner, puis vérifie que l'abonné tardif reçoit quand même
  la dernière valeur — ce test échouerait (timeout) si `_unpublishedLoaded$`
  était un `Subject` ordinaire au lieu d'un `BehaviorSubject`. C'est
  exactement le genre de test qui aurait un intérêt réel en cas de refactor
  futur, pas une simple vérification d'implémentation interne.
- `publications.effects.spec.ts`, describe "load effects" (nouveau) :
  vérifie que chaque `load*` action déclenche le bon appel de service avec
  les bons `page`/`pageSize`, et forward le résultat au bon setter du
  store. Le test "swallows a failed load ... subscription still alive"
  est le plus intéressant : il déclenche une erreur, vérifie
  `console.error` et l'absence de forward, **puis rejoue une deuxième
  action du même type et vérifie qu'elle est bien traitée** — ça teste
  directement le commentaire du code sur `catchError` placé à l'intérieur
  du `switchMap` pour ne pas tuer l'abonnement (un vrai risque RxJS, pas
  une trivialité). C'est un test de comportement, pas de duplication de
  l'implémentation.

**Verdict sur (c) : les nouvelles specs testent du comportement réel et
auraient détecté des régressions plausibles (BehaviorSubject → Subject,
catchError mal placé), pas seulement de la couverture cosmétique.**

## (d) La gestion de l'écart "couverture zéro vs indirecte" était-elle la bonne ?

Vérifié indépendamment : `find apps/admin/src/app/pages/publications -type f`
ne montre aucun `*.spec.ts` pour `PublicationsComponent` ni
`PublicationsListComponent` — confirmé, la prémisse "couverture indirecte
via `PublicationsComponent`" du document d'origine était bien fausse, la
couverture de départ était réellement nulle.

**La décision de documenter l'écart plutôt que de le traiter comme
bloquant est la bonne** : le sous-point 4a ne dépendait pas de la nature de
la couverture de départ (indirecte ou nulle) pour être exécutable — dans
les deux cas, l'objectif ("ajouter des specs dédiées à
`PublicationsStore`/`PublicationsEffects`") reste identique et a été
atteint. Traiter cet écart comme bloquant aurait été une sur-réaction :
consigner la correction factuelle dans le document (plutôt que de
retoucher silencieusement la formulation d'origine sans le signaler) est
exactement la bonne discipline de traçabilité pour ce chantier — cohérent
avec la règle déjà appliquée ailleurs (ex. Phase 1bis, où une prémisse
fausse similaire — "coût faible" — a aussi été corrigée en la signalant,
pas en la réécrivant en silence).

## Vérifications complémentaires effectuées moi-même

- `NODE_PATH=... npx nx run-many --target=test --all --skip-nx-cache` :
  `admin` passe de 5 suites/10 tests (9 passés + 1 skip) à **7 suites/26
  tests (25 passés + 1 skip)** — soit **+16 tests**, exactement le chiffre
  annoncé. `api` 130, `api-domain` 41, `api-adapters` 28, `webapp` 43,
  `dtos` 0 — tous identiques à la baseline, aucune régression cross-projet.
- `nx lint admin` : 13 problèmes (3 erreurs, 10 warnings) — **identique à
  la baseline déjà relevée lors de la revue Phase 2**, et les 3 erreurs
  sont dans `dashboard.component.ts` (fichier non touché par 4a). Aucun
  nouveau problème de lint introduit par ces 5 commits.
- Diff `ccb9896` (commentaire `store/utils.ts`) : confirmé, ajout de
  commentaire pur, zéro ligne de code exécutable modifiée.
- `git status` propre, aucun fichier hors du scope annoncé
  (`store/publications/*` + `store/utils.ts` + le doc) n'a été touché.
- Gouvernance §5 (modification de test existant) : confirmé qu'aucun test
  préexistant n'a été modifié — tous les fichiers de test touchés sont soit
  nouveaux (`publications.store.spec.ts`), soit étendus par de nouveaux
  `describe`/`it` sans toucher aux blocs existants (`publications.effects.spec.ts`
  n'existait pas avant `b15fecb`, donc même ce fichier est net-nouveau — la
  règle ne s'applique effectivement pas ici, confirmé).

## Verdict global

**Validé, sans réserve bloquante.** Les 5 commits sont fidèles à ce qu'ils
annoncent : caractérisation écrite et vérifiée avant le nettoyage,
suppression de logs strictement cosmétique et sans effet de bord, nouvelles
specs qui testent un comportement réel (pas de la couverture creuse), et
gestion honnête de l'écart de prémisse sur la couverture de départ. 4b reste
bien gelée et non engagée.

Deux suggestions mineures, non bloquantes, pour une future itération si
quelqu'un retouche ce fichier :
1. Ajouter les cas d'échec `reject`/`archive` (pas seulement `approve`) au
   describe `handleActionResult (characterization)`, par souci de
   complétude — coût quasi nul, risque résiduel très faible en l'état.
2. Si `handleActionResult` est un jour retouché pour changer la logique de
   pagination, ajouter une assertion sur le payload (`page`/`pageSize`) des
   dispatches, pas seulement leur type — hors scope de ce commit-ci, à
   garder en tête pour la prochaine touche à ce fichier.
