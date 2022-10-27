import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdsRepositoryNest } from '../persistence/repositories/ads-repository-nest';
import { Ad, AdSchema } from '../persistence/schemas/ad.schema';
import { AdsService } from './ads.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ad.name, schema: AdSchema }])],
  providers: [AdsService, AdsRepositoryNest],
  exports: [AdsService],
})
export class AdsModule {}
