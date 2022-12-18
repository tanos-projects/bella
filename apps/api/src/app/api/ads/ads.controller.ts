import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OperatorFunction, Observable } from 'rxjs';
import { ApiBearerAuth } from '@nestjs/swagger';
import { map, switchMap } from 'rxjs/operators';

import { AuthUser } from '../../auth/auth-user';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdsService } from '../../infrastructure/ads/ads.service';
import { AdDTO } from './dto/ad-dto';
import { CreateAdDTO } from './dto/create-ad-dto';
import { UsersService } from '../../infrastructure/users/users.service';

import * as AdMapper from './dto/model-mapper';
import { UserEntity } from '@bella/api/domain';
import { Request as ExpressRequest } from 'express';

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
    private usersService: UsersService,
  ) {}

  @Get()
  getAll(
    @Query() filter: any, // TODO type it !
    @Query('limit') limit: number,
  ): Observable<AdDTO[]> {
    return this.adsService
      .findAllPublished(
        { ...filter },
        {
          limit: limit ?? 0,
          // populate: ['owner'], // TODO Still we need this ?
        },
      )
      .pipe(map(AdMapper.modelToDTOList));
  }

  @Get('most-recent')
  getMostRecentAds(
    @Query('category') category: string,
    @Query('country') country: string,
    @Query('limit') limit: number,
  ): Observable<AdDTO[]> {
    return this.adsService
      .findAllPublished(
        { category, country },
        {
          limit: limit ?? 0,
        },
      )
      .pipe(
        map(AdMapper.modelToDTOList),
        // TODO Move this fake logic to service instead
        this.fakeMostRecentAds(undefined),
      );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<AdDTO> {
    return this.adsService.findOne(id).pipe(map(AdMapper.modelToDTO));
  }

  // TODO move to admin or add right check
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  createAd(
    @Body() payload: CreateAdDTO,
    @Request() req: RequestWithUser,
  ): Observable<AdDTO> {
    return this.getUser(req.user).pipe(
      switchMap((user) =>
        this.adsService.create({
          ...AdMapper.createDTOToModel(payload),
          owner: user,
        }),
      ),
      map(AdMapper.modelToDTO),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  publishAd(@Param('id') id: string): Observable<AdDTO> {
    return this.adsService.publish(id).pipe(map(AdMapper.modelToDTO));
  }

  private fakeMostRecentAds(
    limit?: number,
  ): OperatorFunction<AdDTO[], AdDTO[]> {
    return map((ads: AdDTO[]) => shuffle(ads).slice(0, limit));
  }

  private getUser(user: AuthUser): Observable<UserEntity> {
    return this.usersService.findOneByIdpId(user.sub);
  }
}
