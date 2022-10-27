import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AdsController } from './ads/ads.controller';
import { CategoriesController } from './categories/categories.controller';
import { CountriesController } from './countries/countries.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [InfrastructureModule],
  controllers: [
    AdsController,
    CategoriesController,
    CountriesController,
    UsersController
  ],
  providers: [],
})
export class ApiModule {}
