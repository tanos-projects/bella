import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountriesRepositoryNest } from '../persistence/repositories/countries-repository-nest';
import { Country, CountrySchema } from '../persistence/schemas/country.schema';
import { CountriesService } from './countries.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Country.name, schema: CountrySchema }]),
  ],
  providers: [CountriesService, CountriesRepositoryNest],
  exports: [CountriesService],
})
export class CountriesModule {}
