import { NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

import { SidenavComponent } from './sidenav.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [RouterModule, MatSidenavModule, MatListModule, MatIconModule],
  exports: [SidenavComponent],
  declarations: [SidenavComponent],
  providers: [],
})
export class SidenavModule {}
