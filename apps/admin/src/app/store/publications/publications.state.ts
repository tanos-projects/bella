import { Injectable } from '@angular/core';
import { PublicationsStore } from './publications.store';

@Injectable()
export class PublicationsState {
  readonly unpublished$ = this.state.unpublished$;


  constructor(private state: PublicationsStore) { }

}
