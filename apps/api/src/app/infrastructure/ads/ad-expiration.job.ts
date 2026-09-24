import { Injectable, Logger } from '@nestjs/common';
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
export class AdExpirationJob {
  private readonly logger = new Logger(AdExpirationJob.name);

  constructor(private readonly adsService: AdsService) {}

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
