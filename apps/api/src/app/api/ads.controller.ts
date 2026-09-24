import { AdMapper } from '@bella/api/adapters';
import { AdStatus, UserEntity } from '@bella/api/domain';
import { AdDTO, CreateAdDTO } from '@bella/dtos';
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { AuthUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdsService } from '../infrastructure/ads/ads.service';
import { UsersService } from '../infrastructure/users/users.service';
import { mapAdTransitionError } from '../utils/ad-transition-error.operator';
import { throwIfNullish } from '../utils/throw-if-nullish.operator';
import { AdSearchQueryDTO } from './ad-search-query.dto';
import { MostRecentAdsShuffler } from './most-recent-ads-shuffler';
import { PublishAuthorizationPolicy } from './publish-authorization.policy';

interface RequestWithUser extends ExpressRequest {
  user: AuthUser;
}

// whitelist+forbidNonWhitelisted: an unrecognized query param used to reach
// AdsRepositoryNest and, from there, MongoDB unmodified (Phase 2,
// sub-point 4) - now rejected with a 400 instead of silently forwarded.
// Exported so ads.controller.spec.ts can exercise this exact instance
// directly, the same way a unit test invoking a controller method
// bypasses Nest's guard/pipe pipeline entirely (see users.controller.spec.ts's
// GUARDS_METADATA tests) - a plain call to getAll()/getMyPublications()
// never runs this pipe.
export const adSearchQueryValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('publications')
export class AdsController {
  private readonly mostRecentAdsShuffler = new MostRecentAdsShuffler();
  private readonly publishAuthorizationPolicy: PublishAuthorizationPolicy;

  constructor(
    private adsService: AdsService,
    private usersService: UsersService
  ) {
    this.publishAuthorizationPolicy = new PublishAuthorizationPolicy(
      adsService,
      usersService
    );
  }

  @Get()
  getAll(
    @Query(adSearchQueryValidationPipe) filter: AdSearchQueryDTO,
    @Query('limit') limit: number
  ): Observable<AdDTO[]> {
    return this.adsService
      .findAllPublished(
        { ...filter },
        {
          limit: limit ?? 0,
          // populate: ['owner'], // TODO Still we need this ?
        }
      )
      .pipe(map(AdMapper.modelToDTOList));
  }

  @Get('most-recent')
  getMostRecentAds(
    @Query('category') category: string,
    @Query('country') country: string,
    @Query('limit') limit: number
  ): Observable<AdDTO[]> {
    return this.adsService
      .findAllPublished(
        { category, country },
        {
          limit: limit ?? 0,
        }
      )
      .pipe(
        map(AdMapper.modelToDTOList),
        this.mostRecentAdsShuffler.fakeMostRecentAds(undefined)
      );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-publications/:status')
  @ApiBearerAuth()
  getMyPublications(
    @Param() params,
    @Request() req,
    @Query(adSearchQueryValidationPipe) filter: AdSearchQueryDTO,
    @Query('limit') limit: number,
  ): Observable<AdDTO[]> {
    const status = params.status.toUpperCase();
    if (![AdStatus.DRAFT, AdStatus.PUBLISHED, AdStatus.SUBMITTED].includes(status)) {
      throw new NotFoundException();
    }
    return this.getUser(req.user).pipe(
      switchMap((user) => {
        return this.adsService
        .findAllByOwner(
          user,
          { ...filter, ...{status: status} },
          {
            limit: limit ?? 0,
          },
        )
      }
      ,
      ),
      map(AdMapper.modelToDTOList),
    );
  }


  @Get(':id')
  findOne(@Param('id') id: string): Observable<AdDTO> {
    return this.adsService.findOne(id).pipe(
      throwIfNullish(() => new NotFoundException('Ad not found')),
      map(AdMapper.modelToDTO)
    );
  }

  @Get('published/:id')
  findPublishedOne(@Param('id') id: string): Observable<AdDTO> {
    return this.adsService.findOnePublished(id).pipe(
      throwIfNullish(() => new NotFoundException('Ad not found')),
      map(AdMapper.modelToDTO)
    );
  }

  // TODO move to admin or add right check
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  createAd(
    @Body() payload: CreateAdDTO,
    @Request() req: RequestWithUser
  ): Observable<AdDTO> {
    return this.getUser(req.user).pipe(
      switchMap((user) =>
        this.adsService.create({
          ...AdMapper.createDTOToModel(payload),
          owner: user,
        })
      ),
      map(AdMapper.modelToDTO)
    );
  }

  // Only the ad's owner, or a caller with the `manage:publications`
  // permission (see issue #49), may publish it — anyone else is rejected
  // before the transition is attempted.
  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  publishAd(
    @Param('id') id: string,
    @Request() req: RequestWithUser
  ): Observable<AdDTO> {
    return this.publishAuthorizationPolicy
      .publishIfAuthorized(id, req.user)
      .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO));
  }

  private getUser(user: AuthUser): Observable<UserEntity> {
    return this.usersService.findOneByIdpId(user.sub);
  }
}
