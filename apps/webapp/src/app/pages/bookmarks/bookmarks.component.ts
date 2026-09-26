import { Component } from '@angular/core';
import { TitledPageComponent } from '../../shared/layouts/titled-page/titled-page.component';

@Component({
  selector: 'bella-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss'],
  standalone: true,
  imports: [TitledPageComponent],
})
export class BookmarksComponent {}
