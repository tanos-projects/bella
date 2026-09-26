import { of } from 'rxjs';

import { parsePagination, toPaginatedResult } from './paginated-result.helper';

describe('parsePagination', () => {
  it('defaults to page 1 / pageSize 20 when no query params are given', () => {
    expect(parsePagination(undefined, undefined)).toEqual({
      pageNum: 1,
      pageSizeNum: 20,
      skip: 0,
    });
  });

  it('computes skip from an explicit page and pageSize', () => {
    expect(parsePagination('3', '10')).toEqual({
      pageNum: 3,
      pageSizeNum: 10,
      skip: 20,
    });
  });

  it('falls back to page 1 when page is not a number', () => {
    expect(parsePagination('abc', '10').pageNum).toBe(1);
  });

  it('clamps a negative or zero page to 1 instead of computing a negative skip', () => {
    expect(parsePagination('-5', '10').pageNum).toBe(1);
    expect(parsePagination('0', '10').pageNum).toBe(1);
  });

  it('falls back a zero, negative, or non-numeric pageSize to the 20 default, not to 1', () => {
    expect(parsePagination('1', '0').pageSizeNum).toBe(20);
    expect(parsePagination('1', '-3').pageSizeNum).toBe(20);
    expect(parsePagination('1', 'abc').pageSizeNum).toBe(20);
  });
});

describe('toPaginatedResult', () => {
  it('combines the listed items and the total count with the page metadata', (done) => {
    toPaginatedResult(of(['a', 'b']), of(42), {
      pageNum: 2,
      pageSizeNum: 10,
      skip: 10,
    }).subscribe((result) => {
      expect(result).toEqual({
        items: ['a', 'b'],
        total: 42,
        page: 2,
        pageSize: 10,
      });
      done();
    });
  });
});
