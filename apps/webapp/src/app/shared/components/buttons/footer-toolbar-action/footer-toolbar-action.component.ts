import { Component, Input } from '@angular/core';

@Component({
  selector: 'bella-footer-toolbar-action',
  templateUrl: './footer-toolbar-action.component.html',
  styleUrls: ['./footer-toolbar-action.component.scss'],
  standalone: false,
})
export class FooterToolbarActionComponent {
  @Input() label!: string;
  @Input() icon!: string;
  // @Input() klass = ''; // FIXME find a better way to introduce this if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() action!: any[] | string; // TODO to type
}
