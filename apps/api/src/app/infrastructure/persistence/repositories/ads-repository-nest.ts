import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';

import { AdEntity, AdStatus } from '@bella/api/domain';
import { AdsRepository } from '@bella/api/domain';
import { FilterCriteria, FilterOptions } from '@bella/api/domain';
import { Ad, AdDocument } from '../schemas/ad.schema';

@Injectable()
export class AdsRepositoryNest implements AdsRepository {
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
    let filterToUse: any = { ...filter };

    // TODO : extract into builder class
    filterToUse = this.manageKeyword(filterToUse);
    filterToUse = this.managePrice(filterToUse);

    // console.log(options);

    return from(
      this.adModel
        // FIXME : find a way to bind User and UserEntity properly
        .find({ ...filterToUse }) // TODO remove any
        .sort({ updatedAt: -1 })
        .setOptions({
          limit: options?.limit ?? 0,
          populate: options?.populate?.join(),
        })
        .exec(),
    );
  }

  private manageKeyword(filter: any): any {
    const { keyword } = filter;
    let shallowCopy = {
      ...filter,
      // score: null,
    };

    if (keyword) {
      delete shallowCopy['keyword'];
      shallowCopy = {
        ...shallowCopy,
        $text: {
          $search: keyword,
        },
        // score: {
        //   $meta: 'textScore',
        // },
      };
    }

    return shallowCopy;
  }
  private managePrice(filter: any): any {
    const shallowCopy = { ...filter };
    const { minPrice, maxPrice } = shallowCopy;

    if (minPrice) {
      if (!shallowCopy['price']) shallowCopy['price'] = {};
      shallowCopy['price']['$gte'] = minPrice;
      delete shallowCopy['minPrice'];
    }
    if (maxPrice) {
      if (!shallowCopy['price']) shallowCopy['price'] = {};
      shallowCopy['price']['$lte'] = maxPrice;
      delete shallowCopy['maxPrice'];
    }

    return shallowCopy;
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
