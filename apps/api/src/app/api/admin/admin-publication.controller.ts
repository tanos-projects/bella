/*
https://docs.nestjs.com/controllers#controllers
*/

import { AdMapper } from '@bella/api/adapters';
import { AdDTO } from '@bella/dtos';
import {
  Body,
  Controller, Get,
  Param,
  Patch
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
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

  @Get('unpublished')
  getAllUnpublished(): Observable<AdDTO[]> {
    return this.adsService
      .findAllUnpublished()
      .pipe(map(AdMapper.modelToDTOList));
  }

  @Patch('unpublished/:id/approve')
  approveUnpublished(@Param('id') id: string): Observable<AdDTO> {
    return this.adsService.publish(id).pipe(map(AdMapper.modelToDTO));
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() { reason }: { reason: string }
  ): Observable<AdDTO> {
    return this.adsService.reject(id, reason).pipe(map(AdMapper.modelToDTO));
  }

  @Patch(':id/archive')
  archive(
    @Param('id') id: string,
    @Body() { reason }: { reason: string }
  ): Observable<AdDTO> {
    return this.adsService.archive(id, reason).pipe(map(AdMapper.modelToDTO));
  }
}
