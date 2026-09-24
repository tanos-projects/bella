import { IsNumberString, IsOptional, IsString } from 'class-validator';

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
}
