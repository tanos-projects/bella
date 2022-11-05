import { Component, Input } from '@angular/core';
import { AuthUser } from '../../../auth/auth-user.model';

@Component({
  selector: 'bella-ad-publisher-card',
  templateUrl: './ad-publisher-card.component.html',
  styleUrls: ['./ad-publisher-card.component.scss'],
})
export class AdPublisherCardComponent {
  @Input() user: AuthUser;
}
