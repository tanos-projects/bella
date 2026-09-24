import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdsService } from './ads.service';

/**
 * PM2 runs the API in cluster mode, so several instances share the same
 * database. Only instance 0 runs the job — the correction itself relies on
 * `expireDue`'s updateMany being idempotent, this just avoids duplicate work.
 */
export function isPrimaryInstance(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.NODE_APP_INSTANCE ?? '0') === '0';
}

@Injectable()
export class AdExpirationJob implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdExpirationJob.name);

  constructor(private readonly adsService: AdsService) {}

  /**
   * Catches up immediately on whatever should have expired while the
   * process was down (deploy, crash, maintenance) — expireDue() matches on
   * expiresAt, not elapsed uptime, so one run absorbs any gap. Without this,
   * the catch-up would only happen on the next @Cron tick, up to 10 minutes
   * after restart. `@Cron`'s own `initialDelay` option can't do this: `0` is
   * falsy in JS, so `initialDelay: 0` is treated as "no delay option set"
   * and the job just waits for its normal schedule instead of running now.
   */
  onApplicationBootstrap(): void {
    this.handleExpiration();
  }

  @Cron(CronExpression.EVERY_10_MINUTES, { waitForCompletion: true })
  handleExpiration(): void {
    if (!isPrimaryInstance()) {
      return;
    }
    this.adsService.expireDue().subscribe({
      next: (count) => {
        if (count > 0) {
          this.logger.log(`Expired ${count} ad(s)`);
        }
      },
      error: (error) => this.logger.error('Failed to expire ads', error),
    });
  }
}
