import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AdsController } from './ads.controller';
import { CategoriesController } from './categories.controller';
import { CountriesController } from './countries.controller';
import { UsersController } from './users.controller';

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
