import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthCustomService } from '../../auth/auth-custom.service';

@Component({
  selector: 'bella-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule],
})
export class AccessDeniedComponent {
  public auth = inject(AuthCustomService);
}
