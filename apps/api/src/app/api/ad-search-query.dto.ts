import { Type } from 'class-transformer';
import { IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';

/**
 * Query-string contract for AdsController.getAll/getMyPublications (Phase
 * 2, sub-point 4). Previously `@Query() filter: any` let any query
 * parameter reach AdsRepositoryNest.findAll and, from there, MongoDB
 * unmodified (protected only by Mongoose's global `strictQuery: true`, not
 * by an actual validated contract).
 *
 * Deliberately kept out of libs/dtos: every other DTO there is a plain
 * interface shared with both front-ends, and neither front-end needs (or
 * should bundle) class-validator - this is a controller-layer validation
 * concern specific to apps/api, not a resource shape the front-ends
 * construct or read.
 *
 * minPrice/maxPrice are validated as numeric strings, not numbers/coerced:
 * a raw HTTP query value is always a string, and AdsMongoFilterBuilder
 * already forwards it as-is into the Mongo filter - this DTO only rejects
 * a non-numeric value, it doesn't change what a valid one does.
 *
 * `limit` belongs here too, and only here: both handlers used to also bind
 * a separate `@Query('limit') limit: number` parameter alongside
 * `@Query() filter: AdSearchQueryDTO`. Nest resolves a keyless `@Query()`
 * to the *entire* query object, `limit` included, so with
 * `forbidNonWhitelisted: true` any real `?limit=` call to these routes was
 * rejected with a 400 ("property limit should not exist") even though
 * `limit` is a documented parameter of both - dead code today only because
 * no front-end happens to send it on these two routes yet. Unlike
 * minPrice/maxPrice, `limit` *is* coerced to a number (`@Type(() =>
 * Number)`): AdsController pulls it out of this same DTO instance and
 * passes it straight through as `FilterOptions.limit`, which is typed
 * `number`, not forwarded into the Mongo filter as a raw string.
 */
export class AdSearchQueryDTO {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  quality?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
