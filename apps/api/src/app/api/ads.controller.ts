import { AdMapper } from '@bella/api/adapters';
import { AdStatus, UserEntity } from '@bella/api/domain';
import { AdDTO, CreateAdDTO } from '@bella/dtos';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Observable, OperatorFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { AuthUser } from '../auth/auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdsService } from '../infrastructure/ads/ads.service';
import { UsersService } from '../infrastructure/users/users.service';
import { mapAdTransitionError } from '../utils/ad-transition-error.operator';

interface RequestWithUser extends ExpressRequest {
  user: AuthUser;
}

function shuffle<T>(array: Array<T>): Array<T> {
  return [...array].sort(() => Math.random() - 0.5);
}

@Controller('publications')
export class AdsController {
  constructor(
    private adsService: AdsService,
    private usersService: UsersService
  ) {}

  @Get()
  getAll(
    @Query() filter: any, // TODO type it !
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
        // TODO Move this fake logic to service instead
        this.fakeMostRecentAds(undefined)
      );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-publications/:status')
  @ApiBearerAuth()
  getMyPublications(
    @Param() params,
    @Request() req,
    @Query() filter: any, // TODO type it !
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
    return this.adsService.findOne(id).pipe(map(AdMapper.modelToDTO));
  }

  @Get('published/:id')
  findPublishedOne(@Param('id') id: string): Observable<AdDTO> {
    return this.adsService.findOnePublished(id).pipe(map(AdMapper.modelToDTO));
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
    if ((req.user.permissions ?? []).includes('manage:publications')) {
      return this.adsService
        .publish(id)
        .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO));
    }
    return this.getUser(req.user).pipe(
      switchMap((caller) =>
        this.adsService.findOne(id).pipe(
          switchMap((ad) => {
            if (!ad.owner || ad.owner.id !== caller.id) {
              throw new ForbiddenException('Only the ad owner can publish it');
            }
            return this.adsService
              .publish(id)
              .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO));
          })
        )
      )
    );
  }

  private fakeMostRecentAds(
    limit?: number
  ): OperatorFunction<AdDTO[], AdDTO[]> {
    return map((ads: AdDTO[]) => shuffle(ads).slice(0, limit));
  }

  private getUser(user: AuthUser): Observable<UserEntity> {
    return this.usersService.findOneByIdpId(user.sub);
  }
}
