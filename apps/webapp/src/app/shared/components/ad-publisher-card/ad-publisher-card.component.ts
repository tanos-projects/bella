import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthUser } from '../../../auth/auth-user.model';

@Component({
  selector: 'bella-ad-publisher-card',
  templateUrl: './ad-publisher-card.component.html',
  styleUrls: ['./ad-publisher-card.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class AdPublisherCardComponent {
  @Input() user: AuthUser;
}
