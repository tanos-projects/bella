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

  // Never called in production (see CHANTIER-MODERNISATION.md §7.4): no
  // front-end (webapp/admin) or API caller was found for this interface
  // method, and it previously threw `Method not implemented.` unconditionally
  // - a broken contract rather than merely an unused one. Implemented here
  // instead of removed, on explicit product instruction, since deleting a
  // declared-but-broken interface method without confirmation risked masking
  // a real future need. No informative git history exists for this method's
  // original intent (present, unimplemented, since the very first commit
  // that introduced the API project) - this implementation is this session's
  // best-effort hypothesis, not a recovered original design: query directly
  // by the owner's id (a plain string), which is the idiomatic way to filter
  // a Mongoose `ObjectId` ref path (Mongoose casts a hex string to
  // `ObjectId` for you). This deliberately does NOT delegate to
  // `AdsService.findAllByOwner`/`AdsRepository.findAll({owner})`, which
  // takes a full `UserEntity` object rather than a bare id - that object
  // shape doesn't match this method's `userId: string` signature without a
  // lossy round-trip (`{ id: userId } as UserEntity`), and would query Mongo
  // with a whole object against an ObjectId path instead of a plain id.
  findAllByUserId(userId: string): Observable<AdEntity[]> {
    return from(
      this.adModel
        // FIXME : find a way to bind User and UserEntity properly (same
        // untyped-owner-filter cast used by `updateOne`/`findAll` above)
        .find({ owner: userId } as any)
        .sort({ updatedAt: -1 })
        .exec(),
    );
  }
}
