# Revue senior-dev — Phase 0bis (spike NestJS 11→12 Jest/ESM), 2026-09-24

## Vérifications indépendantes effectuées

- `git status` propre avant intervention (confirmé).
- `apps/api/src/__nest12_spike__.spec.ts` (fichier jetable du spike) :
  absent — confirmé supprimé.
- `git diff HEAD -- apps/api/jest.config.ts apps/api/tsconfig.spec.json` :
  vide — confirmé aucune modification résiduelle sur ces fichiers.
- `node_modules/@nestjs` : symlink unique vers
  `/home/tanos/bella/node_modules/@nestjs` — confirmé restauré (pas
  d'overlay par sous-paquet oublié).
- Ré-exécution complète et indépendante de
  `NODE_PATH=<worktree>/node_modules npx nx run-many --target=test --all
  --skip-nx-cache` : `api` 21 suites / 130 tests, `webapp` 30 suites / 43
  tests, tous verts — **chiffres strictement identiques** à ceux rapportés
  par le tech-lead au point 1 et au point 7 de son compte-rendu (§4 Phase
  0bis dans `CHANTIER-MODERNISATION.md`). Aucun écart.

## Avis sur le fond

L'échec de (a) `babel-jest` sur `import.meta.url` dans
`load-package.util.js` et l'échec de (b) sur le linking `export *` en ESM
expérimental sont tous deux des blocages structurels de l'écosystème
Jest/ts-jest face à `@nestjs/*` 12.x en ESM pur, pas des erreurs de
config qu'une itération de plus résoudrait — cohérent avec le caveat déjà
documenté en annexe avant même ce spike. Reporter est le bon appel : le
critère du mandat du spike ("time-boxé, documenté et reporté si aucune
voie ne converge, sans forcer") a été respecté à la lettre, pas contourné.

La piste Node ≥24.9 (`require(esm)` natif) identifiée dans le message
d'erreur Jest lui-même est correctement isolée comme changement
d'infrastructure hors périmètre (poste dev + CI + PM2/EC2), pas mélangée
au spike outillage — bon séquencement. Idem pour la découverte annexe
Express 5 (épinglé par `@nestjs/platform-express@12.1.0`), explicitement
sortie du scope Jest et notée comme sa propre migration à risque produit
pour le jour où NestJS 11→12 est repris.

Aucun changement de code métier, aucun commit de code (seulement docs) —
conforme au principe "aucun changement d'architecture, chantier
d'outillage pur" annoncé avant le spike.

## Verdict

**Validé.** Rien à amender. Le report est justifié par une preuve
empirique réelle (deux voies testées contre de vrais tarballs 12.1.0, pas
un raisonnement sur documentation), le nettoyage est vérifié complet et
la baseline verte est re-confirmée à l'identique par une exécution
indépendante de ce document. Le chantier peut avancer sur les phases
suivantes sans dette laissée par ce spike.
