import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MyConfigModule } from './config/my-config.module';
import { CountriesModule } from './countries/countries.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { AdsModule } from './ads/ads.module';
import { CategoriesModule } from './categories/categories.module';
import { HttpModule } from '@nestjs/axios';
import { CitiesModule } from './cities/cities.module';

const DOMAIN_MODULES = [
  AdsModule,
  UsersModule,
  CountriesModule,
  CategoriesModule,
  CitiesModule
];

@Module({
  imports: [HttpModule, TerminusModule, DatabaseModule, MyConfigModule, ...DOMAIN_MODULES],
  exports: [...DOMAIN_MODULES],
  controllers: [HealthController],
  providers: [],
})
export class InfrastructureModule {}
