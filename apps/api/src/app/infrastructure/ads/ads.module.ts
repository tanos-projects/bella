import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DefaultPublicationPlanResolver, DiscoveryPlan } from '@bella/api/domain';
import { AdsRepositoryNest } from '../persistence/repositories/ads-repository-nest';
import { Ad, AdSchema } from '../persistence/schemas/ad.schema';
import { AdsService } from './ads.service';
import { PUBLICATION_PLAN_RESOLVER } from './ads.tokens';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ad.name, schema: AdSchema }])],
  providers: [
    AdsService,
    AdsRepositoryNest,
    {
      provide: PUBLICATION_PLAN_RESOLVER,
      useValue: new DefaultPublicationPlanResolver(new DiscoveryPlan(30)),
    },
  ],
  exports: [AdsService],
})
export class AdsModule {}
