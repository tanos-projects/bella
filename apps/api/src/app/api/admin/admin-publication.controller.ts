/*
https://docs.nestjs.com/controllers#controllers
*/

import { AdMapper } from '@bella/api/adapters';
import { AdDTO, PaginatedResultDTO } from '@bella/dtos';
import {
  Body,
  Controller, Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { IncomingHttpHeaders } from 'http';
import { Observable, map, switchMap } from 'rxjs';
import { AuthUser } from '../../auth/auth-user';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ModeratorIdentityService } from '../../auth/moderator-identity.service';
import { Permissions } from '../../auth/permissions.decorator';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { AdsService } from '../../infrastructure/ads/ads.service';
import { mapAdTransitionError } from '../../utils/ad-transition-error.operator';
import { parsePagination, toPaginatedResult } from '../../utils/paginated-result.helper';

// `headers` is declared explicitly (typed off Node's own @types/node
// rather than express's) because the environment this chantier has been
// executed in has intermittently been missing usable Express type
// declarations altogether (see the Phase 2 sub-point 4 blocker note in
// CHANTIER-MODERNISATION.md) - without this, ExpressRequest sometimes
// resolves to a shape TypeScript infers as lacking `headers`, breaking
// nx build/test api for reasons unrelated to any code in this file.
interface RequestWithUser extends ExpressRequest {
  user: AuthUser;
  headers: IncomingHttpHeaders;
}

// The access token itself has no email/name claim on this tenant (no
// Auth0 Action adds one) - passport-jwt validates the JWT but never sees
// the raw bearer string, so it's re-extracted here to hand to
// ModeratorIdentityService's /userinfo call.
function extractBearerToken(req: RequestWithUser): string | undefined {
  const header = req.headers?.authorization;
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme?.toLowerCase() === 'bearer' ? token : undefined;
}

// Requires the caller's Auth0 access token to carry the `manage:publications`
// permission (RBAC role assigned in the Auth0 dashboard) — see issue #49.
@Controller('admin/publications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('manage:publications')
export class AdminPublicationController {
  constructor(
    private adsService: AdsService,
    private moderatorIdentityService: ModeratorIdentityService
  ) {}

  @Get('unpublished')
  getAllUnpublished(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Observable<PaginatedResultDTO<AdDTO>> {
    const pagination = parsePagination(page, pageSize);
    return toPaginatedResult(
      this.adsService
        .findAllUnpublished({ skip: pagination.skip, limit: pagination.pageSizeNum })
        .pipe(map(AdMapper.modelToDTOList)),
      this.adsService.countUnpublished(),
      pagination
    );
  }

  // The moderation queue only ever holds ads still SUBMITTED; ads already
  // PUBLISHED need their own listing so a moderator can unpublish one after
  // the fact - reuses the public findAllPublished filter (status forced to
  // PUBLISHED) rather than duplicating that logic.
  @Get('published')
  getAllPublished(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Observable<PaginatedResultDTO<AdDTO>> {
    const pagination = parsePagination(page, pageSize);
    return toPaginatedResult(
      this.adsService
        .findAllPublished({}, { skip: pagination.skip, limit: pagination.pageSizeNum })
        .pipe(map(AdMapper.modelToDTOList)),
      this.adsService.countPublished(),
      pagination
    );
  }

  // REJECTED and ARCHIVED share one audit listing (see AdsService.findAllArchived).
  @Get('archived')
  getAllArchived(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Observable<PaginatedResultDTO<AdDTO>> {
    const pagination = parsePagination(page, pageSize);
    return toPaginatedResult(
      // populate: the "utilisateur" column needs the real owner, not a
      // bare Mongo ref (unlike the pending/published tabs, which don't
      // show an owner column and so never asked for it).
      this.adsService
        .findAllArchived({
          skip: pagination.skip,
          limit: pagination.pageSizeNum,
          populate: ['owner'],
        })
        .pipe(map(AdMapper.modelToDTOList)),
      this.adsService.countArchived(),
      pagination
    );
  }

  @Patch('unpublished/:id/approve')
  approveUnpublished(
    @Param('id') id: string,
    @Request() req: RequestWithUser
  ): Observable<AdDTO> {
    return this.moderatorIdentityService.resolve(extractBearerToken(req)).pipe(
      switchMap((moderatedBy) =>
        this.adsService
          .publish(id, moderatedBy)
          .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO))
      )
    );
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() { reason }: { reason: string },
    @Request() req: RequestWithUser
  ): Observable<AdDTO> {
    return this.moderatorIdentityService.resolve(extractBearerToken(req)).pipe(
      switchMap((moderatedBy) =>
        this.adsService
          .reject(id, reason, moderatedBy)
          .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO))
      )
    );
  }

  @Patch(':id/archive')
  archive(
    @Param('id') id: string,
    @Body() { reason }: { reason: string },
    @Request() req: RequestWithUser
  ): Observable<AdDTO> {
    return this.moderatorIdentityService.resolve(extractBearerToken(req)).pipe(
      switchMap((moderatedBy) =>
        this.adsService
          .archive(id, reason, moderatedBy)
          .pipe(mapAdTransitionError(), map(AdMapper.modelToDTO))
      )
    );
  }
}
