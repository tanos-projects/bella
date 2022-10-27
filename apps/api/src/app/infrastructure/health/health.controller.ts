import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  MongooseHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private config: ConfigService,
    private health: HealthCheckService,
    private dns: HttpHealthIndicator,
    private mongooseHealth: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    // FIXME : to implement to check at least DB
    return this.health.check([
      () => this.mongooseHealth.pingCheck('mongo'),
      () =>
        this.dns.pingCheck('auth0', this.config.get<string>('AUTH_ISSUER_URL')),
    ]);
  }
}
