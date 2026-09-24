import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TitledPageComponent } from '../../shared/layouts/titled-page/titled-page.component';
import { BookmarksRoutingModule } from './bookmarks-routing.module';
import { BookmarksComponent } from './bookmarks.component';

@NgModule({
  declarations: [BookmarksComponent],
  imports: [CommonModule, BookmarksRoutingModule, TitledPageComponent]
})
export class BookmarksModule {}
