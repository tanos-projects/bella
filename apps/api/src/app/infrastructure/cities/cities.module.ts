import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitiesRepositoryNest } from '../persistence/repositories/cities-repository-nest';
import { City, CitySchema } from '../persistence/schemas/city.schema';
import { CitiesService } from './cities.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: City.name, schema: CitySchema }]),
  ],
  providers: [CitiesService, CitiesRepositoryNest],
  exports: [CitiesService],
})
export class CitiesModule {}
