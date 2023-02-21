import { NgModule } from '@angular/core';
import { PublicationsStoreModule } from './publications/publications-store.module';

@NgModule({
  imports: [PublicationsStoreModule.forRoot()],
  exports: [PublicationsStoreModule],
})
export class StoreModule {}
