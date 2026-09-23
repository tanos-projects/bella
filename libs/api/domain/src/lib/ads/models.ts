import { AdEntity } from './ad.entity';

export type FilterCriteria = Partial<AdEntity>;

export interface FilterOptions {
  limit?: number;
  skip?: number;
  populate?: string[];
}
