import { QualitiesService } from './qualities.service';

// QualitiesService performs no HTTP call: it resolves a hardcoded, static
// list via `of(...)`. There is no HTTP error path to cover and only one
// code path exists, so the two cases below cover the actual contract
// instead: the exact list content, and that repeated calls don't share or
// leak mutable state between callers.
describe('QualitiesService', () => {
  let service: QualitiesService;

  beforeEach(() => {
    service = new QualitiesService();
  });

  it('resolves the fixed list of qualities (success case)', () => {
    let qualities: unknown;
    service.getAll().subscribe((res) => (qualities = res));

    expect(qualities).toEqual([
      { code: 'NEW', label: 'Neuf' },
      { code: 'VERY_GOOD', label: 'Très bon' },
      { code: 'GOOD', label: 'Bon' },
      { code: 'MIDDLE', label: 'Satisfaisant' },
    ]);
  });

  it('returns an independent array on every call (no shared mutable state)', () => {
    let first: unknown;
    let second: unknown;
    service.getAll().subscribe((res) => (first = res));
    service.getAll().subscribe((res) => (second = res));

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});
