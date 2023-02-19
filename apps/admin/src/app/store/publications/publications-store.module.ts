import { ModuleWithProviders, NgModule } from '@angular/core';

import { PublicationsActions } from './publications.action';
import { PublicationsEffects } from './publications.effects';
import { PublicationsState } from './publications.state';
import { PublicationsStore } from './publications.store';

@NgModule({
  imports: [],
})
export class PublicationsStoreModule {
  static forRoot(): ModuleWithProviders<PublicationsStoreModule> {
    console.log('Load PublicationsStoreModule')
    return {
      ngModule: PublicationsStoreModule,
      providers: [PublicationsActions, PublicationsEffects, PublicationsState, PublicationsStore, ],
    };
  }
}
