import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AdminPublicationController } from './admin/admin-publication.controller';
// import { AdminModule } from './admin/admin.module';
import { AdsController } from './ads.controller';
import { CategoriesController } from './categories.controller';
import { CountriesController } from './countries.controller';
import { UsersController } from './users.controller';

@Module({
  imports: [InfrastructureModule, AuthModule/*, AdminModule*/],
  controllers: [
    AdsController,
    CategoriesController,
    CountriesController,
    UsersController,

    // Admin controllers
    AdminPublicationController
  ],
  providers: [],
})
export class ApiModule {}
