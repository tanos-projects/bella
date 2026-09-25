// One-off backfill for the ad expiration chantier: grants every PUBLISHED ad
// that predates the expiresAt field a full 30-day Discovery lifetime counted
// from the moment this script runs (not from its original publishedAt), so
// the existing catalogue doesn't expire in bulk on day one of the rollout.
//
// Idempotent: only touches ads that don't already have expiresAt, so it is
// safe to run more than once (e.g. re-run after a partial failure).
// Deliberately independent of the AdsService/PublicationPlan domain code —
// a one-off backfill for a specific rollout date, not the ongoing rule
// (which lives in DiscoveryPlan and applies to every future publish/renew).
//
// Run against the API's own database, before the expiration job is enabled:
//   mongosh "$DATABASE_URL" --file apps/api/src/app/infrastructure/migrations/2026-09-ads-expiration-backfill.js

const LIFETIME_DAYS = 30;
const now = new Date();
const expiresAt = new Date(now.getTime() + LIFETIME_DAYS * 24 * 60 * 60 * 1000);

const result = db.ads.updateMany(
  { status: 'PUBLISHED', expiresAt: { $exists: false } },
  [
    {
      $set: {
        publishedAt: { $ifNull: ['$publishedAt', '$updatedAt'] },
        expiresAt: expiresAt,
      },
    },
  ]
);

print(`Backfilled expiresAt on ${result.modifiedCount} published ad(s), set to ${expiresAt.toISOString()}.`);
