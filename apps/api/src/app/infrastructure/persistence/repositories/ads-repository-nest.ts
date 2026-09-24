import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';

import { AdEntity, AdStatus } from '@bella/api/domain';
import { AdsRepository } from '@bella/api/domain';
import { FilterCriteria, FilterOptions } from '@bella/api/domain';
import { Ad, AdDocument } from '../schemas/ad.schema';
import { AdsMongoFilterBuilder } from './ads-mongo-filter-builder';

@Injectable()
export class AdsRepositoryNest implements AdsRepository {
  private readonly filterBuilder = new AdsMongoFilterBuilder();

  constructor(@InjectModel(Ad.name) private adModel: Model<AdDocument>) {}

  createNew(createAd: AdEntity): Observable<AdEntity> {
    const createdAd = new this.adModel({ ...createAd });
    return from(createdAd.save());
  }

  updateOne(id: string, update: Partial<AdEntity>): Observable<AdEntity> {
    return from(
      this.adModel.findOneAndUpdate(
        { _id: id },
        // FIXME : find a way to bind User and UserEntity properly
        { ...update },
        {
          // Without this, Mongoose resolves with the pre-update document and
          // callers report the ad's previous status back to the client.
          returnDocument: 'after',
        },
      ),
    );
  }

  findAll(
    filter?: FilterCriteria,
    options?: FilterOptions,
  ): Observable<AdEntity[]> {
    const filterToUse = this.filterBuilder.build(filter);

    return from(
      this.adModel
        // FIXME : find a way to bind User and UserEntity properly
        .find({ ...filterToUse }) // TODO remove any
        .sort({ updatedAt: -1 })
        .setOptions({
          limit: options?.limit ?? 0,
          skip: options?.skip ?? 0,
          populate: options?.populate?.join(),
        })
        .exec(),
    );
  }

  count(filter?: FilterCriteria): Observable<number> {
    const filterToUse = this.filterBuilder.build(filter);

    return from(this.adModel.countDocuments({ ...filterToUse }).exec());
  }

  findOne(id: string): Observable<AdEntity> {
    return from(
      this.adModel
        .findById(id)
        .setOptions({
          populate: 'owner',
        })
        .exec(),
    );
  }

  findOnePublished(id: string): Observable<AdEntity> {
    return from(this.adModel.findOne({ _id: id, status: AdStatus.PUBLISHED }).exec());
  }

  findOneUnpublished(id: string): Observable<AdEntity> {
    // return this.findOneByIdAndPublishedStatus(id, false);
    return from(this.adModel.findOne({ _id: id, status: AdStatus.SUBMITTED }).exec());
  }

  // private findOneByIdAndPublishedStatus(
  //   id: string,
  //   published: boolean,
  // ): Observable<AdEntity> {
  //   return from(this.adModel.findOne({ _id: id, status: published }).exec());
  // }

  findOneDraft(id: string): Observable<AdEntity> {
    return from(this.adModel.findOne({ _id: id, status: AdStatus.DRAFT }).exec());
  }

  findAllByUserId(userId: string): Observable<AdEntity[]> {
    throw new Error('Method not implemented.');
  }
}
