import { AdEntity } from './ad.entity';

export type FilterCriteria = Partial<AdEntity>;

export interface FilterOptions {
  limit?: number;
  populate?: string[];
}
