import { Injectable, inject } from '@angular/core';
import { PublicationsStore } from './publications.store';

@Injectable()
export class PublicationsState {
  private state = inject(PublicationsStore);

  readonly unpublished$ = this.state.unpublished$;
  readonly published$ = this.state.published$;
  readonly archived$ = this.state.archived$;
  readonly actionResult$ = this.state.actionResult$;
}
