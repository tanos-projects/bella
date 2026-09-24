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
});
