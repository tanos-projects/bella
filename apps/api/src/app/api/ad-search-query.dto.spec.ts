import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

import { AdSearchQueryDTO } from './ad-search-query.dto';
import { adSearchQueryValidationPipe } from './ads.controller';

// Phase 2, sub-point 4: getAll/getMyPublications used to accept
// `@Query() filter: any`, so any query parameter reached
// AdsRepositoryNest and, from there, MongoDB unmodified. These exercise
// the actual ValidationPipe instance the controller binds to those
// parameters directly - a unit test invoking AdsController.getAll(...)
// as a plain method call never runs Nest's pipe pipeline, the same
// reason ads.controller.spec.ts's other tests can't observe this either
// (see users.controller.spec.ts's GUARDS_METADATA tests for the same
// caveat with guards).
describe('adSearchQueryValidationPipe (AdSearchQueryDTO)', () => {
  const metadata: ArgumentMetadata = {
    type: 'query',
    metatype: AdSearchQueryDTO,
    data: undefined,
  };

  it('accepts an empty query with no filters at all', async () => {
    const result = await adSearchQueryValidationPipe.transform({}, metadata);

    expect(result).toBeInstanceOf(AdSearchQueryDTO);
  });

  it('accepts every documented filter field', async () => {
    const result = await adSearchQueryValidationPipe.transform(
      {
        category: 'cars',
        city: 'Abidjan',
        country: 'CI',
        keyword: 'bike',
        quality: 'good',
        minPrice: '10',
        maxPrice: '100',
        limit: '20',
      },
      metadata
    );

    expect(result).toMatchObject({
      category: 'cars',
      city: 'Abidjan',
      country: 'CI',
      keyword: 'bike',
      quality: 'good',
      minPrice: '10',
      maxPrice: '100',
      limit: 20,
    });
  });

  it('rejects an unrecognized query parameter instead of forwarding it to MongoDB', async () => {
    await expect(
      adSearchQueryValidationPipe.transform(
        { category: 'cars', $where: 'malicious' },
        metadata
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-numeric minPrice', async () => {
    await expect(
      adSearchQueryValidationPipe.transform({ minPrice: 'abc' }, metadata)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-numeric maxPrice', async () => {
    await expect(
      adSearchQueryValidationPipe.transform({ maxPrice: 'abc' }, metadata)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-string category', async () => {
    await expect(
      adSearchQueryValidationPipe.transform({ category: 123 }, metadata)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Regression test for the bug the dev-lead review caught in this
  // sub-point: getAll()/getMyPublications() used to bind this pipe to a
  // keyless `@Query() filter: AdSearchQueryDTO` *and* a separately-bound
  // `@Query('limit') limit: number` on the same handler. A keyless
  // `@Query()` resolves to the entire query object, `limit` included, so
  // that object - `limit` and all - is what actually reached this pipe;
  // before `limit` was a whitelisted property of AdSearchQueryDTO, any
  // real `?limit=` call to either route 400'd with "property limit should
  // not exist", even though `limit` is a documented parameter of both.
  it('accepts limit alongside other filters and coerces it to a number', async () => {
    const result = await adSearchQueryValidationPipe.transform(
      { category: 'cars', limit: '5' },
      metadata
    );

    expect(result).toMatchObject({ category: 'cars', limit: 5 });
  });

  it('rejects a non-integer limit', async () => {
    await expect(
      adSearchQueryValidationPipe.transform({ limit: 'abc' }, metadata)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// Express 4 → 5 characterization (CHANTIER-MODERNISATION.md §4, Phase 0bis,
// Node ≥24.9 spike, task "qualifier Express 5"). @nestjs/platform-express@12
// pins Express to 5.2.1, whose default query-string parser flips from `qs`
// (Express 4, "extended": nested bracket syntax like `?keyword[$ne]=1`
// parses to a nested object `{ keyword: { '$ne': '1' } }`) to Node's own
// `querystring` module (Express 5, "simple": the same bracket syntax is
// NOT parsed as nesting - `keyword[$ne]` stays a single literal property
// key, e.g. `{ 'keyword[$ne]': '1' }`, and `keyword` itself is absent).
//
// AdSearchQueryDTO (this file) is 100% scalar fields (IsString/
// IsNumberString/IsInt) - read the class above: no field is declared as an
// array or nested object, and neither is any other @Query()-bound
// parameter anywhere in apps/api/src (grepped: categories.controller.ts's
// `selectable`, admin-publication.controller.ts's `page`/`pageSize`, and
// ads.controller.ts's own `getMostRecentAds` are all single scalar
// @Query('x') bindings). So the two parsers never diverge for any
// well-formed request this API's front-ends actually send.
//
// The only place the parser choice could matter is a malformed/adversarial
// request deliberately shaped as nested/array data (e.g. probing for a
// NoSQL-injection path into AdsMongoFilterBuilder, which spreads whatever
// this pipe lets through straight into the Mongo filter - see
// ads-mongo-filter-builder.ts). These tests pin down that outcome: this
// pipe (whitelist + forbidNonWhitelisted + per-field scalar validators)
// rejects BOTH shapes a real request could produce - qs's nested-object
// shape, and querystring's literal-bracket-key shape - with a
// BadRequestException, regardless of which Express major version parsed
// the query string. That is the property this suite must still hold after
// bumping to NestJS 12/Express 5 (task 1, step 4 of the chantier).
describe('adSearchQueryValidationPipe - Express 4 vs 5 query-parser shapes', () => {
  const metadata: ArgumentMetadata = {
    type: 'query',
    metatype: AdSearchQueryDTO,
    data: undefined,
  };

  // What `?keyword[$ne]=1` becomes under Express 4's default `qs` parser
  // (extended: true).
  it('rejects a qs-style nested-object value for a scalar field (Express 4 shape)', async () => {
    await expect(
      adSearchQueryValidationPipe.transform(
        { keyword: { $ne: '1' } },
        metadata
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a qs-style nested-object value on minPrice/maxPrice (Express 4 shape)', async () => {
    await expect(
      adSearchQueryValidationPipe.transform(
        { minPrice: { $gt: '0' } },
        metadata
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // What `?keyword[$ne]=1` becomes under Express 5's default `querystring`
  // parser (simple): the bracket syntax is not nested, it is kept as a
  // single literal key - `keyword` itself never appears in the object.
  it('rejects a querystring-style literal bracket key (Express 5 shape)', async () => {
    await expect(
      adSearchQueryValidationPipe.transform(
        { 'keyword[$ne]': '1' },
        metadata
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  // Repeated keys (`?category=a&category=b`) array-ify identically under
  // both qs and Node's querystring module - not an Express-4-vs-5
  // divergence, but still a shape neither AdSearchQueryDTO nor
  // AdsMongoFilterBuilder is meant to accept for a scalar field, so it's
  // worth pinning down alongside the two shapes above.
  it('rejects an array value for a scalar field (repeated-key shape, identical under both parsers)', async () => {
    await expect(
      adSearchQueryValidationPipe.transform(
        { category: ['cars', 'bikes'] },
        metadata
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
