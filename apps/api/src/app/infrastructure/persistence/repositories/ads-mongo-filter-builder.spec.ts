import { AdsMongoFilterBuilder } from './ads-mongo-filter-builder';

describe('AdsMongoFilterBuilder', () => {
  let builder: AdsMongoFilterBuilder;

  beforeEach(() => {
    builder = new AdsMongoFilterBuilder();
  });

  it('passes an empty/undefined filter through untouched', () => {
    expect(builder.build()).toEqual({});
    expect(builder.build({})).toEqual({});
  });

  it('translates a keyword filter into a Mongo $text search', () => {
    expect(builder.build({ keyword: 'bike' } as any)).toEqual({
      $text: { $search: 'bike' },
    });
  });

  it('leaves the filter untouched when keyword is falsy', () => {
    expect(builder.build({ keyword: '' } as any)).toEqual({ keyword: '' });
  });

  it('translates minPrice into $gte on price', () => {
    expect(builder.build({ minPrice: 10 } as any)).toEqual({
      price: { $gte: 10 },
    });
  });

  it('translates maxPrice into $lte on price', () => {
    expect(builder.build({ maxPrice: 100 } as any)).toEqual({
      price: { $lte: 100 },
    });
  });

  it('translates minPrice/maxPrice together into $gte/$lte on the same price object', () => {
    expect(builder.build({ minPrice: 10, maxPrice: 100 } as any)).toEqual({
      price: { $gte: 10, $lte: 100 },
    });
  });

  it('combines a keyword and a price range in the same call', () => {
    expect(
      builder.build({ keyword: 'bike', minPrice: 10, maxPrice: 100 } as any)
    ).toEqual({
      $text: { $search: 'bike' },
      price: { $gte: 10, $lte: 100 },
    });
  });

  it('leaves unrelated filter fields untouched', () => {
    expect(builder.build({ owner: 'user-1' } as any)).toEqual({
      owner: 'user-1',
    });
  });
});
