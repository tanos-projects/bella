import { Component } from '@angular/core';
import { AuthCustomService } from '../../auth/auth-custom.service';

@Component({
  selector: 'bella-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
  standalone: false,
})
export class AccessDeniedComponent {
  constructor(public auth: AuthCustomService) {}
}
