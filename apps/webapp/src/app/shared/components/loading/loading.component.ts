import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';
import { LoadingService } from './loading.service';

@Component({
  selector: 'bella-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
})
export class LoadingComponent {
  private loadingService = inject(LoadingService);

  isLoading$ = this.loadingService.isLoading$;
}
