export interface PaginatedResultMetadata {
  totalCount: number;
  page: number;
  perPage: number;
  pageCount: number;
  links: any[];
}

export interface PaginatedResult<T> {
  metadata?: PaginatedResultMetadata;
  records: Array<T>;
}
