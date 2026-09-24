# Revue senior indépendante — Phase 1bis (chiffrage e2e, report Auth0)

Date : 2026-09-24. Portée : commit `2b4714b` (docs only, Phase 1bis + §7.10
de `CHANTIER-MODERNISATION.md`). Aucun fichier de code source touché ;
vérifications faites par lecture directe, exécution de `mongod`/`curl` dans
`$TMPDIR`, et une requête réseau réelle vers le tenant Auth0 (voir §2 —
aucune trace laissée : aucun processus mongod resté vivant, aucune donnée
écrite dans le repo).

## 1. Vérification factuelle indépendante — tout confirmé, avec une nuance importante

| Claim | Vérifié comment | Résultat |
|---|---|---|
| Aucun `.env`, seulement `.env.dist` | `ls -la .env .env.dist` | Confirmé |
| `JwtAuthGuard` valide la signature via `jwks-rsa` contre le vrai tenant, `algorithms: ['RS256']` | Lecture directe de `apps/api/src/app/auth/jwt.strategy.ts` | Confirmé — `passportJwtSecret({jwksUri: ...AUTH_ISSUER_URL.../.well-known/jwks.json})`, RS256 uniquement. Un token forgé côté client sans la clé privée réelle du tenant ne passera jamais ce guard, indépendamment de tout mock front. |
| `mongod`/`mongosh` installés, socket Unix par défaut refusé en écriture, `--nounixsocket` fonctionne | `mongod --dbpath ... --port 27099` (sans l'option) → `"Failed to unlink socket file","error":"Read-only file system"` puis `fassert` fatal ; identique au symptôme décrit | Confirmé mot pour mot |
| Aucun `users.fixture.mongodb` | `find apps/api/src/app/infrastructure/fixtures -type f` → seulement `ads`/`categories`/`cities`/`countries` | Confirmé |
| Champ `images` du form `post-an-ad` sans `required: true`, contrairement aux autres champs | Lecture de `ad-form.component.ts` | Confirmé — seul champ du formulaire sans `required: true` explicite |
| `UploadService.uploadMultiple()` court-circuite vers `of([])` si `files` vide | Lecture de `upload.service.ts:71` | Confirmé — `files?.length ? forkJoin(...) : of([])` |
| `admin` : **toutes** les routes (`dashboard`, `publications`, y compris `access-denied`, et le wildcard qui redirige vers `dashboard`) portent `AuthGuard` | Lecture de `apps/admin/src/app/app.routes.ts` | Confirmé — il n'existe **aucune** route admin accessible sans login, pas même une page d'erreur |
| `webapp` : `post-an-ad` gardé par `AuthGuard`+`CompleteProfileGuard` | Lecture de `app-routing.module.ts` (déjà vérifiée lors de la revue Phase 2) | Confirmé |
| Tenant Auth0 refusé par la politique réseau par défaut du sandbox | `curl https://dev-bata.eu.auth0.com/.well-known/openid-configuration` sans domaine autorisé → `deny network-outbound dev-bata.eu.auth0.com:443` | Confirmé |

**Nuance factuelle à corriger dans le libellé, sans changer la conclusion** :
le message du Tech Lead (et la formulation actuelle du document, « le tenant
réel ... est injoignable par défaut depuis ce sandbox ») peut se lire comme
« le tenant Auth0 est inaccessible », ce qui est inexact. J'ai retesté le
même appel en autorisant explicitement `dev-bata.eu.auth0.com` dans les
domaines de cette commande — **le tenant répond normalement** (document de
découverte OIDC complet reçu, `jwks_uri` inclus). Le blocage réseau constaté
n'est **pas** une propriété du tenant ni de l'infrastructure du chantier :
c'est une politique par défaut de **cette session sandbox précise**,
contournable à la commande près en déclarant le domaine. Ça ne change rien
à la décision : même avec le réseau ouvert, il n'existe toujours aucun
identifiant (mot de passe d'un compte de test, ou client secret pour un
grant machine-to-machine) pour obtenir un JWT réellement signé par ce
tenant — **le vrai blocage dur reste les identifiants, pas le réseau**. Je
recommande de reformuler légèrement §4/§7.10 pour ne pas laisser penser
qu'un blocage réseau structurel existe : c'est le blocage sur les
identifiants qui est réellement dur et permanent tant que personne ne
fournit de compte de test.

## 2. La décision de reporter était-elle la bonne, ou une voie moins chère a-t-elle été écartée trop vite ?

**Le rejet du mock complet du SDK Auth0 est le bon appel, et bien
raisonné** : j'ai vérifié moi-même que `JwtStrategy` valide en RS256 contre
le JWKS réel — un mock front sans bypass du guard API ne fait *rien*
passer, donc le mock front seul est un cul-de-sac technique, pas seulement
une question de principe. Le distinguo que fait le Tech Lead (mocker le SDK
front ne suffit pas, il faudrait *aussi* contourner la vérification JWKS
côté API, ce qui retire la frontière de sécurité que l'e2e est censé
vérifier) est exact et bien posé — accepté sans réserve.

**La piste "serveur OIDC/JWKS local factice" est correctement classée comme
hors budget de cette session, pas rejetée sans y avoir réfléchi** — c'est
noté comme la suite naturelle, sur le modèle de la Phase 0bis (son propre
spike time-boxé). C'est la bonne ligne à tracer : construire un faux serveur
JWKS est un vrai chantier d'infrastructure de test (générer une paire de
clés RS256, servir `/.well-known/jwks.json`, signer un JWT de test avec le
bon `kid`/`iss`/`aud`, reconfigurer `AUTH_ISSUER_URL` **et** les deux
`environment.ts` front pour ce sandbox) — pas quelque chose à improviser
dans le même passage que le chiffrage.

**Un chemin moins cher n'a pas été exploré et mérite d'être nommé
explicitement, même s'il ne change pas la décision de reporter le "L"
complet** : je n'ai trouvé aucune trace, dans le rapport ou dans le diff, de
considération d'un **scénario e2e minimal côté webapp qui ne nécessite pas
Auth0 du tout**. `apps/webapp/src/app/app-routing.module.ts` montre que
`annonces` (navigation publique des annonces) et `profil/:id/:username`
(page de profil public — voir aussi la revue Phase 2, §3.1) n'ont que
`canLoad: [WelcomeGuard]`, sans `AuthGuard`. Un scénario e2e minimal du
genre « ouvrir `/annonces`, vérifier que la liste se charge » ne couvre ni
"post-an-ad jusqu'à SUBMITTED" ni "modération admin" (les deux scénarios
réellement ciblés par la Phase 1bis, tous deux gardés par login), mais
apporterait une valeur réelle et immédiatement accessible :
- il validerait que la mécanique Cypress elle-même fonctionne dans ce
  sandbox (config, `baseUrl`, `webServerCommand`, etc.) — actuellement
  jamais vérifiée puisque les placeholders Nx n'ont jamais tourné contre
  l'appli réelle ;
- il détecterait un vrai risque de câblage mentionné dans le mandat
  (`WelcomeGuard`, routing cassé après extraction de module) sur au moins
  une portion du parcours webapp, en particulier utile pour la Phase 5 côté
  webapp qui touchera potentiellement ce module ;
- côté `admin`, en revanche, **rien n'est salvageable** : j'ai vérifié que
  `app.routes.ts` garde absolument toutes les routes (y compris
  `access-denied` et le wildcard) derrière `AuthGuard` — il n'existe
  littéralement aucune page admin atteignable sans login, donc le constat
  "bloqué en totalité" est exact et non contestable pour cette app.

Ce n'est pas une réserve bloquante — la Phase 1bis telle que scopée (2
scénarios précis, tous deux gardés par login) est bien intégralement
bloquée, et forcer un scénario non prévu au mandat aurait été du
hors-scope non demandé. Mais je recommande de l'ajouter comme **option de
consolation notée pour une reprise partielle**, avant le spike OIDC complet :
un scénario Cypress public côté webapp coûte une fraction du "L" complet et
fait au moins sortir `webapp-e2e` de l'état "jamais exécuté contre l'appli
réelle".

## 3. Le langage d'acceptation de risque pour les Phases 4/5 est-il suffisant ?

Relu §4 (Phase 1bis, "Conséquence actée") et §4 Phase 5 elle-même :

- **Phase 4** : l'argument ("le scope obligatoire 4a est déjà à risque
  faible, sans changement de comportement") est correct et vérifiable —
  confirmé lors de la revue Phase 2 que 4a se limite à du nettoyage
  (retrait de `console.log`, tests ajoutés) sans toucher au comportement.
  Le risque résiduel de l'absence d'e2e sur 4a est donc réellement faible,
  pas juste affirmé comme tel.
- **Phase 5** : la compensation ("vérification manuelle au navigateur
  systématique par sous-vague") est concrète et actionnable (pas un vœu
  pieux — une étape nommée, positionnée par sous-vague comme déjà
  structuré dans la Phase 5 elle-même), et le document reconnaît
  explicitement sa propre insuffisance ("insuffisant en soi ... mais mieux
  que rien") plutôt que de la présenter comme équivalente à un vrai filet
  e2e. C'est le bon niveau d'honnêteté — ni hand-wavy, ni faussement
  rassurant.

**Une lacune mineure** : le texte ne précise pas *qui* fait cette
vérification manuelle ni sur quel référentiel (une checklist minimale
existe-t-elle : les deux parcours webapp/admin identifiés en Phase 1bis,
au clic, avant chaque merge de sous-vague ?). Sans checklist écrite, "
vérification manuelle systématique" risque de devenir vérification manuelle
occasionnelle sous pression de calendrier. Recommandation : quand la Phase 5
sera réellement lancée, transformer cette phrase en une checklist concrète
(2-4 puces, les parcours exacts à rejouer à la main) plutôt que de la
laisser comme une intention générale.

## Verdict

**Validé avec réserves mineures** — aucune ne remet en cause la décision de
reporter la Phase 1bis, qui est bien fondée et honnêtement chiffrée.

1. **(Précision factuelle, pas un fait erroné mais une formulation trompeuse)**
   Le blocage réseau vers `dev-bata.eu.auth0.com` est une politique par
   défaut de *cette session sandbox*, pas une propriété du tenant ou de
   l'infra du chantier — vérifié en le contournant à la commande près. Le
   vrai blocage dur et permanent, celui qui justifie le report, est
   l'absence d'identifiants, pas le réseau. Reformuler légèrement §4/§7.10
   pour ne pas suggérer un mur réseau structurel qui n'existe pas.
2. **(Amendement concret, non bloquant)** Un scénario e2e public minimal
   côté `webapp` (ex. `/annonces` se charge) est accessible sans aucun
   contournement Auth0 et aurait pu être un livrable de consolation à coût
   quasi nul avant/à la place d'attendre le spike OIDC complet — à
   considérer pour une reprise partielle. Confirmé en parallèle qu'aucun
   équivalent n'existe côté `admin` (100% des routes gardées).
3. **(Lacune mineure)** La compensation "vérification manuelle" pour la
   Phase 5 devrait être transformée en checklist concrète au moment de son
   déclenchement réel, pas laissée comme intention générale.

Les faits vérifiables (Auth0/JWKS, mongod, Cloudinary/UploadService, guards
webapp et admin, absence de fixture utilisateur) sont tous exacts. Le
raisonnement sur le rejet du mock SDK est solide et vérifié indépendamment
contre le vrai code du guard, pas seulement contre la documentation.
