import { NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

import { throwIfNullish } from './throw-if-nullish.operator';

describe('throwIfNullish', () => {
  it('passes a non-null value through unchanged', (done) => {
    of({ id: '1' })
      .pipe(throwIfNullish(() => new NotFoundException()))
      .subscribe((value) => {
        expect(value).toEqual({ id: '1' });
        done();
      });
  });

  it('throws the given error when the value is null', (done) => {
    of(null)
      .pipe(throwIfNullish(() => new NotFoundException('Ad not found')))
      .subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(NotFoundException);
          expect(err.message).toBe('Ad not found');
          done();
        },
      });
  });

  it('throws the given error when the value is undefined', (done) => {
    of(undefined)
      .pipe(throwIfNullish(() => new NotFoundException('Ad not found')))
      .subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(NotFoundException);
          done();
        },
      });
  });
});
