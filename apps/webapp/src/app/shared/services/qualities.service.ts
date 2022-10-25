import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CodeLabel } from '../models/code-label.model';

@Injectable({ providedIn: 'root' })
export class QualitiesService {
  getAll(): Observable<CodeLabel[]> {
    return of([
      { code: 'NEW', label: 'Neuf' },
      { code: 'VERY_GOOD', label: 'Très bon' },
      { code: 'GOOD', label: 'Bon' },
      { code: 'MIDDLE', label: 'Satisfaisant' }
    ]);
  }
}
