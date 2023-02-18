/*
https://docs.nestjs.com/controllers#controllers
*/

import { AdMapper } from '@bella/api/adapters';
import { AdDTO } from '@bella/dtos';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { map, Observable, of } from 'rxjs';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdsService } from '../../infrastructure/ads/ads.service';

// ADMIN ROLES
// publications : can manage publications (approve, reject, delete) ?
// users : can manage user
//

@Controller('admin/publications')
// TODO add ADMIN Guards here
// @UseGuards(JwtAuthGuard)
export class AdminPublicationController {
  constructor(private adsService: AdsService) {}
  // TODO Remove me !
  @Get('hello')
  // @SetMetadata('roles', ['admin'])
  getHello(): Observable<string> {
    return of('Hello my friend');
  }

  @Get('unpublished')
  getAllUnpublished(
  ): Observable<AdDTO[]> {
    return this.adsService
      .findAllUnpublished()
      .pipe(map(AdMapper.modelToDTOList));
  }
}
