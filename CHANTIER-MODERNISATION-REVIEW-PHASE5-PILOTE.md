# Revue senior indépendante — Phase 5, lot pilote (`standalone: true`)

Date : 2026-09-24. Portée : le chiffrage réel de la Phase 5, le commit
pilote `1fa187c` (SpinnerComponent → standalone), le commit doc `6253719`,
et surtout — comme explicitement demandé par le Tech Lead — la **méthode**
proposée pour la suite (séquencement sans-spec/avec-spec, cadence
qa-reviewer, remise de la règle lint à `off`). Aucun fichier de code source
touché pour produire cette revue ; les deux seuls fichiers modifiés pendant
la vérification (`apps/webapp/eslint.config.mjs`,
`apps/admin/eslint.config.mjs`, rule `error` → `off`) ont été restaurés et
leur diff vérifié nul (`git status`/`git diff` propres) avant d'écrire ce
document.

## Verdict global

**Validé avec réserves — pas bloquant sur le lot pilote lui-même, mais deux
réserves à trancher avant d'engager la suite (les 28+4 composants "avec
spec").** Le chiffrage est exact, le commit pilote est propre et sans
changement de comportement, build/lint/test sont réellement verts. La
méthode proposée pour la suite est globalement raisonnable mais repose sur
une hypothèse fausse sur ce que le filet de tests unitaires protège
réellement, et sur une lecture de la règle de gouvernance §5 comme "déjà
tranchée" alors que le document lui-même la dit explicitement non
tranchée. Détail et amendements ci-dessous.

## 1. Chiffrage — vérifié indépendamment, exact

Reproduit intégralement la méthode annoncée (flip de
`@angular-eslint/prefer-standalone` à `'error'` dans les deux
`eslint.config.mjs`, comptage, retour à `'off'`, diff nul confirmé) :

- **webapp** : 40 violations trouvées *après* le pilote (39 problèmes de
  lint baseline restent inchangés, comme annoncé). Ça ne contredit pas le
  chiffre de 41 annoncé par le Tech Lead **avant** le pilote — 41 − 1
  (Spinner, converti par le pilote) = 40, exactement ce que j'ai mesuré.
  Cohérent, pas une erreur.
- **admin** : 8 violations — exactement le chiffre annoncé, ce qui est
  attendu puisqu'aucun commit n'a touché `admin`.
- **Fichiers `@NgModule`** : 46 dans `webapp` (contre 47 annoncés avant la
  suppression de `spinner.module.ts` — encore 47 − 1 = 46, cohérent), 11
  dans `admin` (exact).
- **Répartition sans-spec/avec-spec** : reconstitué la liste complète des
  41 composants d'origine (40 mesurés + Spinner réintégré) et vérifié
  fichier par fichier la présence d'un `.spec.ts` adjacent : **13
  sans-spec / 28 avec-spec pour webapp, 4/4 pour admin** — exactement les
  chiffres du document. Aucun écart.

Le chiffrage est donc factuellement solide, pas une extrapolation.

## 2. Commit pilote `1fa187c` — vérifié, propre

- **Diff lu intégralement** (3 fichiers, 3 insertions/13 suppressions) :
  `spinner.component.ts` passe `standalone: false` → `true` ;
  `spinner.module.ts` supprimé ; `loading.module.ts` importe
  `SpinnerComponent` au lieu de `SpinnerModule`. Rien d'autre. Aucun
  changement de template, de sélecteur, de logique.
- **Aucune référence pendante** : `grep -rn "SpinnerModule\|spinner.module"` sur
  tout `apps/webapp/src` ne retourne plus rien — la suppression du fichier
  n'a rien laissé de mort ni de cassé.
- **`spinner.component.html`** relu : un `<div>` Bootstrap pur, aucun
  sous-composant `bella-*`, donc aucune dépendance de template à propager
  dans les `imports` du composant standalone. Le choix "candidat le plus
  sûr possible" est vérifié, pas seulement affirmé.
- **Build/lint/test relancés moi-même** (pas fait confiance aux chiffres
  rapportés) :
  - `nx lint webapp` → `39 problems (5 errors, 34 warnings)` — identique
    au chiffre annoncé.
  - `nx test webapp` → `38 passed, 38 total` suites, `87 passed, 87 total`
    tests — identique.
  - `nx build webapp` → succès, mêmes avertissements préexistants
    (`dayjs` CommonJS, budget de bundle dépassé) sans rapport avec ce
    commit.
  - `nx affected --target=lint,build,test --base=1fa187c^ --head=1fa187c`
    → seuls `webapp` et `webapp-e2e` affectés, confirmant qu'aucun autre
    projet n'est touché par ricochet.
  - `webapp-e2e:lint` échoue bien, mais j'ai vérifié que c'est une
    configuration ESLint cassée (`plugin:cypress/recommended` invalide,
    propriété `name` non supportée) présente depuis le palier final de la
    montée de version Angular 14→22 (commit `cf57dcd`), donc totalement
    indépendante de ce chantier et de ce commit — confirmé par `git log`
    sur `apps/webapp-e2e/eslint.config.mjs`, pas seulement supposé.

Ce point du rapport est donc entièrement corroboré. Le lot pilote lui-même
est **validé sans réserve**.

## 3. La méthode pour les composants "avec spec" — la vraie question posée

C'est le point sur lequel le Tech Lead demande explicitement un avis, et
c'est là que je ne suis pas d'accord avec la façon dont le sujet est
cadré dans le document.

### 3.1 La règle de gouvernance n'est pas "déjà tranchée" comme le §4/§7.13 le laisse entendre

Le document (§4 Phase 5, "Répartition par présence d'un spec") écrit : *"la
quasi-totalité des conversions de cette phase va nécessiter un
aller-retour `qa-reviewer` sur le fichier de spec touché"* — au singulier,
un aller-retour **par composant**. Mais `CHANTIER-MODERNISATION.md` §5
dit noir sur blanc, à propos de cette même règle : *"son exécution (qui
fait la revue, sous quelle forme) reste à définir avec l'utilisateur avant
la première phase qui pourrait la déclencher"*. Cette phase, c'est
maintenant. Le Tech Lead pose donc la question à `senior-dev` tout en
ayant déjà, dans le même document, écrit sa propre réponse par défaut (un
aller-retour par composant) comme si c'était la seule lecture possible de
la règle — ce n'est pas malhonnête (il le signale explicitement et demande
mon avis), mais l'estimation de charge ("32 allers-retours qa-reviewer")
qui en découle dans le "reste à faire" prend cette lecture comme acquise
plutôt que comme une option parmi d'autres.

**Mon avis, en tant que dev senior qui challenge le process autant que le
code** : un aller-retour `qa-reviewer` **par composant** pour un
changement mécaniquement identique (`declarations: [X]` → `imports: [X]`,
rien d'autre dans le fichier de spec) est disproportionné. Le mandat de
`qa-reviewer` lui-même n'exige pas cette granularité — il est écrit pour
juger un diff, pas restreint à un seul fichier par diff. La règle §5 exige
que **chaque commit qui modifie un spec existant reste isolé** (pour la
traçabilité et le rollback), pas que chaque commit déclenche sa propre
session de revue.

**Amendement concret proposé** : garder un commit par composant pour
l'édition de spec (rollback fin, cohérent avec la pratique déjà en place
sur ce chantier — ex. `efc3e09`), mais **grouper la soumission à
`qa-reviewer` par lots de 5 à 10 composants** plutôt qu'un aller-retour
unitaire. `qa-reviewer` peut examiner N commits mécaniquement identiques
dans une seule session et rendre un verdict par fichier (son mandat le lui
permet déjà — "pour chaque assertion supprimée ou affaiblie"), ce qui
ramène la charge de process de ~32 sessions à ~4-6, sans rien perdre sur
l'isolement des commits ni sur la rigueur de la revue individuelle par
fichier.

### 3.2 Le vrai problème n'est pas identifié par le document : `NO_ERRORS_SCHEMA` neutralise le filet que la conversion de spec est censée fournir

C'est la découverte la plus importante de cette revue, et elle change
l'évaluation du risque de toute la suite de cette phase.

`apps/webapp/src/testing/testing-support.ts` définit
`commonTestSchemas = [NO_ERRORS_SCHEMA]`, utilisé par la quasi-totalité
des specs de composants (dont `loading.component.spec.ts`, cité par le
Tech Lead comme l'exemple de référence). Le commentaire du fichier lui-même
est explicite : *"these specs assert that the component instantiates, not
that the whole template tree renders."*

Conséquence directe pour la Phase 5 : le risque de câblage que le document
identifie lui-même comme le vrai danger de cette phase (§4 Phase 5,
objectif — *"un `import` manquant dans les `imports` d'un composant
standalone une fois retiré de son NgModule"*) est **précisément le genre
d'erreur que `NO_ERRORS_SCHEMA` masque**. Un composant "avec spec" dont le
template utilise un sous-composant `bella-*` (`header.component.ts` en
compose trois : `bella-search-filter-button`, `bella-logout-btn`,
`bella-auth-login-signup` — vérifié dans `header.component.html`) peut
voir sa conversion mécanique de spec (`declarations` → `imports`) rester
**verte** même si son propre tableau `imports` standalone oublie l'un de
ces trois sous-composants, parce que le schéma dit explicitement à Angular
d'ignorer les éléments inconnus dans le rendu de test.

Autrement dit : "le spec repasse au vert après l'édition mécanique" **ne
prouve pas** l'absence du bug de câblage que cette phase redoute le plus,
pour tout composant qui a des enfants de template — c'est-à-dire une bonne
partie des 28 (webapp) + 4 (admin) "avec spec", pas un cas isolé.

**Bonne nouvelle vérifiée en contrepartie** : `apps/webapp/tsconfig.json`
a `"strictTemplates": true`. C'est le réglage qui active la vérification
stricte de type des templates par le compilateur Angular, laquelle inclut
le diagnostic `NG8001` ("is not a known element") pour tout élément
personnalisé non couvert par les `imports` (ou les `schemas`) de son
unité de compilation — vérifié comme un comportement standard du
compilateur Ivy, pas une supposition. Ce diagnostic s'applique à la
compilation du composant standalone lui-même, **indépendamment** du schéma
utilisé par son *spec* — `nx build webapp` (déjà dans le critère de
vérification de chaque lot, §4 Phase 5) devrait donc réellement attraper
un import manquant, contrairement à ce que le document laisse entendre en
écrivant que *"seul un e2e ou une vérification manuelle au navigateur
détecte ça de façon fiable"*. Cette phrase est probablement trop
pessimiste sur ce point précis de risque — mais je n'ai pas cassé
volontairement une conversion pour le vérifier empiriquement dans ce repo
(mon mandat m'interdit de modifier du code source, même temporairement,
sans que ce soit l'objet exact de la demande qui m'a été faite).

**Amendement concret proposé, à vérifier par le Tech Lead lui-même dès le
premier composant "avec spec" et "avec enfants de template" converti**
(ex. `header.component.ts` ou `footer.component.ts`) : retirer
volontairement une entrée de l'`imports` du composant fraîchement rendu
standalone, lancer `nx build webapp`, confirmer que ça échoue bien avec
`NG8001`, puis remettre l'entrée. Si confirmé, `nx build` (pas seulement
"vert", mais positionné explicitement comme le garde-fou anti-câblage
principal, en plus du lint/test) doit être documenté comme la
contre-mesure réelle et bon marché au manque d'e2e pour **cette classe
précise de bug** — ce qui ne dispense pas d'une vérification humaine pour
les classes de bug qu'un diagnostic de template ne couvre pas (portée d'un
provider, injection de service au runtime, régression CSS/host-binding,
retrait accidentel d'un `ModuleWithProviders`/`forRoot()` comme celui de
`LoadingModule`).

## 4. `LoadingComponent` laissé non-standalone — cohérent, pas une dette floue

Vérifié : `loading.component.spec.ts` utilise bien
`declarations: [LoadingComponent]`, et `LoadingComponent` fait partie des
28 composants webapp "avec spec" identifiés par le chiffrage — ce n'est
donc pas un cas à part choisi arbitrairement, c'est la conséquence directe
et cohérente d'appliquer la règle "sans-spec d'abord" à la lettre. La
question du point 4 du mandat de cette revue ("pourquoi ce composant
précisément") a une réponse simple : parce que c'est le seul consommateur
du composant converti, donc le seul autre fichier visible dans ce diff, et
le message de commit explique pourquoi il n'est pas allé plus loin.

Seul reproche mineur, cosmétique : le message de commit le formule comme
si `LoadingComponent` était un cas spécial ("intentionally left
non-standalone"), ce qui peut laisser croire à une exception ponctuelle
plutôt qu'à l'application systématique de la politique aux 27 autres
composants dans le même cas. À corriger dans la prochaine doc de synthèse
de sous-vague, pas un problème en soi.

## 5. Absence de vérification manuelle navigateur — acceptable pour ce pilote, insuffisant tel quel pour la suite

Pour **ce lot précis** : acceptable. `SpinnerComponent` n'a ni enfant de
template (vérifié §2), ni état, ni route qui en dépend directement de
façon authentifiée — le risque résiduel non couvert par build/lint/test
est proche de zéro, et je ne recommande pas de bloquer ce commit en
attendant une vérification humaine.

Pour **la suite** (12 sans-spec restants, puis 28+4 avec-spec) : le
problème va s'aggraver mécaniquement, mais pas de façon uniforme — et
c'est un angle mort du document, qui traite "pas de vérification manuelle"
comme un risque plat sur toute la phase alors que la checklist §4 (9
parcours) montre elle-même que 4 des 9 parcours (navigation publique,
filtre, onboarding pays, profil public d'un tiers) **sont** rejouables
sans compte Auth0, alors que 4 autres (connexion, profil connecté, poster
une annonce, mes publications/favoris) ne le sont pas.

Croisé avec la liste des composants "avec spec" : les composants de
formulaire (`ng-select-form-field`, `field-error`, `picture-uploader`,
`stepped-form-field`) ne sont utilisés que dans `form.module.ts` et
`profile-form.module.ts` — vérifié par grep — c'est-à-dire exclusivement
sur des routes gardées par `AuthGuard`/`CompleteProfileGuard`
(`post-an-ad`, `account/profile/form`, `settings`). Pour ces quatre-là,
**aucune** des trois protections (spec fidèle au câblage — voir §3.2 —,
e2e, vérification humaine) n'est actuellement disponible. À l'inverse,
`header.component.ts` (avec spec) est exercé sur des pages publiques
(`main`, `ad-detail`, `profile` — vérifié par grep) : un humain peut le
vérifier dès aujourd'hui sans compte Auth0.

**Amendement concret proposé** : dans l'ordre de conversion des
composants "avec spec", ne pas se limiter au critère sans-spec/avec-spec —
ajouter un sous-tri par **accessibilité à la vérification manuelle** :
1. avec-spec + reachable publiquement (`header`, `footer`, `ad-card`,
   `ad-detail`/`ad-contacts`/`ad-publisher-card`, `carousel`,
   `ads-previewer`, `search-filter*`, `drawer`, `sidebar`, ...) — humain
   peut vérifier dès maintenant, faire en premier ;
2. avec-spec + uniquement derrière Auth0 (`ng-select-form-field`,
   `field-error`, `picture-uploader`, `stepped-form-field`, et tout
   composant du flux `account`/`settings`/`post-an-ad`) — faire en
   dernier, et idéalement **geler leur mise en "acquis" définitif**
   (garder le commit mais ne pas le considérer comme clos) jusqu'à ce
   qu'un humain avec un vrai compte Auth0 (ou le spike OIDC/JWKS local déjà
   documenté en Phase 1bis) confirme le parcours, pas seulement jusqu'à ce
   que build/lint/test soient verts.

## 6. Autre point trouvé en creusant, non signalé par le Tech Lead

Le §4 Phase 5 du document (section écrite **avant** le chiffrage
d'aujourd'hui) contient un critère d'acceptation qui n'a jamais été mis à
jour pour refléter le report de la Phase 1bis : *"Critère d'acceptation :
[...] **et** les scénarios e2e de la Phase 1bis passent toujours de façon
stable après la sous-vague, pas seulement avant."* Or la Phase 1bis est
explicitement reportée (aucun scénario e2e n'existe). Ce critère
d'acceptation est donc aujourd'hui **impossible à satisfaire tel qu'écrit**
— ni la mention "Statut : engagée" ajoutée plus bas, ni la checklist
manuelle qui la remplace, ne reviennent corriger ce paragraphe plus haut
dans la même section. Ce n'est pas une incohérence de fond (l'intention —
compenser par la checklist manuelle — est claire ailleurs dans le
document), mais un résidu de rédaction qui, laissé tel quel, pourrait
induire en erreur une session future qui lirait uniquement le critère
d'acceptation formel sans remonter au paragraphe "Statut". À corriger :
remplacer ce critère par un renvoi explicite à la checklist manuelle et à
son statut d'exécution par lot.

## Résumé des amendements demandés avant de poursuivre l'exécution

1. **Batching du feu vert `qa-reviewer`** : lots de 5-10 composants avec
   spec plutôt qu'un aller-retour par composant, tout en gardant un commit
   isolé par fichier de spec édité.
2. **Vérifier empiriquement, sur le premier composant "avec enfants de
   template" converti**, que `nx build` détecte bien un import standalone
   manquant (`NG8001`) — et si confirmé, le documenter explicitement comme
   garde-fou anti-câblage budgété, en complément (pas en remplacement) de
   la checklist manuelle.
3. **Sous-trier l'ordre de conversion des "avec spec" par accessibilité à
   la vérification manuelle** (public d'abord, derrière-Auth0 en dernier
   et gelé jusqu'à vérification humaine réelle), pas seulement par
   présence/absence de spec.
4. **Corriger le critère d'acceptation obsolète** de la section Phase 5
   (renvoi e2e Phase 1bis) pour qu'il reflète la checklist manuelle
   effectivement en vigueur.

Rien de tout cela ne remet en cause le commit pilote lui-même, validé sans
réserve. Les réserves portent sur la méthode à appliquer aux 28+4
composants restants "avec spec", avant qu'ils ne soient engagés.
