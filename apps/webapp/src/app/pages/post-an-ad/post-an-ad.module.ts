import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostAnAdRoutingModule } from './post-an-ad-routing.module';
import { PostAnAdComponent } from './post-an-ad.component';

@NgModule({
  imports: [CommonModule, PostAnAdRoutingModule, PostAnAdComponent]
})
export class PostAnAdModule {}
