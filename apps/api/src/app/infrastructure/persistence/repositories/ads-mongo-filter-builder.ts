import { FilterCriteria } from '@bella/api/domain';

/**
 * Translates the domain-level `FilterCriteria` used by `AdsService` into the
 * Mongo query shape `AdsRepositoryNest` hands to `Model.find`/`countDocuments`.
 *
 * Extracted from `AdsRepositoryNest` (Phase 2, sub-point 1) to fix an OCP
 * violation: `findAll`/`count` used to duplicate two private methods
 * (`manageKeyword`/`managePrice`) operating on an untyped `filterToUse: any`.
 * Adding a new search criterion meant editing those methods directly instead
 * of extending something open to it. This class is a pure, side-effect-free
 * translator, independently testable without mocking the Mongoose model.
 */
export class AdsMongoFilterBuilder {
  build(filter?: FilterCriteria): any {
    let filterToUse: any = { ...filter };

    filterToUse = this.manageKeyword(filterToUse);
    filterToUse = this.managePrice(filterToUse);

    return filterToUse;
  }

  private manageKeyword(filter: any): any {
    const { keyword } = filter;
    let shallowCopy = {
      ...filter,
    };

    if (keyword) {
      delete shallowCopy['keyword'];
      shallowCopy = {
        ...shallowCopy,
        $text: {
          $search: keyword,
        },
      };
    }

    return shallowCopy;
  }

  private managePrice(filter: any): any {
    const shallowCopy = { ...filter };
    const { minPrice, maxPrice } = shallowCopy;

    if (minPrice) {
      if (!shallowCopy['price']) shallowCopy['price'] = {};
      shallowCopy['price']['$gte'] = minPrice;
      delete shallowCopy['minPrice'];
    }
    if (maxPrice) {
      if (!shallowCopy['price']) shallowCopy['price'] = {};
      shallowCopy['price']['$lte'] = maxPrice;
      delete shallowCopy['maxPrice'];
    }

    return shallowCopy;
  }
}
