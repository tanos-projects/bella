import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TitledPageModule } from '../../shared/layouts/titled-page/titled-page.module';
import { BookmarksRoutingModule } from './bookmarks-routing.module';
import { BookmarksComponent } from './bookmarks.component';

@NgModule({
  declarations: [BookmarksComponent],
  imports: [CommonModule, BookmarksRoutingModule, TitledPageModule]
})
export class BookmarksModule {}
