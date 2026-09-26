import { Component } from '@angular/core';
import { FooterToolbarActionComponent } from '../buttons/footer-toolbar-action/footer-toolbar-action.component';

@Component({
  selector: 'bella-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [FooterToolbarActionComponent],
})
export class FooterComponent {}
