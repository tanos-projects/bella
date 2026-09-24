import { Observable, forkJoin, map } from 'rxjs';

import { PaginatedResultDTO } from '@bella/dtos';

const DEFAULT_PAGE_SIZE = 20;

export interface PageRequest {
  pageNum: number;
  pageSizeNum: number;
  skip: number;
}

/**
 * Extracted from `AdminPublicationController` (Phase 2, sub-point 6):
 * `getAllUnpublished`/`getAllPublished`/`getAllArchived` each repeated the
 * same `parsePagination` call and the same
 * `forkJoin([list$, count$]) -> {items, total, page, pageSize}` shape. Pure
 * extraction, no behavior change - reproduces the prior page/pageSize
 * parsing exactly (any non-positive or non-numeric pageSize falls back to
 * `DEFAULT_PAGE_SIZE`, not to 1).
 */
export function parsePagination(
  page?: string,
  pageSize?: string
): PageRequest {
  const pageNum = Math.max(1, Number(page) || 1);
  const parsedPageSize = Number(pageSize);
  const pageSizeNum = parsedPageSize > 0 ? parsedPageSize : DEFAULT_PAGE_SIZE;
  return { pageNum, pageSizeNum, skip: (pageNum - 1) * pageSizeNum };
}

export function toPaginatedResult<T>(
  items$: Observable<T[]>,
  total$: Observable<number>,
  page: PageRequest
): Observable<PaginatedResultDTO<T>> {
  return forkJoin([items$, total$]).pipe(
    map(([items, total]) => ({
      items,
      total,
      page: page.pageNum,
      pageSize: page.pageSizeNum,
    }))
  );
}
