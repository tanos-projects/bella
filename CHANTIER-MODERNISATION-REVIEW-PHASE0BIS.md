# Revue senior indépendante — Phase 0bis (spike NestJS 11→12 Jest/ESM)

Date : 2026-09-24. Portée : commit `cea3422` (docs only, §1.4 + Phase 0bis de
`CHANTIER-MODERNISATION.md`). Aucun fichier de code touché par cette revue ;
seule vérification via un téléchargement de tarball npm réel dans
`$TMPDIR`, jamais dans l'arbre du repo.

## Ce qui a été vérifié indépendamment

- **`git status` propre, un seul commit doc, `package.json` toujours épinglé
  sur `~11.2.6`** pour tous les `@nestjs/*` — aucune trace résiduelle de
  version 12.x. `node_modules/@nestjs` est bien redevenu un symlink unique
  vers l'arbre partagé (`/home/tanos/bella/node_modules/@nestjs`) — l'overlay
  temporaire du spike a bien été défait.
- **La claim technique centrale (a) est exacte, vérifiée sur le vrai paquet** :
  j'ai téléchargé moi-même `@nestjs/common@12.1.0` depuis le registre npm
  public (`npm pack`, hors arbre du repo). Confirmé :
  - `package.json` du paquet porte `"type": "module"` — 12.x est bien pur
    ESM, comme documenté.
  - `utils/load-package.util.js` utilise bien `createRequire(import.meta.url)`.
  - `pipes/validation.pipe.js` fait un `import { loadPackage } from
    '../utils/load-package.util.js'` **au niveau module** (pas différé), et
    `pipes/index.js` réexporte `validation.pipe.js` via `export *` — donc
    charger/transpiler `@nestjs/common` (même sans jamais appeler
    `ValidationPipe.transform()`) force bien l'évaluation du fichier
    porteur de `import.meta.url`. C'est précisément le mécanisme décrit
    (« chargé de façon non paresseuse ») — pas une approximation.
- **La claim (b)** (échec de linking ESM natif Jest sur la chaîne `export *
  from` profonde de `@nestjs/common`) est plausible et cohérente avec les
  limitations documentées de `--experimental-vm-modules`, mais n'a pas été
  reproduite indépendamment par moi (aurait demandé de refaire tourner tout
  le spike sous Jest ESM, hors budget de cette contre-vérification) —
  acceptée sur la base de la précision déjà démontrée sur (a).
- **La piste Node ≥ 24.9** et la **découverte Express 5** (épinglé par
  `@nestjs/platform-express@12.1.0`) sont notées avec la bonne granularité :
  correctement classées hors périmètre du spike (infra Node / migration
  Express à part entière), pas minimisées ni gonflées.

## Verdict

**Validé, sans réserve.** La méthode (spike réellement exécuté avec de vrais
paquets, pas seulement raisonné sur la doc NestJS), le nettoyage (aucune
trace laissée, baseline re-confirmée identique), et la décision de report
(le critère de rollback du plan — NestJS 11.x n'est pas bloquant
fonctionnellement — s'applique proprement) sont tous corrects. La piste
Node ≥ 24.9 et le risque Express 5 sont des ajouts de valeur réelle pour une
future tentative, correctement scopés en dehors de cette phase plutôt que
traités comme acquis.
