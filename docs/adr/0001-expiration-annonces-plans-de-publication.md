# 0001 — Expiration des annonces et plans de publication

## Contexte

Une annonce `PUBLISHED` restait en ligne indéfiniment, jusqu'à une action
manuelle de modération (`archive()`). Le besoin : une durée de vie (30
jours) après laquelle l'annonce n'est plus visible, et un moyen pour son
propriétaire de la renouveler.

La durée de 30 jours et la règle de renouvellement (aujourd'hui gratuit)
ne devaient pas être câblées en dur dans le service : l'objectif produit
est de pouvoir introduire plus tard des plans payants (durée de vie plus
longue, mise en avant, renouvellement payant…) sans reprendre la machine à
états ou le contrôleur.

Un autre chantier, mené en parallèle sur ce même dépôt (fichier de cadrage
`CHANTIER-EXPIRATION-ANNONCES.md`, non commité), avait exploré la question
sous un angle différent — recommandant de ne pas ajouter de nouveau statut
et de réutiliser `ARCHIVED` via un cron. Ce document explique pourquoi ce
chantier-ci a tranché autrement.

## Décision

- **Nouveau statut `AdStatus.EXPIRED`**, distinct d'`ARCHIVED`. `ARCHIVED`
  est une sanction de modération, posée par `archive()` avec
  `moderatedBy`/`approbationMessage` ; la state machine ne doit pas
  permettre à un propriétaire d'en sortir en renouvelant. Réutiliser
  `ARCHIVED` pour l'expiration aurait mélangé les deux et permis
  exactement cela. La crainte initiale d'ajouter un statut ("state
  machine fragile") ne s'applique plus : chaque transition passe
  désormais par un garde-fou (`transitionTo`) qui refuse d'agir sur un
  statut de départ inattendu.
- **`AdEntity` gagne `publishedAt`** (déjà posé par un chantier précédent)
  **et `expiresAt`**, posés par `publish()`. Pas de `planCode` ni de
  `renewalCount` : rien ne les aurait lus (le renouvellement Discovery est
  gratuit et illimité) ; en leur absence, un futur plan payant se lit
  comme « pas de plan enregistré ⇒ Discovery ».
- **Point d'extension `PublicationPlan`** (`libs/api/domain/src/lib/publication-plans/`) :
  ```ts
  interface PublicationPlan {
    readonly code: string;
    expiryFrom(from: Date): Date;
    renewal(ad: AdEntity, now: Date): RenewalDecision;
  }
  type RenewalDecision =
    | { outcome: 'GRANTED' }
    | { outcome: 'REFUSED'; reason: string };
  interface PublicationPlanResolver {
    resolveFor(ad: AdEntity): PublicationPlan;
  }
  ```
  `DiscoveryPlan` (30 jours, renouvellement toujours `GRANTED`) est la
  seule implémentation. `DefaultPublicationPlanResolver` renvoie ce même
  plan pour toute annonce. `RenewalDecision` est une union discriminée :
  un futur renouvellement payant s'ajoute comme une nouvelle variante
  (p. ex. `{ outcome: 'PAYMENT_REQUIRED'; quote: ... }`), que le service
  traite avec un `switch` exhaustif — le compilateur signale alors tous
  les appelants à mettre à jour. `Clock` (`libs/api/domain/src/lib/shared/clock.ts`)
  isole l'horloge système pour des tests déterministes.
- **`AdsService` reçoit `planResolver` et `clock` en dépendances
  obligatoires du constructeur** (pas de valeur par défaut) : une horloge
  système implicite rendrait les tests temporels instables, et une valeur
  par défaut masquerait la dépendance réelle. Côté Nest, un seul token
  (`PUBLICATION_PLAN_RESOLVER`) est fourni ; `systemClock` est passé
  directement par la sous-classe `apps/api/.../ads/ads.service.ts`.
- **Expiration : un job planifié seul, pas de filtre à la lecture.**
  `AdExpirationJob` (`@Cron(EVERY_10_MINUTES)`) appelle
  `AdsService.expireDue()`, qui délègue à
  `AdsRepository.expireDue(now)` — un `updateMany` idempotent
  (`{status: PUBLISHED, expiresAt: {$lte: now}} → {status: EXPIRED}`).
  Filtrer aussi à la lecture aurait rendu `status` incohérent (une
  annonce techniquement `PUBLISHED` mais invisible) sans même dispenser
  du job, puisque le statut doit de toute façon changer pour permettre le
  renouvellement.
  `@nestjs/schedule` est **épinglé en `~6.1.3`** : son tag `latest` (12.x)
  est publié en pur ESM, ce qui casse Jest/ts-jest sur ce projet (déjà
  documenté comme bloquant la migration Nest 11→12, voir
  `CHANTIER-MODERNISATION.md`).
- **PM2 tourne en cluster** (plusieurs process Node) : le job ne s'exécute
  que sur l'instance `NODE_APP_INSTANCE=0` (`isPrimaryInstance`), pour
  éviter le travail en double — mais la correction elle-même repose sur
  l'idempotence de l'`updateMany`, pas sur ce filtre.
- **Renouvellement** : `AdsService.renew(id, requesterId)` vérifie la
  propriété **dans le domaine** (contrairement à `publish`, où ce
  contrôle vit dans le contrôleur) — « seul le propriétaire renouvelle »
  est la règle métier elle-même, pas une autorisation posée par-dessus.
  L'écriture passe par `AdsRepository.updateOneInStatus(id, EXPIRED, …)`,
  un compare-and-set qui échoue (renvoie `null` → `AdNotInExpectedStateError`)
  si une transition concurrente (le job, ou un double clic) a fait sortir
  l'annonce d'`EXPIRED` entre la lecture et l'écriture.
  Exposé via `POST publications/:id/renew`
  (`AdNotOwnedError` → 403, `AdRenewalRefusedError` → 409,
  `AdNotInExpectedStateError` → 404, sans changer le contrat 404 existant
  de `publish`/`reject`/`archive`).
- **Backfill** (`apps/api/src/app/infrastructure/migrations/2026-09-ads-expiration-backfill.js`,
  lancé une fois via `mongosh`, avant l'activation du job) : les annonces
  `PUBLISHED` déjà en base reçoivent 30 jours à partir de la date
  d'exécution du script (pas de leur `publishedAt` d'origine), pour éviter
  qu'elles n'expirent toutes en bloc le jour du déploiement. Idempotent
  (`expiresAt: {$exists:false}`), vérifié en local (74 annonces
  backfillées, deuxième exécution → 0).
- **Webapp** : section « Mes annonces expirées » sur `my-publications`,
  avec bouton Renouveler ; admin **hors périmètre** pour ce chantier —
  l'onglet « Annonces archivées » (`findAllArchived`, qui regroupe
  `REJECTED`+`ARCHIVED`) n'inclut pas `EXPIRED`.

## Conséquences

- Ajouter un plan payant : une nouvelle implémentation de
  `PublicationPlan`, un `PublicationPlanResolver` qui lit l'abonnement du
  propriétaire (ou tout autre critère), et éventuellement une nouvelle
  variante de `RenewalDecision`. Ni `AdsService`, ni le contrôleur, ni le
  schéma Mongo n'ont besoin de changer de structure.
- Jusqu'à 10 minutes de retard entre l'expiration réelle et le passage à
  `EXPIRED` (fréquence du job) — acceptable pour une durée de vie de 30
  jours.
- Une dépendance de plus épinglée en CommonJS, à réévaluer si/quand
  `@nestjs/schedule` publie une version 12+ compatible Nest 12 en CJS.
- **Dette assumée, hors périmètre de ce chantier** : l'admin ne voit pas
  les annonces expirées séparément des archivées (pas de vue dédiée) ;
  `GET publications/:id`, public, ne filtre aucun statut (expose déjà
  `DRAFT`, expose maintenant aussi `EXPIRED`) ; pas de notification avant
  expiration ; un renouvellement remonte l'annonce en tête des listes
  triées par `updatedAt` (choix produit non tranché) ; `publishAd` permet
  au propriétaire de s'auto-publier une annonce `SUBMITTED`
  (contournement de la modération, bug préexistant sans rapport avec ce
  chantier).

## Alternatives rejetées

- **Réutiliser `ARCHIVED`** plutôt qu'un nouveau statut — mélangerait
  sanction de modération et fin de vie naturelle ; un propriétaire
  pourrait annuler une décision de modération en renouvelant.
- **Une variable d'environnement `AD_LIFETIME_DAYS`** — aucun point
  d'extension par plan, ne répond pas au besoin produit d'une logique
  différenciée à terme.
- **Filtrer `expiresAt` à la lecture, sans job ni changement de statut**
  — `status` resterait incohérent avec la réalité, et il faudrait de
  toute façon un mécanisme de transition pour permettre le renouvellement.
- **`PublicationPlanResolver.resolveFor` asynchrone (`Observable`)** —
  écarté comme prématuré tant qu'un seul plan existe et que le critère de
  résolution d'un futur plan (par annonce ? par abonnement utilisateur ?)
  n'est pas connu ; passer en asynchrone le jour venu ne change que le
  resolver, pas `AdsService`.
- **Séparer `LifetimePolicy` et `RenewalPolicy`** — prématuré avec une
  seule implémentation ; à faire le jour où deux plans partageront l'une
  des règles sans l'autre.
- **Valeurs par défaut dans le constructeur d'`AdsService`** (plan/horloge
  implicites) — masqueraient la dépendance réelle et rendraient les tests
  temporels non déterministes par défaut.
