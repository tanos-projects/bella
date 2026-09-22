/*
https://docs.nestjs.com/controllers#controllers
*/

import { AdMapper } from '@bella/api/adapters';
import { AdDTO } from '@bella/dtos';
import {
  Body,
  Controller, Get,
  Param,
  Patch,
  UseGuards
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { AdsService } from '../../infrastructure/ads/ads.service';
import { mapAdTransitionError } from '../../utils/ad-transition-error.operator';

// Requires the caller's Auth0 access token to carry the `manage:publications`
// permission (RBAC role assigned in the Auth0 dashboard) — see issue #49.
@Controller('admin/publications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('manage:publications')
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
    return this.adsService
      .publish(id)
      .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO));
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() { reason }: { reason: string }
  ): Observable<AdDTO> {
    return this.adsService
      .reject(id, reason)
      .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO));
  }

  @Patch(':id/archive')
  archive(
    @Param('id') id: string,
    @Body() { reason }: { reason: string }
  ): Observable<AdDTO> {
    return this.adsService
      .archive(id, reason)
      .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO));
  }
}
