# QA — `AdsRepositoryNest.findAllByUserId` (commits `4032458` / `e53e135`)

**Rôle** : `qa-reviewer` (`.claude/agents/qa-reviewer.md`) — statue exclusivement
sur la modification du test **existant** `ads-repository-nest.spec.ts` →
`describe('findAllByUserId', ...)`. N'a pas revu, et ne statue pas sur, le
reste des commits `4032458`/`e53e135` (doc, autres fichiers) au-delà de ce
qui est nécessaire pour juger ce test.

## Verdict

**APPROUVÉ**

## Ce qui a été vérifié

### 1. Commits retrouvés indépendamment

```
4032458 fix(api): implement AdsRepositoryNest.findAllByUserId instead of leaving it broken
e53e135 docs(chantier): resolve §7.3 (CitiesModule) and §7.4 (findAllByUserId)
```
Confirmés par `git log --oneline` et `git show --stat` sur
`chantier/modernisation`. `4032458` touche exactement
`ads-repository-nest.spec.ts` et `ads-repository-nest.ts` (14 insertions/5
suppressions pour le spec). `e53e135` ne touche que
`CHANTIER-MODERNISATION.md`.

### 2. Contenu avant/après du bloc de test (via `git show 4032458`, diff complet lu, pas juste le résumé du commit)

**Avant** (verrouillait le `throw`) :
```ts
describe('findAllByUserId', () => {
  it('is not implemented yet', () => {
    expect(() => repository.findAllByUserId('1')).toThrow(
      'Method not implemented.'
    );
  });
});
```

**Après** (verrouille le nouveau comportement) :
```ts
describe('findAllByUserId', () => {
  it('queries Mongo directly by the owner id, most recently updated first', (done) => {
    const query = createQueryMock([{ id: 'ad-1', owner: 'user-1' }]);
    adModel.find.mockReturnValue(query);

    repository.findAllByUserId('user-1').subscribe((result) => {
      expect(adModel.find).toHaveBeenCalledWith({ owner: 'user-1' });
      expect(query.sort).toHaveBeenCalledWith({ updatedAt: -1 });
      expect(result).toEqual([{ id: 'ad-1', owner: 'user-1' }]);
      done();
    });
  });
});
```

Confirmé : l'ancien test vérifiait bien et uniquement un `throw` littéral
(`'Method not implemented.'`), rien d'autre. Confirmé : le nouveau test ne
se contente pas de « ça ne plante plus » — il vérifie trois choses
observables distinctes :
- le filtre Mongo effectivement construit (`adModel.find` appelé avec
  `{ owner: 'user-1' }`) ;
- le tri appliqué (`query.sort` appelé avec `{ updatedAt: -1 }`) ;
- la valeur résolue par l'Observable (le tableau retourné par Mongo,
  propagé tel quel).

Ce style (mock de la query Mongoose, assertions sur les arguments exacts
passés à `find`/`sort`/`setOptions`, résultat de la subscription vérifié)
est celui déjà utilisé pour `findAll`, `count`, `updateOne` et les
`status lookups` dans le même fichier (`createQueryMock`, mêmes patterns
d'assertion) — ce n'est pas un mock qui valide sa propre implémentation
après-coup, c'est la convention établie de ce fichier pour caractériser une
construction de requête Mongo au niveau repository, où le driver Mongoose
est nécessairement mocké en test unitaire.

### 3. Légitimité du changement de comportement

Le changement d'assertion (`toThrow` → vérification de requête/résultat)
est la conséquence directe et attendue du fix : une méthode qui lançait
inconditionnellement une erreur est maintenant une implémentation réelle,
donc le test qui verrouillait le `throw` doit nécessairement changer — le
maintenir tel quel aurait fait échouer la suite pour la mauvaise raison.
Ce n'est pas un affaiblissement de couverture : la nouvelle assertion est
strictement plus riche que l'ancienne (elle couvre filtre + tri + mapping
du résultat, contre une simple vérification de message d'exception), et au
moins aussi rigoureuse en styles/conventions que le reste du fichier.

### 4. Cohérence du fix avec le schéma

- `libs/api/domain/src/lib/ads/ad.entity.ts` : `AdEntity.owner?: UserEntity`.
- `apps/api/src/app/infrastructure/persistence/schemas/ad.schema.ts` (ligne
  27) : `@Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name }) owner?: User;`.

Le champ s'appelle bien `owner`, pas `userId` — `{ owner: userId } as any`
dans `findAllByUserId` est cohérent avec le schéma réel. Comparaison avec
les méthodes existantes du même fichier :
- `findAll()` fait `this.adModel.find({ ...filterToUse }).sort({ updatedAt: -1 }).setOptions(...).exec()` — même moteur de tri (`updatedAt: -1`), même
  cast `as any`/commentaire FIXME « bind User and UserEntity properly »
  déjà présent sur `updateOne` et `findAll`.
- `AdsService.findAllByOwner(owner?: UserEntity, ...)` délègue à
  `adsRepository.findAll({ ...filter, owner })`, où `owner` est une
  `UserEntity` complète, pas un id nu — le commit documente explicitement
  pourquoi il ne réutilise pas ce chemin (signature `userId: string`
  incompatible sans aller-retour avec perte d'information). Le choix
  `{owner: userId}` en interrogation directe est donc cohérent avec la
  convention Mongoose du fichier (filtrage direct d'un `ObjectId` ref par
  chaîne, casté automatiquement par Mongoose) et n'introduit pas de
  nouveau pattern.

### 5. Suites de tests relancées moi-même (pas de confiance aveugle dans le commit message)

```
npx nx test api-domain --skip-nx-cache   → 6 suites, 41 tests, tous verts
npx nx test api --skip-nx-cache          → 21 suites, 130 tests, tous verts
```
130 tests pour `api` : cohérent avec la référence de 130 tests avant cette
session — attendu, puisque cette session ne fait que modifier le corps
d'un test déjà existant (aucun `it()` ajouté ou retiré dans
`ads-repository-nest.spec.ts` : un bloc `describe('findAllByUserId', ...)`
avec un seul test avant, un seul test après). Le total inchangé confirme
qu'aucun autre test n'a été ajouté/retiré silencieusement ailleurs dans ce
commit.

### 6. Cohérence documentation (`e53e135`)

`CHANTIER-MODERNISATION.md` §7.4 (lignes ~2855-2894) et le sous-point
correspondant en §1.3/§4 décrivent fidèlement le diff réel : grep exhaustif
re-exécuté (confirmé indépendamment : `findAllByUserId` n'apparaît que dans
l'interface, l'implémentation, son spec, et un `jest.fn()` de mock dans
`ads.service.spec.ts`), choix `{owner: userId}` documenté et justifié,
mention explicite que le feu vert `qa-reviewer` n'avait pas encore été
obtenu. Rien dans la doc ne surreprésente ou ne minimise le changement de
test.

## Décision produit sous-jacente — évaluée, pas remontée

Le choix de `{ owner: userId }` en requête directe plutôt qu'une délégation
à `findAllByOwner`/`findAll({owner})` a été examiné comme candidat à une
remontée produit. Verdict : c'est un choix technique défendable et
documenté, pas une question produit à trancher — `findAllByOwner` prend une
`UserEntity` complète en paramètre, `findAllByUserId` une chaîne nue ; les
concilier aurait exigé soit changer la signature de l'interface (hors
scope de ce fix, qui n'a aucun appelant donc aucune pression pour un
changement de contrat), soit un objet `UserEntity` reconstruit à la volée
à partir du seul id, ce qui est plus fragile que d'interroger directement
sur `owner`. Le pattern (`this.adModel.find({...}).sort({updatedAt: -1}).exec()`)
est identique à celui de `findAll()` juste au-dessus dans le même fichier.
Aucune remontée nécessaire.

## Réserve mineure (non bloquante)

`findAllByUserId` reste une méthode sans appelant réel confirmé (webapp,
admin, api, libs) — le fix la rend correcte plutôt que cassée, mais ne
répond pas à la question de fond « pourquoi cette méthode existe-t-elle
dans l'interface ». C'est une question déjà identifiée et explicitement
mise de côté par décision utilisateur (« terminer plutôt que supprimer »),
documentée comme telle dans le commit et le chantier — pas une réserve QA
sur la qualité du test lui-même, donc elle n'affecte pas le verdict
**APPROUVÉ** de cette revue, qui porte uniquement sur la modification du
spec.
